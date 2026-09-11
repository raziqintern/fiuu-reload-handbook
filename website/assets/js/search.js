/* Fiuu Reload Academy — site-wide search.
   Fast, client-side, no build step at request time: searches lesson
   titles/tags (nav-data.js) AND full section text across every lesson
   (search-index.js, precomputed by website/scripts/build_search_index.py).
   Results render as text-snippet blocks — title, breadcrumb, highlighted
   excerpt — each linking straight to the matching page and section,
   the way a search-engine or Stack Overflow result list does. Press "/"
   anywhere on the site to jump straight into the search box. */

(function () {
  const IS_LESSON_DIR = location.pathname.includes("/lessons/");
  const MAX_RESULTS = 10;
  const SNIPPET_RADIUS = 90; // chars of context on each side of the match

  function fileHref(file) {
    return IS_LESSON_DIR ? file : "lessons/" + file;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function highlightAt(text, start, len) {
    return (
      escapeHtml(text.slice(0, start)) +
      "<mark>" + escapeHtml(text.slice(start, start + len)) + "</mark>" +
      escapeHtml(text.slice(start + len))
    );
  }

  // Builds a short excerpt of `text` centered on the first match of `q`,
  // with the match itself wrapped in <mark>. Falls back to the start of
  // the text if there's no match to center on (e.g. a heading-only hit).
  function snippet(text, q) {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) {
      const cut = text.length > SNIPPET_RADIUS * 2 ? text.slice(0, SNIPPET_RADIUS * 2) + "…" : text;
      return escapeHtml(cut);
    }
    const start = Math.max(0, idx - SNIPPET_RADIUS);
    const end = Math.min(text.length, idx + q.length + SNIPPET_RADIUS);
    const prefix = start > 0 ? "…" : "";
    const suffix = end < text.length ? "…" : "";
    const windowed = text.slice(start, end);
    const windowedIdx = idx - start;
    return prefix + highlightAt(windowed, windowedIdx, q.length) + suffix;
  }

  // --- Matching -------------------------------------------------------

  function matchLessonMeta(l, q) {
    const title = l.title.replace(/^\d+\.\s*/, "");
    const titleLower = title.toLowerCase();
    if (titleLower.includes(q)) {
      return {
        kind: "lesson",
        score: titleLower.startsWith(q) ? 6 : 5,
        file: l.file,
        track: l.trackTitle,
        title,
        heading: null,
        anchor: null,
        text: "",
      };
    }
    for (const t of l.tags || []) {
      if (t.toLowerCase().includes(q)) {
        return {
          kind: "lesson",
          score: 1.5,
          file: l.file,
          track: l.trackTitle,
          title,
          heading: null,
          anchor: null,
          text: t,
        };
      }
    }
    return null;
  }

  function matchSections(q) {
    const out = [];
    if (typeof SEARCH_INDEX === "undefined") return out;
    for (const e of SEARCH_INDEX) {
      const headingLower = e.heading.toLowerCase();
      const textLower = e.text.toLowerCase();
      let score = 0;
      if (headingLower.includes(q)) score = headingLower.startsWith(q) ? 4 : 3;
      else if (textLower.includes(q)) score = 2;
      if (score > 0) {
        out.push({
          kind: "section",
          score,
          file: e.file,
          track: e.track,
          title: e.title,
          heading: e.heading,
          anchor: e.anchor,
          text: e.text,
        });
      }
    }
    return out;
  }

  function search(query) {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results = [];
    for (const l of SITE_LESSONS_FLAT) {
      const m = matchLessonMeta(l, q);
      if (m) results.push(m);
    }
    results.push(...matchSections(q));
    results.sort((a, b) => b.score - a.score);

    // Collapse to at most one result per lesson, preferring the
    // highest-scoring match (a page-title hit beats a section snippet;
    // among equal-score section hits, keep the first / most relevant).
    const byFile = new Map();
    for (const r of results) {
      if (!byFile.has(r.file)) byFile.set(r.file, r);
    }
    return Array.from(byFile.values()).slice(0, MAX_RESULTS);
  }

  // --- Rendering --------------------------------------------------------

  function renderResults(box, results, q) {
    if (!results.length) {
      box.innerHTML = '<div class="search-empty">No matches for &ldquo;' + escapeHtml(q) + '&rdquo;. Try a shorter or different term.</div>';
      box.hidden = false;
      return;
    }
    box.innerHTML = results
      .map((r, i) => {
        const href = fileHref(r.file) + (r.anchor ? "#" + r.anchor : "");
        const crumb = r.heading
          ? `${escapeHtml(r.track)} &rsaquo; ${escapeHtml(r.title)} &rsaquo; ${escapeHtml(r.heading)}`
          : `${escapeHtml(r.track)} &rsaquo; ${escapeHtml(r.title)}`;
        const excerpt = r.text ? snippet(r.text, q) : "";
        return `<a class="search-result${i === 0 ? " active" : ""}" href="${href}" data-idx="${i}">
          <span class="search-result-title">${escapeHtml(r.title)}</span>
          <span class="search-result-crumb">${crumb}</span>
          ${excerpt ? `<span class="search-result-snippet">${excerpt}</span>` : ""}
        </a>`;
      })
      .join("");
    box.hidden = false;
  }

  let shortcutBound = false;

  function init() {
    const host = document.getElementById("site-search");
    if (!host) return;
    host.innerHTML = `
      <input type="search" id="search-input" placeholder="Search the whole site... ( / )" autocomplete="off" aria-label="Search lessons">
      <div id="search-results" role="listbox" hidden></div>
    `;
    const input = document.getElementById("search-input");
    const box = document.getElementById("search-results");
    let activeIdx = 0;

    function close() {
      box.hidden = true;
      box.innerHTML = "";
    }

    input.addEventListener("input", () => {
      const results = search(input.value);
      activeIdx = 0;
      if (!input.value.trim()) {
        close();
        return;
      }
      renderResults(box, results, input.value.trim().toLowerCase());
    });

    input.addEventListener("keydown", (e) => {
      const items = box.querySelectorAll(".search-result");
      if (e.key === "Escape") {
        close();
        input.blur();
      } else if (e.key === "ArrowDown" && items.length) {
        e.preventDefault();
        activeIdx = Math.min(activeIdx + 1, items.length - 1);
        items.forEach((it, i) => it.classList.toggle("active", i === activeIdx));
        items[activeIdx].scrollIntoView({ block: "nearest" });
      } else if (e.key === "ArrowUp" && items.length) {
        e.preventDefault();
        activeIdx = Math.max(activeIdx - 1, 0);
        items.forEach((it, i) => it.classList.toggle("active", i === activeIdx));
        items[activeIdx].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter" && items.length) {
        e.preventDefault();
        window.location.href = items[activeIdx].getAttribute("href");
      }
    });

    document.addEventListener("click", (e) => {
      if (!host.contains(e.target)) close();
    });

    // Global "/" shortcut to focus search, unless already typing somewhere.
    // Bound once via delegation (not on the input, which gets recreated
    // every time renderHeader() re-runs, e.g. after "mark complete").
    if (!shortcutBound) {
      shortcutBound = true;
      document.addEventListener("keydown", (e) => {
        if (e.key !== "/") return;
        const active = document.activeElement.tagName;
        if (active === "INPUT" || active === "TEXTAREA") return;
        const liveInput = document.getElementById("search-input");
        if (!liveInput) return;
        e.preventDefault();
        liveInput.focus();
      });
    }
  }

  // site.js calls this explicitly right after it (re)renders the header,
  // since renderHeader() replaces #site-header's innerHTML wholesale
  // (initial load, and again after every "mark complete" click) — a plain
  // DOMContentLoaded listener here would either fire too early (before
  // #site-search exists) or miss later re-renders entirely.
  window.initSiteSearch = init;
})();
