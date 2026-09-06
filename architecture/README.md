# Architecture

Traced (not assumed) architecture for both halves of the system.

- [`reload/`](reload/) — the .NET application solution: class-library, web_api, web_app, reload_portal, terminal_application, console_app
- [`reload_db/`](reload_db/) — the SQL Server estate: per-module patch scripts under MAINT/, reconciled against the existing schema vault

Each subfolder has one overview doc plus one doc per major component/module, and a `diagrams/` folder of Mermaid diagrams (component/dependency graphs, sequence diagrams for key flows, ER diagrams per DB module).

Status:
- `reload/` — first broad pass done (2026-09-05). See `reload/00-topology.md` first —
  it corrects several starting assumptions (most top-level sibling folders turned out
  to be empty; all real apps live inside the `reload` monorepo under
  `web/DEV/NET/Applications` and `Components`). Open item flagged there: no separate
  "reload_portal" codebase was found distinct from the `web_app`/`BackOffice.Web`
  portal — needs a human answer.
- `reload_db/` — pending first broad pass.
