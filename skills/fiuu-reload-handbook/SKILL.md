---
name: fiuu-reload-handbook
description: Master/router skill for a personal engineering handbook covering Fiuu's reload (application) and reload_db (database) payment platform — architecture, coding conventions, and GitLab tribal knowledge, reverse-engineered directly from the codebase and full issue/MR history rather than assumed. Use whenever the user asks how the reload/reload_db system is structured, what a module or application actually does, how something is conventionally coded in this repo, or what's known about a recurring bug class or review pattern here — and especially before trusting any assumption about folder layout, which GitLab project a repo lives in, or which database schemas exist, since this handbook documents several load-bearing corrections to exactly those assumptions. Routes to reload-architecture (reload app), reload-db-architecture (reload_db estate), reload-coding-conventions (actual coding patterns), reload-tribal-knowledge (GitLab-mined history).
---

# Fiuu Reload Handbook — master skill

Personal engineering knowledge base for the `reload` (application) and
`reload_db` (database) projects at Fiuu, built by tracing the actual repos
and GitLab history rather than relying on assumption or word-of-mouth. Not
an official Fiuu deliverable — a private reference, source-controlled at
`C:\git\fiuu-reload-handbook`.

## Scope and organization

| Skill | Covers | Full docs |
|---|---|---|
| `reload-architecture` | The reload app: real topology, components, class-library modules, dependency graph, key transaction flows | `architecture/reload/` |
| `reload-db-architecture` | The reload_db SQL Server estate: 20 databases, module map, vault-drift, patch-script conventions | `architecture/reload_db/` |
| `reload-coding-conventions` | Actual (reverse-engineered) naming/layering/error-handling/logging/data-access/config patterns and pitfalls | `conventions/` |
| `reload-tribal-knowledge` | GitLab-mined recurring bug classes, MR review patterns, incidents, timelines for both repos | `gitlab-analysis/` |

Load this master skill first for orientation and the corrections below, then
load whichever sub-skill matches the question. A `glossary/` folder and an
`obsidian-vault/` cross-linked view of the same material also exist in the
handbook repo but aren't separately skill-packaged.

### Relationship to the other `reload`/`reload_db` skills already installed

This handbook is a **static, offline reference** — it doesn't call GitLab or
query a live database. It's complementary to, not a replacement for:

- `gitlab-reload` and its sub-skills (`gitlab-reload-fetch`,
  `gitlab-reload-issues`, `gitlab-reload-mrs`, `gitlab-reload-mr-review`,
  `gitlab-reload-testcase-gen`) — for **live** GitLab API work (fetching,
  drafting, reviewing real issues/MRs). This handbook's
  `reload-tribal-knowledge` skill instead gives you the **pre-digested
  synthesis** of that same GitLab history — read it first for context, then
  use `gitlab-reload-fetch` if you need a specific live issue/MR.
- `reload-db-schema` — for querying the pre-built local schema vault
  (table/column/join lookups against `reload_schema.dbml`). This handbook's
  `reload-db-architecture` skill tells you **where that vault is wrong or
  incomplete** (see trap 4 below) before you trust its answer.

## Critical corrections — read before trusting anything else here

Four "confidently wrong by default" traps a fresh session (or a fresh
engineer) reliably falls into. Each is verified against live repo/GitLab
state as of the dates cited — re-verify if it's been a while.

### 1. Most top-level sibling folders are empty; the real apps live inside `reload/`

The natural assumption is that the workspace root contains independent
checkouts: `reload`, `reload_db`, `class-library`, `web_api`, `web_app`,
`terminal_application`, `console_app`, `power_bi`, `powershell`,
`reload_portal`. **Confirmed false** as of 2026-09-05: `web_api`, `web_app`,
`reload_portal`, `terminal_application`, `console_app`, `power_bi`, and
`powershell` are genuinely empty directories (0 entries, not just
overlooked) — likely scaffolding for this handbook's own layout, never
populated. **Every real application lives inside the `reload/` repo itself**,
under `reload/web/DEV/NET/Applications/` (deployables) and
`reload/web/DEV/NET/Components/` (shared source). See
[`../../architecture/reload/00-topology.md`](../../architecture/reload/00-topology.md)
§1–3 for the full verification and the mapping from each assumed name to
what's actually there (e.g. `web_api` → `Reloads/Terminal/Api` +
`BackOffice/Api`; `web_app` → `BackOffice/Web`). One open question survives
this correction: no second "reload_portal" codebase was found distinct from
`BackOffice/Web` — see
[`reload-architecture`](../reload-architecture/SKILL.md) and
`architecture/reload/reload-portal.md` for the unresolved question.

### 2. The top-level `class-library/` clone is stale and orphaned — don't cite it

`reload/class-library` is a **git submodule**. A *second*, independent
top-level `class-library/` folder also exists (same remote, different
checkout) and is **out of date** relative to the submodule — confirmed
divergent source (missing `Reloads/Game`, some `TNG/Services` files) as of
2026-09-05, HEAD dated 2026-08-18 vs. the submodule's 2026-09-04. Nothing in
`reload/`'s `.csproj`/`.vbproj` files references the top-level clone — it's
unused, leftover, and should be **ignored**, never treated as a second
source of truth. Always cite `reload/class-library` (the submodule). See
[`../../architecture/reload/00-topology.md`](../../architecture/reload/00-topology.md)
§2.

### 3. The `reload_db` GitLab project is NOT `offline-teams/reload_db`

That project path **does not exist** on `git2u.fiuu.com`. The real DB-side
sibling of `offline-teams/reload` is **`server/offline/rds/reload`**
(project id `684`, description "reload under RDS (for database script)",
default branch `SIT`) — confirmed both via the GitLab API (no
`offline-teams/reload_db` in the `offline-teams` group's 87 projects) and
via the local clone's own `git remote -v`. This affects every cross-link:
a `GIT#nnnn` reference inside `server/offline/rds/reload`'s own MR/issue
titles almost always points to an issue in `offline-teams/reload` (the
*application* repo), not to that DB repo's own tracker — its own issues are
almost all `[Release]`/`[Patch Request]` operational tickets with unrelated
numbering. See
[`../../gitlab-analysis/reload_db-tribal-knowledge.md`](../../gitlab-analysis/reload_db-tribal-knowledge.md)'s
project-path note (top of file) and
[`reload-tribal-knowledge`](../reload-tribal-knowledge/SKILL.md).

### 4. The schema vault is missing two whole databases and six provider schemas

The pre-existing Obsidian schema vault (`Fiuu_Reload_DB_Vault_Code/`,
backing the `reload-db-schema` skill) is a solid starting point but is
**confirmed incomplete**, not just possibly-stale:

- **`EINVOICE`** and **`SAP`** are real, actively-patched databases with
  **zero** mentions anywhere in the vault, including its 260KB
  `reload_schema.dbml` export (confirmed by direct grep). `EINVOICE` is over
  a year old at time of discovery — not something that appeared after the
  vault was built.
- **`TRANSACTION`** has at least 6 provider schemas live
  (`AnyPay`, `CelcomDigi`, `Giftee`, `MobilityOne`, `PrepayNation`,
  `RazerGold`) that the vault doesn't cover at all — the vault says 14
  schemas, live `MAINT/TRANSACTION/Schema/` has 19 (+`dbo` = 20).
- `CEPP.dbo.PublicHolidays` (added 2026-03-05) is also missing.

**Before trusting a `reload-db-schema` answer about EINVOICE, SAP, or a
TRANSACTION provider schema, cross-check against live `reload_db/MAINT/`
scripts directly** — the vault will report nothing or be wrong for these.
See
[`../../architecture/reload_db/vault-drift-notes.md`](../../architecture/reload_db/vault-drift-notes.md)
(full evidence) and
[`reload-db-architecture`](../reload-db-architecture/SKILL.md).

## Source material and staleness

- `reload`/`reload_db` repos on `git2u.fiuu.com` (local clone at the
  workspace root this handbook was built from).
- Fiuu New Joiner Guide (Starter Guide, architecture diagram, Postman
  collection).
- Existing Obsidian DB vault (`reload_schema.dbml`, module notes) — see
  correction 4 for where it's wrong.
- Full GitLab issue/MR history: `offline-teams/reload` (2,604 issues, 1,963
  MRs, 2022-07-15→2026-09-05) and `server/offline/rds/reload` (792 issues,
  1,835 MRs, 2022-08-30→2026-09-04).

Architecture docs are dated 2026-09-05, GitLab synthesis docs 2026-09-05/06.
This is a living personal repo — check each sub-skill's own staleness notes,
and prefer re-reading the cited source doc over trusting a stale skill
summary when precision matters.
