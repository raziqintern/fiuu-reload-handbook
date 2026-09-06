/* Fiuu Reload Academy — "Try it Yourself" engine.
   Author markup per block:

   <div class="tryit" data-lang="html|js|sql|csharp|vbnet">
     <pre class="tryit-src">...starter code, HTML-escaped...</pre>
     <pre class="tryit-output-src">...expected output, only used for csharp/vbnet reveal mode...</pre>
   </div>

   html -> live iframe preview
   js   -> sandboxed iframe execution, console captured
   sql  -> real SQLite via sql.js (WASM), shared in-memory db per block,
           pre-seeded with a small practice schema
   csharp/vbnet -> "Predict -> Reveal" mode (no live backend available)
*/

(function () {
  let sqlJsPromise = null;
  function loadSqlJs() {
    if (sqlJsPromise) return sqlJsPromise;
    sqlJsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.14.2/sql-wasm.js";
      script.onload = () => {
        window
          .initSqlJs({ locateFile: (f) => "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.14.2/" + f })
          .then(resolve, reject);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return sqlJsPromise;
  }

  const PRACTICE_SCHEMA = `
    CREATE TABLE Terminals (
      TerminalId INTEGER PRIMARY KEY,
      MerchantName TEXT,
      MStatusId INTEGER
    );
    CREATE TABLE TerminalActivities (
      ActivityId INTEGER PRIMARY KEY,
      TerminalId INTEGER,
      TransNo TEXT,
      Amount REAL,
      MTransStatusId INTEGER
    );
    INSERT INTO Terminals VALUES (1, '7-Eleven KL', 1);
    INSERT INTO Terminals VALUES (2, 'Watsons PJ', 1);
    INSERT INTO Terminals VALUES (3, 'Old Kiosk (Closed)', 0);
    INSERT INTO TerminalActivities VALUES (1, 1, 'TXN-1001', 10.00, 2);
    INSERT INTO TerminalActivities VALUES (2, 1, 'TXN-1002', 25.50, 2);
    INSERT INTO TerminalActivities VALUES (3, 2, 'TXN-1003', 5.00, 1);
    INSERT INTO TerminalActivities VALUES (4, 3, 'TXN-1004', 100.00, 3);
  `;

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function fmtArg(a) {
    if (a === undefined) return "undefined";
    if (typeof a === "object") {
      try { return JSON.stringify(a); } catch { return String(a); }
    }
    return String(a);
  }

  function buildToolbar(lang) {
    const label = { html: "HTML", js: "JavaScript", sql: "SQL (SQLite)", csharp: "C#", vbnet: "VB.NET" }[lang] || lang;
    const runLabel = lang === "csharp" || lang === "vbnet" ? "Reveal Output" : "Run ▸";
    return `
      <div class="tryit-bar">
        <span class="tryit-lang">${label}</span>
        <div class="tryit-actions">
          <button type="button" class="tryit-copy">Copy code</button>
          <button type="button" class="tryit-reset">Reset</button>
          <button type="button" class="tryit-run primary">${runLabel}</button>
        </div>
      </div>
    `;
  }

  function initHtmlBlock(block, code) {
    block.innerHTML = buildToolbar("html") + `
      <div class="tryit-body">
        <div class="tryit-editor">
          <textarea class="tryit-input" spellcheck="false">${esc(code)}</textarea>
        </div>
        <div class="tryit-output">
          <span class="tryit-output-label">Result</span>
          <div class="tryit-frame-wrap"><iframe class="tryit-preview" title="preview"></iframe></div>
        </div>
      </div>
    `;
    const input = block.querySelector(".tryit-input");
    const frame = block.querySelector(".tryit-preview");
    const render = () => (frame.srcdoc = input.value);
    block.querySelector(".tryit-run").addEventListener("click", render);
    block.querySelector(".tryit-reset").addEventListener("click", () => { input.value = code; render(); });
    block.querySelector(".tryit-copy").addEventListener("click", () => navigator.clipboard.writeText(input.value));
    render();
  }

  function initJsBlock(block, code) {
    block.innerHTML = buildToolbar("js") + `
      <div class="tryit-body">
        <div class="tryit-editor">
          <textarea class="tryit-input" spellcheck="false">${esc(code)}</textarea>
        </div>
        <div class="tryit-output">
          <span class="tryit-output-label">Console</span>
          <pre class="tryit-console"><span class="muted">Click Run ▸ to execute.</span></pre>
        </div>
      </div>
    `;
    const input = block.querySelector(".tryit-input");
    const out = block.querySelector(".tryit-console");

    function run() {
      out.innerHTML = "";
      const uid = "f" + Math.random().toString(36).slice(2);
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.setAttribute("sandbox", "allow-scripts");
      const userCode = input.value.replace(/<\/script>/gi, "<\\/script>");
      iframe.srcdoc = `<!doctype html><html><body><script>
        const send = (type, args) => { try { parent.postMessage({ uid: "${uid}", type, args }, "*"); } catch(e) {} };
        console.log = function() { send("log", Array.prototype.slice.call(arguments)); };
        console.error = function() { send("error", Array.prototype.slice.call(arguments)); };
        console.warn = function() { send("warn", Array.prototype.slice.call(arguments)); };
        window.onerror = function(msg) { send("error", [String(msg)]); return true; };
        try {
          ${userCode}
        } catch (e) {
          send("error", [e && e.message ? e.message : String(e)]);
        }
      <\/script></body></html>`;

      let gotAny = false;
      function handler(ev) {
        if (!ev.data || ev.data.uid !== uid) return;
        gotAny = true;
        const line = document.createElement("div");
        if (ev.data.type === "error") line.className = "err";
        line.textContent = ev.data.args.map(fmtArg).join(" ");
        out.appendChild(line);
      }
      window.addEventListener("message", handler);
      document.body.appendChild(iframe);
      setTimeout(() => {
        window.removeEventListener("message", handler);
        iframe.remove();
        if (!gotAny) out.innerHTML = '<span class="muted">(no console output)</span>';
      }, 800);
    }

    block.querySelector(".tryit-run").addEventListener("click", run);
    block.querySelector(".tryit-reset").addEventListener("click", () => { input.value = code; });
    block.querySelector(".tryit-copy").addEventListener("click", () => navigator.clipboard.writeText(input.value));
  }

  function initSqlBlock(block, code) {
    block.innerHTML = buildToolbar("sql") + `
      <div class="tryit-body">
        <div class="tryit-editor">
          <textarea class="tryit-input" spellcheck="false">${esc(code)}</textarea>
        </div>
        <div class="tryit-output">
          <span class="tryit-output-label">Result</span>
          <pre class="tryit-console"><span class="muted">Click Run ▸ — this is a real SQLite engine (running in your browser via WebAssembly), pre-seeded with a small Terminals / TerminalActivities practice schema shaped like reload_db.</span></pre>
        </div>
      </div>
    `;
    const input = block.querySelector(".tryit-input");
    const out = block.querySelector(".tryit-console");
    const runBtn = block.querySelector(".tryit-run");

    function run() {
      runBtn.disabled = true;
      out.innerHTML = '<span class="muted">Loading SQLite engine…</span>';
      loadSqlJs()
        .then((SQL) => {
          const db = new SQL.Database();
          db.run(PRACTICE_SCHEMA);
          try {
            const res = db.exec(input.value);
            if (!res.length) {
              out.innerHTML = '<span class="muted">Query ran with no result set (e.g. INSERT/UPDATE/DDL succeeded).</span>';
              return;
            }
            out.innerHTML = res
              .map((r) => renderTable(r.columns, r.values))
              .join("<hr style='border-color:#3a3a3a;margin:8px 0;'>");
          } catch (e) {
            out.innerHTML = `<span class="err">${esc(e.message)}</span>`;
          } finally {
            db.close();
          }
        })
        .catch(() => {
          out.innerHTML = '<span class="err">Could not load the SQLite engine (offline, or the CDN is blocked).</span>';
        })
        .finally(() => (runBtn.disabled = false));
    }

    function renderTable(cols, rows) {
      const head = "<tr>" + cols.map((c) => `<th style="text-align:left;padding:2px 8px;border-bottom:1px solid #444;">${esc(c)}</th>`).join("") + "</tr>";
      const body = rows
        .map((row) => "<tr>" + row.map((v) => `<td style="padding:2px 8px;">${esc(v === null ? "NULL" : v)}</td>`).join("") + "</tr>")
        .join("");
      return `<table style="border-collapse:collapse;font-size:0.85rem;">${head}${body}</table>`;
    }

    runBtn.addEventListener("click", run);
    block.querySelector(".tryit-reset").addEventListener("click", () => { input.value = code; });
    block.querySelector(".tryit-copy").addEventListener("click", () => navigator.clipboard.writeText(input.value));
  }

  function initRevealBlock(block, code, lang, expected) {
    block.classList.add("reveal-mode");
    block.innerHTML = buildToolbar(lang) + `
      <div class="tryit-reveal-hint">Live in-browser compilation isn't available for ${lang === "csharp" ? "C#" : "VB.NET"} without a hosted backend (see the note on this page). Read the code, predict the output, then reveal it.</div>
      <div class="tryit-body">
        <div class="tryit-editor">
          <textarea class="tryit-input" spellcheck="false">${esc(code)}</textarea>
        </div>
        <div class="tryit-output">
          <span class="tryit-output-label">Output (hidden until you reveal it)</span>
          <pre class="tryit-reveal-panel"><span class="muted">Predict the output, then click Reveal Output ▸</span></pre>
        </div>
      </div>
    `;
    const input = block.querySelector(".tryit-input");
    const out = block.querySelector(".tryit-reveal-panel");
    block.querySelector(".tryit-run").addEventListener("click", () => {
      out.textContent = expected;
    });
    block.querySelector(".tryit-reset").addEventListener("click", () => {
      input.value = code;
      out.innerHTML = '<span class="muted">Predict the output, then click Reveal Output ▸</span>';
    });
    block.querySelector(".tryit-copy").addEventListener("click", () => navigator.clipboard.writeText(input.value));
  }

  function init() {
    document.querySelectorAll(".tryit").forEach((block) => {
      const lang = block.getAttribute("data-lang");
      const srcEl = block.querySelector(".tryit-src");
      const code = srcEl ? srcEl.textContent.replace(/^\n/, "").replace(/\n$/, "") : "";
      if (lang === "html") initHtmlBlock(block, code);
      else if (lang === "js") initJsBlock(block, code);
      else if (lang === "sql") initSqlBlock(block, code);
      else if (lang === "csharp" || lang === "vbnet") {
        const outEl = block.querySelector(".tryit-output-src");
        const expected = outEl ? outEl.textContent.replace(/^\n/, "").replace(/\n$/, "") : "(no expected output authored)";
        initRevealBlock(block, code, lang, expected);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
