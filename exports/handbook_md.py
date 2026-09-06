"""
Shared markdown-parsing helpers for the Fiuu Reload Handbook Word export.

Used by both render_diagrams.py (extracts ```mermaid blocks for browser
rendering) and build_docx.py (turns the full markdown corpus into the .docx).

This is a small, purpose-built parser for *this* handbook's markdown style
(plain CommonMark-ish, hand-written, no exotic extensions) -- not a general
CommonMark implementation.
"""
import os
import re
import glob

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------------------
# Chapter definitions
# ---------------------------------------------------------------------------
# Each chapter is (heading-1 title, base dir relative to repo root, exclude-dirs)
# README.md at repo root is handled separately as the "Introduction" chapter.

CHAPTERS = [
    ("Architecture — reload", "architecture/reload", []),
    ("Architecture — reload_db", "architecture/reload_db", []),
    ("Coding Conventions", "conventions", []),
    ("GitLab History & Synthesis", "gitlab-analysis", ["raw"]),
    ("Glossary", "glossary", []),
]

INTRO_FILE = "README.md"


def list_chapter_files(base_dir, exclude_dirs=()):
    """Return relative (posix, from repo root) file paths in a sensible
    reading order: root-level .md files first (alphabetical -- README.md
    sorts first since 'R' < lowercase letters), then each subfolder in
    alphabetical order, files within it alphabetical."""
    abs_base = os.path.join(REPO_ROOT, base_dir)
    root_files = []
    subdirs = {}
    for entry in sorted(os.listdir(abs_base)):
        full = os.path.join(abs_base, entry)
        if os.path.isdir(full):
            if entry in exclude_dirs or entry.startswith('.'):
                continue
            subdirs[entry] = full
        elif entry.lower().endswith('.md'):
            root_files.append(entry)

    result = []
    for f in sorted(root_files):
        result.append(posix_rel(os.path.join(abs_base, f)))
    for sub in sorted(subdirs):
        sub_files = sorted(
            f for f in os.listdir(subdirs[sub]) if f.lower().endswith('.md')
        )
        for f in sub_files:
            result.append(posix_rel(os.path.join(subdirs[sub], f)))
    return result


def posix_rel(abs_path):
    rel = os.path.relpath(abs_path, REPO_ROOT)
    return rel.replace(os.sep, '/')


def all_chapter_file_lists():
    """[(chapter_title, [relpaths...]), ...] including the Introduction chapter."""
    chapters = [("Introduction", [INTRO_FILE])]
    for title, base, exclude in CHAPTERS:
        chapters.append((title, list_chapter_files(base, exclude)))
    return chapters


def slug_for(relpath):
    return relpath[:-3].replace('/', '__') if relpath.endswith('.md') else relpath.replace('/', '__')


# ---------------------------------------------------------------------------
# Frontmatter stripping
# ---------------------------------------------------------------------------

_FRONTMATTER_RE = re.compile(r'^---\r?\n.*?\r?\n---\r?\n?', re.DOTALL)


def strip_frontmatter(text):
    m = _FRONTMATTER_RE.match(text)
    if m:
        return text[m.end():]
    return text


def read_body(relpath):
    with open(os.path.join(REPO_ROOT, relpath), encoding='utf-8') as f:
        return strip_frontmatter(f.read())


# ---------------------------------------------------------------------------
# Mermaid extraction
# ---------------------------------------------------------------------------

_MERMAID_FENCE_RE = re.compile(r'^```mermaid\s*$', re.MULTILINE)


def extract_mermaid_blocks(relpath):
    """Return [(slug, source_text), ...] for every ```mermaid fenced block
    in the file, in document order."""
    body = read_body(relpath)
    lines = body.split('\n')
    blocks = []
    i = 0
    count = 0
    while i < len(lines):
        if lines[i].strip() == '```mermaid':
            count += 1
            j = i + 1
            content = []
            while j < len(lines) and lines[j].strip() != '```':
                content.append(lines[j])
                j += 1
            slug = f"{slug_for(relpath)}-{count}"
            blocks.append((slug, '\n'.join(content)))
            i = j + 1
        else:
            i += 1
    return blocks


def all_mermaid_blocks():
    """[(relpath, slug, source), ...] across every in-scope file."""
    out = []
    for _, files in all_chapter_file_lists():
        for relpath in files:
            for slug, src in extract_mermaid_blocks(relpath):
                out.append((relpath, slug, src))
    return out


# ---------------------------------------------------------------------------
# Title map (for resolving [[wikilinks]] to readable titles)
# ---------------------------------------------------------------------------

_H1_RE = re.compile(r'^#\s+(.*)$', re.MULTILINE)


def build_title_map():
    """{relpath-without-.md: h1 title text} for every in-scope file, plus the
    same keyed without a leading 'architecture/' etc. is NOT done -- wikilinks
    in this repo always use the full repo-relative path without extension."""
    titles = {}
    for _, files in all_chapter_file_lists():
        for relpath in files:
            body = read_body(relpath)
            m = _H1_RE.search(body)
            key = relpath[:-3] if relpath.endswith('.md') else relpath
            if m:
                titles[key] = clean_inline_markup(m.group(1).strip())
            else:
                titles[key] = key.rsplit('/', 1)[-1]
    return titles


def clean_inline_markup(text):
    """Strip inline markdown markup down to plain text (used for titles)."""
    text = re.sub(r'`([^`]+)`', r'\1', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    return text
