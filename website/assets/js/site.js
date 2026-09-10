/* Fiuu Reload Academy — shared layout: header, sidebar, prev/next, progress.
   Depends on nav-data.js being loaded first. Works from file:// or any
   static host — no fetch(), no build step. */

(function () {
  const CURRENT = document.body.getAttribute("data-page") || "";
  const IS_LESSON_DIR = location.pathname.includes("/lessons/");
  const ROOT = IS_LESSON_DIR ? "../" : "./";

  function isDone(id) {
    return localStorage.getItem("fra:done:" + id) === "1";
  }
  function setDone(id, val) {
    if (val) localStorage.setItem("fra:done:" + id, "1");
    else localStorage.removeItem("fra:done:" + id);
  }
  function doneCount() {
    return SITE_LESSONS_FLAT.filter((l) => isDone(l.id)).length;
  }

  function lessonHref(l) {
    return IS_LESSON_DIR ? l.file : "lessons/" + l.file;
  }

  function getTheme() {
    try {
      return localStorage.getItem("fra:theme");
    } catch (e) {
      return null;
    }
  }
  function setTheme(theme) {
    try {
      if (theme) localStorage.setItem("fra:theme", theme);
      else localStorage.removeItem("fra:theme");
    } catch (e) {}
    if (theme) document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
  }
  function isDarkNow() {
    const saved = getTheme();
    if (saved) return saved === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function renderHeader() {
    const host = document.getElementById("site-header");
    if (!host) return;
    const total = siteLessonCount();
    const done = doneCount();
    host.innerHTML = `
      <button id="menu-toggle" aria-label="Toggle navigation">☰</button>
      <a class="brand" href="${ROOT}index.html"><span class="bolt">⚡</span> Fiuu Reload Academy</a>
      <div id="site-search"></div>
      <div class="header-right">
        <span>${done}/${total} lessons complete</span>
        <a href="${IS_LESSON_DIR ? "glossary.html" : "lessons/glossary.html"}" style="color:#cfd4d2;">Glossary</a>
        <button id="theme-toggle" aria-label="Toggle dark mode">${isDarkNow() ? "☀" : "☾"}</button>
      </div>
    `;
    const toggle = document.getElementById("menu-toggle");
    toggle.addEventListener("click", () => document.body.classList.toggle("nav-open"));

    const themeBtn = document.getElementById("theme-toggle");
    themeBtn.addEventListener("click", () => {
      setTheme(isDarkNow() ? "light" : "dark");
      themeBtn.textContent = isDarkNow() ? "☀" : "☾";
    });

    // #site-search was just recreated above (renderHeader replaces the
    // whole header's innerHTML) — (re)wire the search box every time.
    if (window.initSiteSearch) window.initSiteSearch();
  }

  function renderSidebar() {
    const host = document.getElementById("site-sidebar");
    if (!host) return;
    const html = SITE_TRACKS.map((track) => {
      const containsCurrent = track.lessons.some((l) => l.id === CURRENT);
      const items = track.lessons
        .map((l) => {
          const active = l.id === CURRENT ? " active" : "";
          const check = isDone(l.id) ? " done" : "";
          return `<li><a class="${active.trim()}" href="${lessonHref(l)}"><span class="nav-check${check}"></span>${l.title}</a></li>`;
        })
        .join("");
      return `<details class="nav-track" ${containsCurrent ? "open" : ""}>
        <summary>${track.title}</summary>
        <ul>${items}</ul>
      </details>`;
    }).join("");
    host.innerHTML = html;
  }

  function renderFooter() {
    const host = document.getElementById("lesson-footer");
    if (!host || !CURRENT) return;
    const idx = SITE_LESSONS_FLAT.findIndex((l) => l.id === CURRENT);
    if (idx === -1) return;
    const prev = SITE_LESSONS_FLAT[idx - 1];
    const next = SITE_LESSONS_FLAT[idx + 1];
    const done = isDone(CURRENT);

    host.innerHTML = `
      <button id="mark-complete-btn" class="mark-complete ${done ? "done" : ""}">
        ${done ? "✓ Marked complete" : "Mark this lesson complete"}
      </button>
      <div class="prev-next">
        ${
          prev
            ? `<a class="pn-link prev" href="${prev.file}"><span class="pn-dir">← Previous</span><span class="pn-title">${prev.title}</span></a>`
            : `<span></span>`
        }
        ${
          next
            ? `<a class="pn-link next" href="${next.file}"><span class="pn-dir">Next →</span><span class="pn-title">${next.title}</span></a>`
            : `<span></span>`
        }
      </div>
    `;
    document.getElementById("mark-complete-btn").addEventListener("click", (e) => {
      const nowDone = !isDone(CURRENT);
      setDone(CURRENT, nowDone);
      e.target.classList.toggle("done", nowDone);
      e.target.textContent = nowDone ? "✓ Marked complete" : "Mark this lesson complete";
      renderHeader();
      renderSidebar();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderSidebar();
    renderFooter();
  });
})();
