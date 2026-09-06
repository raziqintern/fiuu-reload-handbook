"""
Extracts every ```mermaid block from the in-scope handbook markdown and
writes exports/_diagram_renders/render_all.html, which renders all of them
client-side (via the mermaid CDN) and POSTs each one back to a small local
save server as a PNG.

Usage (see exports/README.md for the full regeneration walkthrough):
  1. python exports/render_diagrams.py            # writes render_all.html + manifest.json
  2. python exports/_diagram_renders/save_server.py   # in another terminal, serves + saves POSTs
  3. Open http://localhost:8791/render_all.html in a browser and wait for
     the on-page status line to read "ALL DONE".
  4. Run python exports/build_docx.py to build the .docx, which picks up
     the PNGs from exports/_diagram_renders/*.png automatically.
"""
import json
import os
import html as htmllib

import handbook_md as h

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_diagram_renders')

RENDER_HTML_TEMPLATE = r"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Mermaid batch render</title>
<style>
  body {{ font-family: sans-serif; font-size: 12px; }}
  #status {{ font-size: 16px; font-weight: bold; padding: 12px; position: sticky; top: 0; background: #fff; }}
  .mermaid {{ margin: 8px 0; }}
  .row {{ border-bottom: 1px solid #ccc; padding: 4px 0; }}
</style>
</head>
<body>
<div id="status">starting...</div>
<div id="container"></div>
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>
const SOURCES = {sources_json};

function setStatus(msg) {{ document.getElementById('status').textContent = msg; }}

function trueSvgSize(svg) {{
  // svg elements from mermaid typically carry width="100%" and no height
  // attribute, with the real content size only in viewBox -- the browser's
  // default intrinsic <img> sizing (300x150 box) is NOT the real size.
  const vb = svg.getAttribute('viewBox');
  if (vb) {{
    const parts = vb.trim().split(/[,\s]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {{
      return {{ w: parts[2], h: parts[3] }};
    }}
  }}
  try {{
    const b = svg.getBBox();
    if (b.width > 0 && b.height > 0) return {{ w: b.width, h: b.height }};
  }} catch (e) {{ /* ignore */ }}
  return {{ w: svg.width && svg.width.baseVal ? svg.width.baseVal.value : 800,
            h: svg.height && svg.height.baseVal ? svg.height.baseVal.value : 600 }};
}}

async function svgToPngBlob(svg) {{
  const {{ w, h }} = trueSvgSize(svg);
  const svgData = new XMLSerializer().serializeToString(svg);
  const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  const img = new Image();
  return new Promise((resolve, reject) => {{
    img.onload = () => {{
      try {{
        let scale = 2;
        const maxSide = Math.max(w, h);
        const maxOut = 2400;
        if (maxSide * scale > maxOut) scale = maxOut / maxSide;
        if (scale < 1) scale = 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      }} catch (e) {{ reject(e); }}
    }};
    img.onerror = (e) => reject(new Error('image load error'));
    img.src = url;
  }});
}}

async function run() {{
  mermaid.initialize({{ startOnLoad: false, flowchart: {{ htmlLabels: false }}, securityLevel: 'loose' }});
  const container = document.getElementById('container');
  const slugs = Object.keys(SOURCES);
  for (const slug of slugs) {{
    const row = document.createElement('div');
    row.className = 'row';
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.id = 'm-' + slug;
    div.textContent = SOURCES[slug];
    row.appendChild(div);
    container.appendChild(row);
  }}
  setStatus('rendering ' + slugs.length + ' diagrams...');
  let okCount = 0, errCount = 0;
  const errors = [];
  for (const slug of slugs) {{
    try {{
      await mermaid.run({{ querySelector: '#m-' + slug }});
    }} catch (e) {{
      errCount++;
      errors.push(slug + ': RENDER ' + e.message);
      continue;
    }}
    const svg = document.querySelector('#m-' + slug + ' svg');
    if (!svg) {{ errCount++; errors.push(slug + ': NO SVG'); continue; }}
    try {{
      const blob = await svgToPngBlob(svg);
      if (!blob) throw new Error('no blob');
      const resp = await fetch('/save?name=' + encodeURIComponent(slug) + '.png', {{
        method: 'POST', body: blob
      }});
      if (!resp.ok) throw new Error('save http ' + resp.status);
      okCount++;
    }} catch (e) {{
      errCount++;
      errors.push(slug + ': ' + e.message);
    }}
    setStatus('progress: ' + (okCount + errCount) + '/' + slugs.length + ' (ok=' + okCount + ' err=' + errCount + ')');
  }}
  setStatus('ALL DONE ok=' + okCount + ' err=' + errCount + ' total=' + slugs.length +
    (errors.length ? ' | ERRORS: ' + JSON.stringify(errors) : ''));
}}
run();
</script>
</body>
</html>
"""


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    blocks = h.all_mermaid_blocks()
    sources = {slug: src for (_relpath, slug, src) in blocks}
    manifest = [{"relpath": rp, "slug": slug} for (rp, slug, _src) in blocks]

    sources_json = json.dumps(sources)
    # Guard against a literal "</script" sequence breaking out of our <script> block.
    sources_json = sources_json.replace('</script', '<\\/script')

    html_out = RENDER_HTML_TEMPLATE.format(sources_json=sources_json)
    with open(os.path.join(OUT_DIR, 'render_all.html'), 'w', encoding='utf-8') as f:
        f.write(html_out)

    with open(os.path.join(OUT_DIR, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

    print(f"Wrote {len(blocks)} mermaid sources to {OUT_DIR}\\render_all.html")
    print(f"Manifest: {OUT_DIR}\\manifest.json")


if __name__ == '__main__':
    main()
