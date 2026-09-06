# Obsidian Vault

## Design: the repo root is the vault, not this folder

This handbook is meant to be browsed in Obsidian with backlinks and a Graph
view — the same pattern as the existing Fiuu Reload DB vault
(`Fiuu_Reload_DB_Vault_Code/`). The natural instinct is to build that as a
separate `obsidian-vault/` copy of the docs. **That's not what this folder
is** — deliberately.

Obsidian requires `.obsidian/` (its config folder) to be a direct child of
whatever folder you open as a vault. To get `architecture/`, `conventions/`,
`gitlab-analysis/`, and `glossary/` all browsable together in one Graph view,
the vault has to be **the repository root**, `fiuu-reload-handbook/` itself —
so `.obsidian/` lives there, not here. Duplicating the ~80 existing docs into
a separate `obsidian-vault/` copy instead would mean two copies of every
doc that immediately drift out of sync with each other; keeping the
canonical docs in their existing locations and adding Obsidian metadata
(YAML frontmatter with tags/aliases, `## Related` wikilink sections) *in
place* avoids that entirely.

So: **open `fiuu-reload-handbook/` itself as your Obsidian vault**, not this
folder.

## What actually lives here

Given the above, this folder is intentionally small — just the vault's
entry point and this explainer:

- [`Home.md`](Home.md) — the vault's main MOC (map of content) note; open
  this first after opening the vault root
- `README.md` — this file

Everything else (the ~80 architecture/conventions/gitlab-analysis docs, plus
the glossary once it's built) stays in its existing canonical folder — this
folder does not and should not grow beyond a small handful of vault-level
entry points/templates.

Status: `.obsidian/` config and `Home.md` are in place. Frontmatter and
`## Related` cross-links have been added to every doc under `architecture/`,
`conventions/`, and `gitlab-analysis/`; `glossary/` will get the same
treatment once that folder is built out by a separate pass.
