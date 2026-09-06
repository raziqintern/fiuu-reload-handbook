/* Fiuu Reload Academy — inline jargon tooltips.
   Author markup: <a class="term" data-term="git" href="...">Git</a>
   (href optional — if omitted, terms.js fills in a sensible default link
   from the registry below, or falls back to a plain, unlinked <span>-like
   behavior by pointing at the term's own definition anchor on this page).
   This script only fills in the tooltip text (data-tooltip) and a default
   href when the author didn't specify one — it never invents new terms. */

const GLOSSARY_TERMS = {
  git: {
    tooltip: "A distributed version-control system: it tracks snapshots (commits) of a whole project over time so multiple people can work on the same code without overwriting each other's changes.",
    href: "design-04-git-basics.html",
  },
  "pull-request": {
    tooltip: "A proposal to merge one branch's commits into another (GitHub's term for what GitLab calls a Merge Request) — the unit reviewers actually comment on and approve.",
    href: "design-04-git-basics.html",
  },
  "merge-request": {
    tooltip: "GitLab's term for a proposal to merge one branch's commits into another — the unit reviewers actually comment on and approve. Reload's own repos use this term.",
    href: "design-04-git-basics.html",
  },
  api: {
    tooltip: "Application Programming Interface — a defined way for one piece of software to ask another to do something, without needing to know how it's implemented internally.",
    href: "https://developer.mozilla.org/en-US/docs/Glossary/API",
  },
  rest: {
    tooltip: "Representational State Transfer — a common style for web APIs where you interact with resources (like \"a transaction\") using standard HTTP verbs (GET, POST, PUT, DELETE) over URLs.",
    href: "https://developer.mozilla.org/en-US/docs/Glossary/REST",
  },
  http: {
    tooltip: "HyperText Transfer Protocol — the request/response protocol web browsers, APIs, and servers use to talk to each other over a network.",
    href: "https://developer.mozilla.org/en-US/docs/Web/HTTP",
  },
  json: {
    tooltip: "JavaScript Object Notation — a lightweight text format for structured data (objects and arrays of key/value pairs) used constantly for API request/response bodies and reload's own logged payloads.",
    href: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON",
  },
  linq: {
    tooltip: "Language Integrated Query — C#'s built-in syntax for filtering, transforming, and aggregating collections (.Where, .Select, .Sum, ...) without writing manual loops.",
    href: "cs-06-collections-linq.html",
  },
  orm: {
    tooltip: "Object-Relational Mapper — a library that maps database rows to objects in code automatically. Reload notably does NOT use one — see Data Access.",
    href: "conv-05-data-access.html",
  },
  "stored-procedure": {
    tooltip: "A named, precompiled block of SQL stored inside the database itself, called by name instead of sending raw SQL text — reload's only data-access mechanism.",
    href: "conv-05-data-access.html",
  },
  dll: {
    tooltip: "Dynamic-Link Library — a compiled .NET binary containing reusable code, referenced by other projects without recompiling the source. reload's class-library commits several prebuilt DLLs directly into its repo root.",
    href: "theory-08-assemblies-dlls.html",
  },
  solid: {
    tooltip: "Five OOP design principles (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion) aimed at code that's easier to change safely.",
    href: "design-02-solid.html",
  },
  oop: {
    tooltip: "Object-Oriented Programming — organizing code around objects that bundle data and behavior together, built on encapsulation, inheritance, polymorphism, and abstraction.",
    href: "design-01-oop-pillars.html",
  },
  "sql-injection": {
    tooltip: "A security vulnerability where untrusted input is interpreted as part of a SQL query's syntax instead of as plain data, letting an attacker alter what the query actually does.",
    href: "design-07-security-basics.html",
  },
  gc: {
    tooltip: "Garbage Collector — the .NET runtime component that automatically frees memory used by objects nothing references anymore, so you don't manually deallocate memory like in C/C++.",
    href: null,
  },
  "async-await": {
    tooltip: "C#/VB.NET keywords for writing code that waits on a slow operation (a network call, a file read) without blocking the thread it's running on.",
    href: null,
  },
  cors: {
    tooltip: "Cross-Origin Resource Sharing — a browser security mechanism that blocks a web page from making requests to a different domain unless that domain explicitly allows it.",
    href: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS",
  },
};

(function () {
  function apply() {
    document.querySelectorAll(".term[data-term]").forEach((el) => {
      const key = el.getAttribute("data-term");
      const info = GLOSSARY_TERMS[key];
      if (!info) return;
      if (!el.getAttribute("data-tooltip")) el.setAttribute("data-tooltip", info.tooltip);
      if (el.tagName === "A" && !el.getAttribute("href") && info.href) {
        el.setAttribute("href", info.href);
        if (info.href.startsWith("http")) {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener");
        }
      }
    });
  }
  document.addEventListener("DOMContentLoaded", apply);
})();
