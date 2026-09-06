# Website — Fiuu Reload Academy

A w3schools-style teaching site: "How to become a Fiuu software engineer" —
interactive, example-driven lessons built from the `architecture/`,
`conventions/`, and `gitlab-analysis/` content once it existed.

Open `index.html` directly, or serve the folder with any static file server
(e.g. `python -m http.server 8934 --directory website`) and visit
`http://localhost:8934`.

## What's here

50 lessons across 11 tracks, plus a home page and a searchable glossary:

- **HTML Basics** / **JavaScript Basics** — generic fundamentals, with real
  live "Try it Yourself" execution (HTML preview, sandboxed JS console).
- **Algorithms & Data Structures** — Big O, arrays, searching, sorting,
  recursion, stacks/queues/dictionaries — language-agnostic, with live JS
  demos (including literally counting search steps to make Big O concrete).
- **C# Fundamentals** / **VB.NET Fundamentals** — generic language
  fundamentals. No live compiler is available client-side without a hosted
  backend, so these use "Predict → Reveal": guess the output, then reveal the
  verified real answer.
- **SQL & reload_db** — real, live SQL execution via [sql.js](https://sql.js.org)
  (SQLite compiled to WebAssembly, loaded from cdnjs), pre-seeded with a
  practice schema shaped like reload_db, then the actual reload_db estate
  shape and SQL-side conventions.
- **Software Design & Best Practices** — OOP, SOLID, the design patterns
  (Service Locator, Template Method, Repository) already hiding in reload's
  real code, Git, code review, testing, and security basics — including a
  live SQL-injection demo run against this site's own practice database.
- **Fiuu C# Conventions**, **Debugging Reload**, **Architecture Map**,
  **Glossary** — reverse-engineered directly from this repo's own
  `conventions/`, `gitlab-analysis/`, and `architecture/` docs. Real
  file:line-cited snippets, real quoted review comments, real incidents —
  not invented examples.

## Structure

```
website/
  index.html              home page
  lessons/*.html          all 37 lessons (flat directory, one level of relative paths)
  assets/css/style.css    the whole design system
  assets/js/nav-data.js   single source of truth for the sidebar/track/lesson list
  assets/js/site.js       header/sidebar/prev-next rendering, localStorage progress
  assets/js/tryit.js      the "Try it Yourself" engine (html/js/sql/reveal modes)
  assets/js/quiz.js       inline MCQ / predict-the-output quiz engine
```

No build step, no framework, no server required — everything is plain
HTML/CSS/JS, and progress tracking lives in the visitor's own browser
(`localStorage`), not a database.

## Status

First full pass complete (2026-09-06): engine + all 37 lessons written and
verified in-browser (live HTML/JS/SQL execution confirmed working, reveal
mode confirmed working, progress tracking and sidebar navigation confirmed
working). Not yet deployed anywhere — works locally today; GitHub Pages would
be the natural next step if this should be reachable by URL.
