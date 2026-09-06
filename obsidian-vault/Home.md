---
tags: [moc]
aliases: ["Start Here"]
---

# Fiuu Reload Handbook

A reverse-engineered knowledge base for the `reload` (application) and
`reload_db` (database) projects at Fiuu — architecture, conventions, and
GitLab tribal knowledge, built while working on the team.

## How this vault is organized

**The whole repository is the Obsidian vault** — not just this folder. Open
the repo root (`fiuu-reload-handbook/`, not `obsidian-vault/`) as your vault
in Obsidian. `.obsidian/` lives at the repo root for exactly this reason:
Obsidian requires that folder to be a direct child of whatever you open as a
vault, and opening the root is what makes `architecture/`, `conventions/`,
`gitlab-analysis/`, and `glossary/` all browsable together with working
backlinks and one connected Graph view.

`obsidian-vault/` (this folder) is deliberately small — it holds only this
`Home.md` entry note, its own `README.md` explaining the design, and
nothing else. The ~80 canonical docs elsewhere in the repo are **not**
duplicated in here; they carry their own YAML frontmatter (tags, aliases)
and `## Related` wikilink sections added in place, so the docs you read here
are the same files a plain Markdown reader or the `gitlab-reload` skills see
— nothing drifts out of sync with a separate copy.

Tag scheme, for the Tag pane / Graph view filters in the left/right sidebars:

| Tag | Covers |
|---|---|
| `#reload/architecture` | `architecture/reload/` — the .NET application solution |
| `#reload_db/architecture` | `architecture/reload_db/` — the SQL Server estate |
| `#conventions` | `conventions/` — reverse-engineered coding standards |
| `#gitlab-analysis` | `gitlab-analysis/` — GitLab issue/MR synthesis |
| `#module/<name>` | per-module tag where relevant, e.g. `#module/cepp`, `#module/tng` |
| `#repo/reload`, `#repo/reload_db` | which GitLab project a gitlab-analysis doc covers |
| `#diagram` | Mermaid ER/sequence-diagram docs |

Try Graph view filtered to `tag:#module/cepp` (or any other module) to see
architecture, conventions, and GitLab-analysis notes about that module pulled
together regardless of which folder they live in.

## Architecture

- [[architecture/README]] — index for both halves of the system
- [[architecture/reload/01-overview]] — the `reload` application: terminal API, back-office web app, class-library, scheduled jobs
- [[architecture/reload/00-topology]] — start here for `reload` — corrects several assumptions about what's actually on disk
- [[architecture/reload_db/00-overview]] — the `reload_db` estate: 20 databases, one per business domain
- [[architecture/reload_db/vault-drift-notes]] — everywhere this handbook's trace disagrees with the original Obsidian DB vault

## Conventions

- [[conventions/README]] — index of reverse-engineered coding standards
- [[conventions/known-patterns-and-pitfalls]] — recurring smells and tech debt worth knowing before you dig in

## GitLab Analysis

- [[gitlab-analysis/README]] — index for both repos' issue/MR history
- [[gitlab-analysis/reload-tribal-knowledge]] — recurring bug classes in the `reload` application
- [[gitlab-analysis/reload_db-tribal-knowledge]] — which databases break/get patched most, and why

## Glossary

- [[glossary/README]] — domain and module glossary (CEPP, TNG, INCOMM, RESTORIFY, SAP, EInvoice, ...)

## Status

Architecture and conventions: first broad pass done. GitLab analysis: full
history pulled for both repos. Glossary: in progress. See each folder's own
`README.md` for the detailed status.
