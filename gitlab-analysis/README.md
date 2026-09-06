---
tags: [gitlab-analysis]
aliases: ["GitLab Analysis Index"]
---

# GitLab Analysis

Synthesis from the full issue/MR history of `offline-teams/reload` and
`reload_db`.

Docs — `offline-teams/reload` (application repo):
- [`reload-tribal-knowledge.md`](reload-tribal-knowledge.md) — recurring bug
  classes / modules that break in predictable ways, with issue citations
- [`reload-mr-review-checklist.md`](reload-mr-review-checklist.md) — MR review
  checklist derived from what reviewers (human lead + the `deepcode_ai` bot,
  adopted ~Jun 2025) actually flag repeatedly, with MR citations
- [`reload-timeline.md`](reload-timeline.md) — chronological timeline of
  milestones, incidents, and architectural shifts, with issue/MR citations

Docs — `reload_db` (database repo):
- [`reload_db-tribal-knowledge.md`](reload_db-tribal-knowledge.md) — recurring bug classes, which DB modules break/get patched most, incident root causes, gotchas
- [`reload_db-mr-review-checklist.md`](reload_db-mr-review-checklist.md) — practical review checklist from what reviewers actually flag, plus what a real risk-analysis section looks like vs. the official template
- [`reload_db-timeline.md`](reload_db-timeline.md) — chronological major DB changes, migrations, incidents

Raw API pulls are cached under `raw/` (gitignored — regenerable, and may contain
sensitive ticket detail that shouldn't be committed even to a private repo).

Status:
- `offline-teams/reload` (the application repo, project id 747): **full
  history pulled**, 2,604 issues + 1,963 MRs, 2022-07-15 → 2026-09-05. Three
  synthesis docs above are done, based on full metadata + a
  discussion-weighted sample of 24 MRs' full/near-full thread content plus
  all 8 incident issues (see each doc's coverage note).
- `reload_db` (actual path: `server/offline/rds/reload`, project id 684 — see
  the tribal-knowledge doc's project-path note, `offline-teams/reload_db`
  does not exist on this GitLab instance): **full history pulled**, 792
  issues + 1,835 MRs, 2022-08-30 → 2026-09-04. Three synthesis docs above
  are done, based on full metadata + a discussion-weighted sample of ~30
  MRs' full thread content (see each doc's coverage note).

## Related

- [[gitlab-analysis/reload-tribal-knowledge]] and [[gitlab-analysis/reload_db-tribal-knowledge]] — the two per-repo synthesis docs
- [[architecture/README]] — the traced architecture these findings sit on top of
- [[conventions/README]] — coding conventions vs. what reviewers actually enforce
