# Architecture

Traced (not assumed) architecture for both halves of the system.

- [`reload/`](reload/) — the .NET application solution: class-library, web_api, web_app, reload_portal, terminal_application, console_app
- [`reload_db/`](reload_db/) — the SQL Server estate: per-module patch scripts under MAINT/, reconciled against the existing schema vault

Each subfolder has one overview doc plus one doc per major component/module, and a `diagrams/` folder of Mermaid diagrams (component/dependency graphs, sequence diagrams for key flows, ER diagrams per DB module).

Status: pending first broad pass.
