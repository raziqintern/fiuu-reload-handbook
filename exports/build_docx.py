"""
Builds exports/Fiuu-Reload-Handbook.docx from the handbook's markdown source.

Regeneration steps: see exports/README.md. Short version:
  1. (only if diagrams changed) re-run the render_diagrams.py pipeline to
     refresh exports/_diagram_renders/*.png
  2. python exports/build_docx.py

Requires: python -m pip install python-docx pillow
"""
import os
import re
import datetime

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT
from PIL import Image

import handbook_md as h

HERE = os.path.dirname(os.path.abspath(__file__))
DIAGRAM_DIR = os.path.join(HERE, '_diagram_renders')
OUT_PATH = os.path.join(HERE, 'Fiuu-Reload-Handbook.docx')

CODE_FONT = 'Consolas'
CODE_SIZE = Pt(9.5)

# ---------------------------------------------------------------------------
# Block-level markdown parser (purpose-built for this handbook's style)
# ---------------------------------------------------------------------------

LIST_ITEM_RE = re.compile(r'^(\s*)(?:(-)|(\d+)\.)\s+(.*)$')
CHECKLIST_RE = re.compile(r'^\[([ xX])\]\s+(.*)$')
HEADING_RE = re.compile(r'^(#{1,6})\s+(.*)$')
FENCE_RE = re.compile(r'^```\s*([A-Za-z0-9_+-]*)\s*$')
HR_RE = re.compile(r'^(-{3,}|\*{3,}|_{3,})\s*$')


def is_block_starter(line):
    if HEADING_RE.match(line):
        return True
    if FENCE_RE.match(line):
        return True
    if line.lstrip().startswith('|'):
        return True
    if line.lstrip().startswith('>'):
        return True
    if HR_RE.match(line):
        return True
    if LIST_ITEM_RE.match(line):
        return True
    return False


def is_separator_row(line):
    s = line.strip()
    if not s:
        return False
    return bool(re.fullmatch(r'[\s|:\-]+', s)) and '-' in s


def split_table_row(line):
    s = line.strip()
    if s.startswith('|'):
        s = s[1:]
    if s.endswith('|'):
        s = s[:-1]
    cells = []
    cur = []
    in_code = False
    for ch in s:
        if ch == '`':
            in_code = not in_code
            cur.append(ch)
        elif ch == '|' and not in_code:
            cells.append(''.join(cur).strip())
            cur = []
        else:
            cur.append(ch)
    cells.append(''.join(cur).strip())
    return cells


def parse_list_block(lines, start_idx):
    """Parses a run of list-item lines (bullets/numbers/checklists), with
    one level of nesting by indentation. Returns (items, next_idx)."""
    stack = []  # [(indent, item_dict)]
    top_items = []
    i = start_idx
    n = len(lines)
    while i < n:
        line = lines[i]
        if line.strip() == '':
            break
        m = LIST_ITEM_RE.match(line)
        if m:
            indent = len(m.group(1))
            is_number = m.group(3) is not None
            text = m.group(4)
            checked = None
            cm = CHECKLIST_RE.match(text)
            if cm and not is_number:
                checked = cm.group(1).lower() == 'x'
                text = cm.group(2)
                marker = 'check'
            else:
                marker = 'number' if is_number else 'bullet'
            item = {'text': text, 'children': [], 'checked': checked, 'marker': marker}
            while stack and stack[-1][0] >= indent:
                stack.pop()
            if stack:
                stack[-1][1]['children'].append(item)
            else:
                top_items.append(item)
            stack.append((indent, item))
            i += 1
        else:
            if stack and not is_block_starter(line):
                stack[-1][1]['text'] += ' ' + line.strip()
                i += 1
            else:
                break
    return top_items, i


def parse_blocks(body):
    lines = body.split('\n')
    n = len(lines)
    i = 0
    blocks = []
    mermaid_idx = 0
    while i < n:
        line = lines[i]
        if line.strip() == '':
            i += 1
            continue

        m = HEADING_RE.match(line)
        if m:
            blocks.append(('heading', len(m.group(1)), m.group(2).strip()))
            i += 1
            continue

        if HR_RE.match(line):
            blocks.append(('hr',))
            i += 1
            continue

        m = FENCE_RE.match(line)
        if m:
            lang = m.group(1).lower()
            j = i + 1
            content = []
            while j < n and lines[j].strip() != '```':
                content.append(lines[j])
                j += 1
            if lang == 'mermaid':
                mermaid_idx += 1
                blocks.append(('mermaid', mermaid_idx, content))
            else:
                blocks.append(('code', lang, content))
            i = j + 1
            continue

        if line.lstrip().startswith('>'):
            content = []
            while i < n and lines[i].lstrip().startswith('>'):
                content.append(re.sub(r'^\s*>\s?', '', lines[i]))
                i += 1
            blocks.append(('quote', content))
            continue

        if line.lstrip().startswith('|') and i + 1 < n and is_separator_row(lines[i + 1]):
            header = split_table_row(line)
            i += 2
            rows = []
            while i < n and lines[i].lstrip().startswith('|'):
                rows.append(split_table_row(lines[i]))
                i += 1
            blocks.append(('table', header, rows))
            continue

        if LIST_ITEM_RE.match(line):
            items, i = parse_list_block(lines, i)
            blocks.append(('list', items))
            continue

        para_lines = [line.strip()]
        i += 1
        while i < n and lines[i].strip() != '' and not is_block_starter(lines[i]):
            para_lines.append(lines[i].strip())
            i += 1
        blocks.append(('para', ' '.join(para_lines)))
    return blocks


# ---------------------------------------------------------------------------
# Inline markdown -> runs
# ---------------------------------------------------------------------------

INLINE_RE = re.compile(
    r'`(?P<code>[^`]+)`'
    r'|\[\[(?P<wikitarget>[^\]|]+)(?:\|(?P<wikialias>[^\]]+))?\]\]'
    r'|\[(?P<linktext>[^\]]*)\]\((?P<linkurl>[^)]+)\)'
    r'|\*\*(?P<bold>[^*]+)\*\*'
    r'|\*(?P<italic>[^*]+)\*'
)


def prettify_slug(key):
    name = key.rsplit('/', 1)[-1]
    name = name.replace('-', ' ').replace('_', ' ')
    return name[:1].upper() + name[1:] if name else key


def clean_markup(text):
    return h.clean_inline_markup(text)


def _plain_run(paragraph, text, bold=False, italic=False):
    if text == '':
        return
    run = paragraph.add_run(text)
    run.bold = bold
    run.italic = italic


def _code_run(paragraph, text, bold=False, italic=False):
    run = paragraph.add_run(text)
    run.font.name = CODE_FONT
    run.font.size = CODE_SIZE
    run.bold = bold
    run.italic = italic


def _nested_simple_runs(paragraph, content, bold, italic):
    """Used inside **bold**/*italic* spans: allow nested `code` only."""
    pos = 0
    for m in re.finditer(r'`([^`]+)`', content):
        if m.start() > pos:
            _plain_run(paragraph, content[pos:m.start()], bold, italic)
        _code_run(paragraph, m.group(1), bold, italic)
        pos = m.end()
    if pos < len(content):
        _plain_run(paragraph, content[pos:], bold, italic)


def add_hyperlink(paragraph, text, url):
    part = paragraph.part
    r_id = part.relate_to(url, RT.HYPERLINK, is_external=True)
    hyperlink = OxmlElement('w:hyperlink')
    hyperlink.set(qn('r:id'), r_id)
    new_run = OxmlElement('w:r')
    rPr = OxmlElement('w:rPr')
    color = OxmlElement('w:color')
    color.set(qn('w:val'), '0563C1')
    rPr.append(color)
    u = OxmlElement('w:u')
    u.set(qn('w:val'), 'single')
    rPr.append(u)
    new_run.append(rPr)
    t = OxmlElement('w:t')
    t.set(qn('xml:space'), 'preserve')
    t.text = text
    new_run.append(t)
    hyperlink.append(new_run)
    paragraph._p.append(hyperlink)


def add_inline_runs(paragraph, text, base_bold=False, base_italic=False, title_map=None):
    title_map = title_map or {}
    pos = 0
    for m in INLINE_RE.finditer(text):
        if m.start() > pos:
            _plain_run(paragraph, text[pos:m.start()], base_bold, base_italic)
        if m.group('code') is not None:
            _code_run(paragraph, m.group('code'), base_bold, base_italic)
        elif m.group('wikitarget') is not None:
            target = m.group('wikitarget').strip()
            alias = m.group('wikialias')
            if alias:
                display = alias.strip()
            else:
                key = target.lstrip('/')
                display = title_map.get(key, prettify_slug(key))
            run = paragraph.add_run(display)
            run.italic = True
            run.font.color.rgb = RGBColor(0x44, 0x44, 0x88)
        elif m.group('linkurl') is not None:
            ltext = m.group('linktext')
            url = m.group('linkurl').strip()
            if url.startswith('http://') or url.startswith('https://'):
                display = clean_markup(ltext).strip() or url
                add_hyperlink(paragraph, display, url)
            else:
                add_inline_runs(paragraph, ltext, base_bold, base_italic, title_map)
        elif m.group('bold') is not None:
            _nested_simple_runs(paragraph, m.group('bold'), True, base_italic)
        elif m.group('italic') is not None:
            _nested_simple_runs(paragraph, m.group('italic'), base_bold, True)
        pos = m.end()
    if pos < len(text):
        _plain_run(paragraph, text[pos:], base_bold, base_italic)


# ---------------------------------------------------------------------------
# Block renderers
# ---------------------------------------------------------------------------

def shade_paragraph(paragraph, fill='F2F2F2'):
    pPr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:fill'), fill)
    pPr.append(shd)


def box_paragraph(paragraph, color='BFBFBF', sz='4'):
    """Adds a thin border on all 4 sides -- used so consecutive shaded code
    blocks (back-to-back fenced snippets with no prose between them) read as
    visually distinct boxes instead of merging into one gray region."""
    pPr = paragraph._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    for side in ('top', 'left', 'bottom', 'right'):
        el = OxmlElement(f'w:{side}')
        el.set(qn('w:val'), 'single')
        el.set(qn('w:sz'), sz)
        el.set(qn('w:space'), '4')
        el.set(qn('w:color'), color)
        pBdr.append(el)
    pPr.append(pBdr)


def add_code_block(doc, lines):
    if not lines:
        return
    # Strip a single leading/trailing blank line often left by fences.
    while lines and lines[0].strip() == '':
        lines = lines[1:]
    while lines and lines[-1].strip() == '':
        lines = lines[:-1]
    if not lines:
        return
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(12)
    p.paragraph_format.left_indent = Inches(0.1)
    p.paragraph_format.right_indent = Inches(0.1)
    shade_paragraph(p)
    box_paragraph(p)
    for idx, line in enumerate(lines):
        run = p.add_run(line if line != '' else ' ')
        run.font.name = CODE_FONT
        run.font.size = CODE_SIZE
        if idx != len(lines) - 1:
            run.add_break()
    return p


def add_mermaid_fallback(doc, source_lines):
    note = doc.add_paragraph()
    run = note.add_run(
        'Rendered diagram available in the Obsidian vault or on GitHub (renders Mermaid natively).'
    )
    run.italic = True
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
    add_code_block(doc, source_lines)


def get_png_size(path):
    with Image.open(path) as im:
        return im.size


def add_diagram_image(doc, png_path):
    w_px, h_px = get_png_size(png_path)
    aspect = w_px / h_px if h_px else 1
    max_w, max_h = 6.3, 8.8
    w = max_w
    hgt = w / aspect
    if hgt > max_h:
        hgt = max_h
        w = hgt * aspect
    doc.add_picture(png_path, width=Inches(w), height=Inches(hgt))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER


def render_list_items(doc, items, title_map, depth=0):
    for item in items:
        if item['marker'] == 'number':
            style = 'List Number' if depth == 0 else 'List Number 2'
        else:
            style = 'List Bullet' if depth == 0 else 'List Bullet 2'
        p = doc.add_paragraph(style=style)
        if item['marker'] == 'check':
            prefix = '☑ ' if item['checked'] else '☐ '
            p.add_run(prefix)
        add_inline_runs(p, item['text'], title_map=title_map)
        if item['children']:
            render_list_items(doc, item['children'], title_map, depth + 1)


def add_table(doc, header, rows, title_map):
    ncols = len(header)
    if ncols == 0:
        return
    table = doc.add_table(rows=1, cols=ncols)
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = table.rows[0].cells
    for i, htext in enumerate(header):
        hdr_cells[i].text = ''
        add_inline_runs(hdr_cells[i].paragraphs[0], htext, base_bold=True, title_map=title_map)
        shade_paragraph(hdr_cells[i].paragraphs[0], fill='D9D9D9')
    for row in rows:
        cells = table.add_row().cells
        for i in range(ncols):
            val = row[i] if i < len(row) else ''
            cells[i].text = ''
            add_inline_runs(cells[i].paragraphs[0], val, title_map=title_map)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)


def add_hr(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(10)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), 'AAAAAA')
    pBdr.append(bottom)
    pPr.append(pBdr)


# ---------------------------------------------------------------------------
# Document assembly
# ---------------------------------------------------------------------------

def render_file(doc, relpath, title_map):
    body = h.read_body(relpath)
    blocks = parse_blocks(body)
    doc_h1_seen = False
    prev_kind = None
    for block in blocks:
        kind = block[0]
        # Word visually merges the borders of two directly-adjacent bordered
        # paragraphs with identical formatting -- force a plain spacer
        # paragraph between back-to-back code/diagram-fallback blocks so
        # each fenced snippet still reads as its own distinct box.
        if kind == 'code' and prev_kind == 'code':
            doc.add_paragraph()
        prev_kind = kind
        if kind == 'heading':
            level = block[1]
            text = block[2]
            word_level = {1: 2, 2: 3, 3: 4}.get(level, min(level + 1, 9))
            para = doc.add_heading('', level=word_level)
            add_inline_runs(para, text, title_map=title_map)
            para.paragraph_format.keep_with_next = True
            if level == 1 and not doc_h1_seen:
                doc_h1_seen = True
                cap = doc.add_paragraph()
                cap.paragraph_format.space_after = Pt(8)
                cap_run = cap.add_run(relpath)
                cap_run.italic = True
                cap_run.font.size = Pt(8.5)
                cap_run.font.color.rgb = RGBColor(0x77, 0x77, 0x77)
        elif kind == 'para':
            p = doc.add_paragraph()
            add_inline_runs(p, block[1], title_map=title_map)
        elif kind == 'list':
            render_list_items(doc, block[1], title_map)
        elif kind == 'table':
            add_table(doc, block[1], block[2], title_map)
        elif kind == 'code':
            add_code_block(doc, block[2])
        elif kind == 'mermaid':
            idx = block[1]
            src_lines = block[2]
            slug = f"{h.slug_for(relpath)}-{idx}"
            png_path = os.path.join(DIAGRAM_DIR, slug + '.png')
            if os.path.exists(png_path):
                add_diagram_image(doc, png_path)
            else:
                add_mermaid_fallback(doc, src_lines)
        elif kind == 'quote':
            qp = doc.add_paragraph()
            qp.paragraph_format.left_indent = Inches(0.35)
            add_inline_runs(qp, ' '.join(block[1]), base_italic=True, title_map=title_map)
        elif kind == 'hr':
            add_hr(doc)


def add_toc_field(doc):
    paragraph = doc.add_paragraph()
    run = paragraph.add_run()
    fldChar = OxmlElement('w:fldChar')
    fldChar.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText')
    instrText.set(qn('xml:space'), 'preserve')
    instrText.text = 'TOC \\o "1-4" \\h \\z \\u'
    fldChar_sep = OxmlElement('w:fldChar')
    fldChar_sep.set(qn('w:fldCharType'), 'separate')
    placeholder = OxmlElement('w:t')
    placeholder.text = "Right-click here and choose \"Update Field\" (or press F9) to generate the table of contents."
    fldChar_end = OxmlElement('w:fldChar')
    fldChar_end.set(qn('w:fldCharType'), 'end')

    r = run._r
    r.append(fldChar)
    r.append(instrText)
    r.append(fldChar_sep)
    r.append(placeholder)
    r.append(fldChar_end)


def enable_update_fields_on_open(doc):
    settings_element = doc.settings.element
    update_fields = OxmlElement('w:updateFields')
    update_fields.set(qn('w:val'), 'true')
    settings_element.append(update_fields)


def build():
    title_map = h.build_title_map()

    doc = Document()
    section = doc.sections[0]
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)

    normal = doc.styles['Normal']
    normal.font.name = 'Calibri'
    normal.font.size = Pt(11)

    # --- Title page -------------------------------------------------------
    for _ in range(5):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('Fiuu Reload Handbook')
    run.font.size = Pt(36)
    run.bold = True

    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    lines2 = [
        'Architecture, coding conventions, and GitLab-history synthesis',
        'for the reload and reload_db projects',
    ]
    for idx, line in enumerate(lines2):
        r2 = p2.add_run(line)
        r2.font.size = Pt(15)
        r2.italic = True
        if idx != len(lines2) - 1:
            r2.add_break()

    for _ in range(6):
        doc.add_paragraph()

    p3 = doc.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r3 = p3.add_run(f"Generated {datetime.date.today():%Y-%m-%d}")
    r3.font.size = Pt(12)

    p4 = doc.add_paragraph()
    p4.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r4 = p4.add_run('Private / personal reference — not an official Fiuu document.')
    r4.font.size = Pt(11)
    r4.italic = True
    r4.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

    doc.add_page_break()

    # --- Table of contents --------------------------------------------
    p5 = doc.add_paragraph()
    p5.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r5 = p5.add_run('Table of Contents')
    r5.font.size = Pt(22)
    r5.bold = True
    doc.add_paragraph()
    add_toc_field(doc)
    doc.add_page_break()

    # --- Chapters -----------------------------------------------------
    chapters = h.all_chapter_file_lists()
    for chapter_title, files in chapters:
        heading = doc.add_heading(chapter_title, level=1)
        heading.paragraph_format.page_break_before = True
        heading.paragraph_format.keep_with_next = True
        for relpath in files:
            render_file(doc, relpath, title_map)

    enable_update_fields_on_open(doc)

    doc.save(OUT_PATH)
    print(f"Saved {OUT_PATH}")
    print(f"Size: {os.path.getsize(OUT_PATH) / 1024:.0f} KB")


if __name__ == '__main__':
    build()
