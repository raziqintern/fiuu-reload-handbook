/* Fiuu Reload Academy — site-wide search.
   Fast, client-side, no build step: searches lesson titles, track
   titles, and each lesson's `tags` array (see nav-data.js). Press "/"
   anywhere on the site to jump straight into the search box. */

(function () {
  const IS_LESSON_DIR = location.pathname.includes("/lessons/");

  function lessonHref(l) {
    return IS_LESSON_DIR ? l.file : "lessons/" + l.file;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function highlight(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return escapeHtml(text);
    return (
      escapeHtml(text.slice(0, idx)) +
      "<mark>" + escapeHtml(text.slice(idx, idx + query.length)) + "</mark>" +
      escapeHtml(text.slice(idx + query.length))
    );
  }

  // Score + match a single lesson against a lowercased query.
  function matchLesson(l, q) {
    const title = l.title.replace(/^\d+\.\s*/, "");
    const titleLower = title.toLowerCase();
    const trackLower = l.trackTitle.toLowerCase();
    const tags = l.tags || [];

    if (titleLower.includes(q)) {
      return { lesson: l, score: titleLower.startsWith(q) ? 3 : 2, matchedOn: title, field: "title" };
    }
    for (const t of tags) {
      if (t.toLowerCase().includes(q)) {
        return { lesson: l, score: 1, matchedOn: t, field: "tag" };
      }
    }
    if (trackLower.includes(q)) {
      return { lesson: l, score: 0.5, matchedOn: l.trackTitle, field: "track" };
    }
    return null;
  }

  function search(query) {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results = [];
    for (const l of SITE_LESSONS_FLAT) {
      const m = matchLesson(l, q);
      if (m) results.push(m);
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 12);
  }

  function renderResults(box, results, q) {
    if (!results.length) {
      box.innerHTML = '<div class="search-empty">No matches for &ldquo;' + escapeHtml(q) + '&rdquo;. Try a shorter or different term.</div>';
      box.hidden = false;
      return;
    }
    box.innerHTML = results
      .map((r, i) => {
        const l = r.lesson;
        const sub =
          r.field === "title"
            ? l.trackTitle
            : r.field === "tag"
            ? l.trackTitle + " &middot; " + highlight(r.matchedOn, q)
            : "Track: " + highlight(r.matchedOn, q);
        return `<a class="search-result${i === 0 ? " active" : ""}" href="${lessonHref(l)}" data-idx="${i}">
          <span class="search-result-title">${highlight(l.title.replace(/^\d+\.\s*/, ""), q)}</span>
          <span class="search-result-sub">${sub}</span>
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
      <input type="search" id="search-input" placeholder="Search lessons... ( / )" autocomplete="off" aria-label="Search lessons">
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
