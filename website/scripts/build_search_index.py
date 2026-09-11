#!/usr/bin/env python3
"""Builds website/assets/js/search-index.js from the real lesson HTML files.

Walks every website/lessons/*.html file (glossary.html excluded — its
content is rendered client-side from a JS array, not present in the
static markup) and extracts one search-index entry per h2/h3 section:
the lesson title, track, section heading, a slugified anchor id, and
the section's plain-text content (for substring matching + snippet
extraction at query time in search.js).

Re-run this script and commit the regenerated search-index.js whenever
lesson content changes. No third-party dependencies — stdlib only.
"""
import glob
import html
import json
import os
import re
from html.parser import HTMLParser

LESSONS_DIR = os.path.join(os.path.dirname(__file__), "..", "lessons")
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "assets", "js", "search-index.js")

# Tags whose text content is worth indexing for search snippets.
TEXT_TAGS = {"p", "li", "blockquote", "span", "td", "th", "strong", "em"}
# Tags/attrs to skip entirely (not useful or too noisy for search results).
SKIP_TAGS = {"script", "style"}
HEADING_TAGS = {"h2", "h3"}


def slugify(text, seen):
    s = text.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    s = s[:60].rstrip("-") or "section"
    base = s
    n = 2
    while s in seen:
        s = f"{base}-{n}"
        n += 1
    seen.add(s)
    return s


class LessonParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.track = ""
        self.title = ""
        self.sections = []  # list of dicts: heading, level, buf(list of str)
        self._tag_stack = []
        self._skip_depth = 0
        self._in_quiz_depth = None  # depth at which a quiz/tryit div started, else None
        self._capture_target = None  # 'track' | 'h1' | None
        self._current = None  # current section dict

    def _in_skippable(self):
        return self._skip_depth > 0 or self._in_quiz_depth is not None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self._tag_stack.append(tag)
        if tag in SKIP_TAGS:
            self._skip_depth += 1
            return
        if tag == "div":
            cls = attrs.get("class", "")
            if self._in_quiz_depth is None and ("quiz" in cls or "tryit" in cls):
                self._in_quiz_depth = len(self._tag_stack)
        if self._in_skippable():
            return
        if tag == "span" and attrs.get("class") == "track-label":
            self._capture_target = "track"
        elif tag == "h1":
            self._capture_target = "h1"
        elif tag in HEADING_TAGS:
            self._capture_target = "heading"
            self._current = {"heading_buf": [], "level": tag, "buf": []}

    def handle_endtag(self, tag):
        if self._tag_stack and self._tag_stack[-1] == tag:
            self._tag_stack.pop()
        if tag in SKIP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1
            return
        if tag == "div" and self._in_quiz_depth == len(self._tag_stack) + 1:
            self._in_quiz_depth = None
        if tag in HEADING_TAGS and self._capture_target == "heading":
            heading = " ".join("".join(self._current["heading_buf"]).split())
            if heading:
                self.sections.append({"heading": heading, "level": self._current["level"], "buf": self._current["buf"]})
            else:
                self._current = None
            self._capture_target = None
        elif tag == "h1" and self._capture_target == "h1":
            self._capture_target = None
        elif tag == "span" and self._capture_target == "track":
            self._capture_target = None

    def handle_data(self, data):
        if self._capture_target == "track":
            self.track += data
        elif self._capture_target == "h1":
            self.title += data
        elif self._capture_target == "heading" and self._current is not None:
            self._current["heading_buf"].append(data)
        elif self._current is not None and not self._in_skippable():
            self._current["buf"].append(data)


def clean_text(parts):
    text = " ".join(parts)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def build():
    entries = []
    files = sorted(glob.glob(os.path.join(LESSONS_DIR, "*.html")))
    for path in files:
        fname = os.path.basename(path)
        if fname == "glossary.html":
            continue
        with open(path, "r", encoding="utf-8") as f:
            raw = f.read()
        parser = LessonParser()
        parser.feed(raw)
        title = " ".join(parser.title.split())
        title = re.sub(r"^\d+\.\s*", "", title)
        track = " ".join(parser.track.split())
        seen_slugs = set()
        for sec in parser.sections:
            text = clean_text(sec["buf"])
            if not text:
                continue
            anchor = slugify(sec["heading"], seen_slugs)
            entries.append({
                "file": fname,
                "track": track,
                "title": title,
                "heading": sec["heading"],
                "anchor": anchor,
                "text": text[:700],
            })
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write("/* AUTO-GENERATED by website/scripts/build_search_index.py — do not hand-edit.\n")
        f.write("   Regenerate after any lesson content change:\n")
        f.write("     python website/scripts/build_search_index.py\n")
        f.write("   One entry per h2/h3 section across every lesson, used by search.js\n")
        f.write("   for full-text search with snippet + anchor-link results. */\n\n")
        f.write("const SEARCH_INDEX = ")
        f.write(json.dumps(entries, ensure_ascii=False, separators=(",", ":")))
        f.write(";\n")
    print(f"Indexed {len(entries)} sections across {len(files) - 1} lessons -> {OUT_PATH}")


if __name__ == "__main__":
    build()
