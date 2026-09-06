# Exports

Generated Word (.docx) documentation builds, produced from the markdown source
of truth in the other folders. Markdown stays canonical; docx is a rendered
export for sharing/printing.

## Current build

`Fiuu-Reload-Handbook.docx` — compiles, in order: the repo `README.md` (as an
"Introduction" chapter), `architecture/reload/**`, `architecture/reload_db/**`,
`conventions/**`, `gitlab-analysis/**` (excluding the gitignored `raw/` API
dumps), and `glossary/**`. Skips `.obsidian/`, `obsidian-vault/`, and `skills/`
(vault plumbing / Claude-session docs, not reader content).

- ~190 pages, ~48,700 words, 88 source docs, 38 embedded diagram images, 20
  tables.
- Title page + a real Word Table of Contents (heading-based `TOC` field,
  levels 1–4) + `Heading 1`–`Heading 4` styles mapped from the markdown's
  chapter / file-H1 / H2 / H3 structure, so the doc has actual navigable
  structure in Word's Navigation Pane, not just bold text.
- YAML frontmatter (`tags:`/`aliases:`) is stripped from every doc before
  rendering.
- `[[wikilink]]` cross-references are resolved to the target doc's real H1
  title (via a title map built from all in-scope files) and rendered as
  plain italic text — Word has no Obsidian-style backlinks, so there's no
  live navigation between chapters, but the reference reads naturally
  (e.g. a link to `architecture/reload/web-app` renders as its actual title,
  not the raw path).
- Every ` ```mermaid ` diagram was successfully rendered to a PNG and
  embedded inline (see "How it was built" below) — no text-fallback diagrams
  were needed in the current build.
- Markdown tables become real Word tables (shaded header row); fenced code
  blocks (C#/SQL/etc.) become shaded, bordered monospace paragraphs; bullet /
  numbered / checklist lists become real Word list styles (one level of
  nesting supported); blockquotes are indented + italicized; `---` rules
  become a thin horizontal divider.
- Inline file:line citations (e.g. `Database/Helpers/DBConnectionHelper.cs:12-26`)
  are left exactly as written in the source — not links, just visible text.

## How it was built

Three scripts, all under this folder:

1. **`handbook_md.py`** — shared helpers: which files go in which chapter and
   in what order (root files alphabetically, then subfolders alphabetically —
   this means `README.md` in a chapter folder always sorts first), YAML
   frontmatter stripping, and a title map (`relpath -> H1 text`) used to
   resolve `[[wikilinks]]`.

2. **`render_diagrams.py`** — extracts every ` ```mermaid ` fenced block from
   the in-scope docs and writes `_diagram_renders/render_all.html`, a page
   that loads Mermaid from a CDN, renders every diagram, and converts each
   rendered SVG to a PNG **client-side** (canvas, at up to 2400px on the long
   side — reading the SVG's own `viewBox` for the true size, since Mermaid's
   SVGs don't set width/height attributes and the browser's default
   intrinsic sizing badly downscales them otherwise). Each PNG is POSTed to
   a tiny local save server rather than round-tripped through a chat tool
   call (a base64 PNG per diagram would be enormous to pass back and forth).

3. **`_diagram_renders/save_server.py`** — a stdlib-only local HTTP server:
   serves `render_all.html` and saves whatever gets POSTed to `/save?name=...`
   as a file in the same (gitignored) folder.

4. **`build_docx.py`** — the actual markdown → docx conversion. A small
   hand-rolled block parser (headings, paragraphs, lists w/ one level of
   nesting, tables, fenced code, mermaid blocks, blockquotes, `---` rules)
   plus an inline-span parser (`**bold**`, `*italic*`, `` `code` ``,
   `[[wikilinks]]`, `[text](url)` — external `http(s)` links become real Word
   hyperlinks, internal relative links just render their link text). Looks
   up each mermaid block's pre-rendered PNG in `_diagram_renders/` by a
   deterministic slug (`<relpath-with-slashes-as-__>-<n>`); if a PNG is
   missing it falls back to an italic note ("Rendered diagram available in
   the Obsidian vault or on GitHub...") plus the raw Mermaid source in a
   monospace block, so the pipeline degrades gracefully if the browser step
   is skipped.

### Regenerating from scratch

```
python -m pip install python-docx pillow   # one-time

# 1. Only needed if diagram sources changed — re-render mermaid -> PNG.
#    Requires a browser; this repo's build used the Claude Code Browser
#    pane tools driving a local Chromium tab, but any browser works:
python exports/render_diagrams.py
python exports/_diagram_renders/save_server.py &         # separate terminal/background
#    then open http://localhost:8791/render_all.html and wait for the
#    on-page status line to read "ALL DONE ok=<n> err=0" — check the
#    _diagram_renders/*.png count matches the number of mermaid blocks.

# 2. Build the docx (safe to re-run any time markdown changes; does not
#    require the browser step if _diagram_renders/*.png already exist):
python exports/build_docx.py
```

The build script does not update the Word `TOC` field's page numbers itself
(python-docx can only insert the field, not run Word's layout engine) — Word
does this automatically on open because the doc's settings set
`updateFields`, so opening it in real Word and clicking through the "update
this field?" prompt (or pressing F9 on the TOC) refreshes it. If you have
Word installed, you can also do this headlessly via COM automation
(`Word.Application`, `Documents.Open`, `.Fields.Update()`, `.Save()`), which
is how this build's page count was verified (190 pages via
`ComputeStatistics`).

### Known rough edges

- Nested lists only render one level deep (matches what the source markdown
  actually uses — deeper nesting isn't present in this handbook).
- The mermaid → PNG conversion path was chosen after the more "obvious"
  `<img>` + `canvas.toDataURL()` approach hit a `SecurityError: Tainted
  canvases may not be exported` in Chromium for flowchart-type diagrams
  (Mermaid's default `foreignObject`-based HTML labels taint the canvas).
  Fixed by setting `flowchart.htmlLabels: false` in `mermaid.initialize()`
  and using a base64 data URI instead of a blob URL for the intermediate
  `<img>` — both erDiagram and sequenceDiagram types rendered fine even
  without that flag, since they don't use `foreignObject` labels by default.
