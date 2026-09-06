---
tags: [conventions]
aliases: ["Conventions Index"]
---

# Coding Conventions

Fiuu has no documented coding standard for this codebase (`CONTRIBUTING.md` in
class-library is generic GitLab boilerplate). Everything here is reverse-engineered
from the actual code, with real snippets and file:line citations as evidence —
not idealized guidelines. Inconsistencies are called out explicitly rather than
smoothed over.

## Docs

- [`naming.md`](naming.md) — classes/methods/vars, DB objects, and where naming drifts by module/author
- [`layering-and-architecture.md`](layering-and-architecture.md) — the Model/Provider/Service pattern and its consistency
- [`error-handling.md`](error-handling.md) — catch/log/swallow patterns, custom exceptions
- [`logging.md`](logging.md) — the (multiple) LogHelper implementations and call patterns
- [`data-access.md`](data-access.md) — the three coexisting data-access styles, all stored-proc-only
- [`configuration-and-secrets.md`](configuration-and-secrets.md) — appSettings, DB-backed config, AWS Secrets Manager, flat-file connection strings (mechanisms only, no literal values)
- [`comment-style.md`](comment-style.md) — how much/what kind of commenting actually exists
- [`sql-conventions.md`](sql-conventions.md) — reload_db/MAINT structure, stored proc/index naming, patch script conventions
- [`known-patterns-and-pitfalls.md`](known-patterns-and-pitfalls.md) — recurring smells and tech debt worth watching for

## Source sampled

`reload/class-library` (AWSCore, Database, Reloads/TNG, Reloads/Game,
Secure/Astro, Secure/Incomm) and `reload_db/MAINT` (mainly `TRANSACTION` and
`CEPP`). `web_api`, `web_app`, `reload_portal`, `terminal_application`, and
`console_app` were empty directories in this checkout (no files) — claims
here about how the consuming apps use `class-library` are necessarily
speculative and flagged as such where they occur; revisit once those repos
are populated.

Status: first sampling pass complete.

## Related

- [[conventions/known-patterns-and-pitfalls]] — the recurring smells that tie all the docs above together
- [[architecture/reload/01-overview]] — the codebase these conventions were reverse-engineered from
- [[gitlab-analysis/reload-mr-review-checklist]] — what reviewers actually enforce, vs. what's documented here
