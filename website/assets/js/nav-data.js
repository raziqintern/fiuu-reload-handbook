/* Fiuu Reload Academy — single source of truth for site navigation.
   Every lesson page includes this script, then site.js renders the
   sidebar/header/footer from it and highlights the page whose id
   matches <body data-page="...">. */

const SITE_TRACKS = [
  {
    id: "html",
    title: "HTML Basics",
    lessons: [
      { id: "html-01-structure", title: "1. Page Structure & Tags", file: "html-01-structure.html" },
      { id: "html-02-text-links", title: "2. Text, Links & Images", file: "html-02-text-links.html" },
      { id: "html-03-forms", title: "3. Forms & Inputs", file: "html-03-forms.html" },
      { id: "html-04-tables", title: "4. Tables & Reading Real Markup", file: "html-04-tables.html" },
    ],
  },
  {
    id: "js",
    title: "JavaScript Basics",
    lessons: [
      { id: "js-01-syntax", title: "1. Variables & Syntax", file: "js-01-syntax.html" },
      { id: "js-02-control-flow", title: "2. Conditionals & Loops", file: "js-02-control-flow.html" },
      { id: "js-03-functions", title: "3. Functions & Scope", file: "js-03-functions.html" },
      { id: "js-04-arrays-objects", title: "4. Arrays & Objects", file: "js-04-arrays-objects.html" },
      { id: "js-05-dom-debug", title: "5. DOM, Events & the Console", file: "js-05-dom-debug.html" },
    ],
  },
  {
    id: "algo",
    title: "Algorithms & Data Structures",
    lessons: [
      { id: "algo-01-big-o", title: "1. Big O Notation", file: "algo-01-big-o.html" },
      { id: "algo-02-arrays-time", title: "2. Arrays & Time Complexity", file: "algo-02-arrays-time.html" },
      { id: "algo-03-searching", title: "3. Searching: Linear vs. Binary", file: "algo-03-searching.html" },
      { id: "algo-04-sorting", title: "4. Sorting: How & Why", file: "algo-04-sorting.html" },
      { id: "algo-05-recursion", title: "5. Recursion", file: "algo-05-recursion.html" },
      { id: "algo-06-stacks-queues", title: "6. Stacks, Queues & Dictionaries", file: "algo-06-stacks-queues.html" },
    ],
  },
  {
    id: "csharp",
    title: "C# Fundamentals",
    lessons: [
      { id: "cs-01-syntax", title: "1. Syntax, Types & Variables", file: "cs-01-syntax.html" },
      { id: "cs-02-control-flow", title: "2. Control Flow & Loops", file: "cs-02-control-flow.html" },
      { id: "cs-03-methods", title: "3. Methods & Parameters", file: "cs-03-methods.html" },
      { id: "cs-04-classes", title: "4. Classes, Objects & Interfaces", file: "cs-04-classes.html" },
      { id: "cs-05-exceptions", title: "5. Exceptions & Try/Catch", file: "cs-05-exceptions.html" },
      { id: "cs-06-collections-linq", title: "6. Collections & LINQ", file: "cs-06-collections-linq.html" },
    ],
  },
  {
    id: "vbnet",
    title: "VB.NET Fundamentals",
    lessons: [
      { id: "vb-01-syntax", title: "1. Syntax vs. C#", file: "vb-01-syntax.html" },
      { id: "vb-02-control-flow", title: "2. Control Flow & Loops", file: "vb-02-control-flow.html" },
      { id: "vb-03-procedures", title: "3. Sub, Function & Classes", file: "vb-03-procedures.html" },
      { id: "vb-04-error-handling", title: "4. Try/Catch & Error Handling", file: "vb-04-error-handling.html" },
    ],
  },
  {
    id: "sql",
    title: "SQL & reload_db",
    lessons: [
      { id: "sql-01-basics", title: "1. SELECT, INSERT, UPDATE", file: "sql-01-basics.html" },
      { id: "sql-02-joins", title: "2. Joins & Filtering", file: "sql-02-joins.html" },
      { id: "sql-03-reload-db-shape", title: "3. How reload_db Is Organised", file: "sql-03-reload-db-shape.html" },
      { id: "sql-04-conventions", title: "4. Stored Procs, MAINT & NOLOCK", file: "sql-04-conventions.html" },
    ],
  },
  {
    id: "design",
    title: "Software Design & Best Practices",
    lessons: [
      { id: "design-01-oop-pillars", title: "1. OOP Pillars", file: "design-01-oop-pillars.html" },
      { id: "design-02-solid", title: "2. SOLID Principles", file: "design-02-solid.html" },
      { id: "design-03-patterns-in-reload", title: "3. Design Patterns reload Actually Uses", file: "design-03-patterns-in-reload.html" },
      { id: "design-04-git-basics", title: "4. Git & Version Control", file: "design-04-git-basics.html" },
      { id: "design-05-code-review", title: "5. Code Review Best Practices", file: "design-05-code-review.html" },
      { id: "design-06-testing", title: "6. Testing Fundamentals", file: "design-06-testing.html" },
      { id: "design-07-security-basics", title: "7. Security Basics", file: "design-07-security-basics.html" },
    ],
  },
  {
    id: "conventions",
    title: "Fiuu C# Conventions",
    lessons: [
      { id: "conv-01-naming", title: "1. Naming", file: "conv-01-naming.html" },
      { id: "conv-02-layering", title: "2. Layering: Provider/Service/Model", file: "conv-02-layering.html" },
      { id: "conv-03-error-handling", title: "3. Error Handling", file: "conv-03-error-handling.html" },
      { id: "conv-04-logging", title: "4. Logging", file: "conv-04-logging.html" },
      { id: "conv-05-data-access", title: "5. Data Access", file: "conv-05-data-access.html" },
      { id: "conv-06-config-secrets", title: "6. Configuration & Secrets", file: "conv-06-config-secrets.html" },
      { id: "conv-07-comments", title: "7. Comment Style", file: "conv-07-comments.html" },
    ],
  },
  {
    id: "debugging",
    title: "Debugging Reload",
    lessons: [
      { id: "dbg-01-logs", title: "1. Reading the Logs First", file: "dbg-01-logs.html" },
      { id: "dbg-02-pitfalls", title: "2. Known Patterns & Pitfalls", file: "dbg-02-pitfalls.html" },
      { id: "dbg-03-review-checklist", title: "3. What Reviewers Actually Flag", file: "dbg-03-review-checklist.html" },
      { id: "dbg-04-trace-a-bug", title: "4. Worked Example: Tracing a Bug", file: "dbg-04-trace-a-bug.html" },
    ],
  },
  {
    id: "architecture",
    title: "Architecture Map",
    lessons: [
      { id: "arch-01-reload", title: "1. reload: Topology & Modules", file: "arch-01-reload.html" },
      { id: "arch-02-reload-db", title: "2. reload_db: Topology & Modules", file: "arch-02-reload-db.html" },
    ],
  },
  {
    id: "glossary",
    title: "Glossary",
    lessons: [
      { id: "glossary", title: "Term Reference", file: "glossary.html" },
    ],
  },
];

// Flat ordered list, used for prev/next footer links.
const SITE_LESSONS_FLAT = SITE_TRACKS.flatMap((t) =>
  t.lessons.map((l) => ({ ...l, trackId: t.id, trackTitle: t.title }))
);

function siteLessonCount() {
  return SITE_LESSONS_FLAT.length;
}
