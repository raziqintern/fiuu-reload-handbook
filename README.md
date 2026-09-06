# Fiuu Reload Handbook

Personal knowledge base for the `reload` (application) and `reload_db` (database)
projects at Fiuu. Built while working on the team, for my own reference and to
eventually help onboard future engineers.

Private repo, personal use — not an official Fiuu deliverable.

## Structure

| Folder | Purpose |
|---|---|
| [`architecture/`](architecture/) | Traced architecture for `reload` and `reload_db` — components, data flow, diagrams |
| [`conventions/`](conventions/) | Coding patterns, standards, and approaches actually used in the codebase (reverse-engineered, not officially documented) |
| [`gitlab-analysis/`](gitlab-analysis/) | Synthesis from full GitLab issue/MR history — recurring bug classes, review norms, tribal knowledge |
| [`glossary/`](glossary/) | Domain and module glossary (CEPP, TNG, INCOMM, RESTORIFY, etc.) |
| [`obsidian-vault/`](obsidian-vault/) | Vault entry point only (`Home.md`) — **this whole repo is the Obsidian vault** (open the repo root in Obsidian, not this folder); see its README |
| [`skills/`](skills/) | SKILL.md-style docs so future Claude Code sessions on this project can load this as a skill |
| [`exports/`](exports/) | Generated Word (.docx) documentation builds |
| [`website/`](website/) | Placeholder for a future w3schools-style teaching site: "How to become a Fiuu software engineer" |

## Status

Actively being built. See each folder's own README for what's done vs. pending.

## Source material

- `reload` and `reload_db` repos (offline-teams/reload, offline-teams/reload_db on git2u.fiuu.com)
- Fiuu New Joiner Guide (Starter Guide, architecture diagram, Postman collection)
- Existing Obsidian DB vault (`reload_schema.dbml`, module notes)
- Full GitLab issue/MR history for both repos
