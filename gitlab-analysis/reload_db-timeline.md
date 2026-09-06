---
tags: [gitlab-analysis, repo/reload_db]
aliases: ["reload_db Timeline"]
---

# `reload_db` — Timeline

Chronological reconstruction from the full issue/MR metadata pull of
`reload_db` (`server/offline/rds/reload`, project id 684) — see
`reload_db-tribal-knowledge.md` for the project-path note and what this
pull does/doesn't cover. Dates are UTC+8 (`git2u.fiuu.com` server time) as
returned by the API.

## Volume by year

| Year | Issues created | MRs created |
|---|---|---|
| 2022 (from Aug 30) | 20 | 30 |
| 2023 | 222 | 486 |
| 2024 | 231 | 531 |
| 2025 | 203 | 460 |
| 2026 (through Sep 4) | 116 | 328 |

2026's partial-year count is already on pace to be comparable to prior
full years, consistent with the large multi-database bigint migration
(see below) running through most of it.

## 2022 — repo stood up

- **2022-08-30 / 2022-09-01**: repo created and issue/MR trackers seeded.
  Issue #1 ("Push Reload MY Database Files from SVN to Git") and MR !1
  ("Transfer Reload MY Database Files from SVN to Git") record the
  migration off Subversion.
- **2022-09-02**: MR !2, "add issue and merge request template" — the
  official templates (including the formal Risk-Analysis `Merge
  Request.md` template) are added to `.gitlab/`. Notably, per the review
  checklist doc, this MR is the *only* one in the repo's entire history
  whose description actually contains the words "Risk Analysis"/"Risk
  Score" — the template was added but essentially never filled out again.

## 2023 — DB governance program launched

- **2023-01-10 → 2023-01-17**: a cluster of recurring operational
  milestones all start within one week of each other — "Archive DB
  TRANSACTION", "Archive DB INVENTORY", "Archive DB INVENTORY_MASTER",
  "Database Audit Log Review", and "Database User Access Review" (plus
  the first "Release" milestone issue). This reads as a formal DB
  governance/compliance program launched company-wide in January 2023,
  not organic one-off requests — these five milestones alone account for
  108 of the repo's 792 issues.
- **2023-04-13**: **Issue #93**, the repo's only `Type::bug`-labeled
  issue — a column-truncation failure in SQL Agent jobs feeding
  `ReportSummary` reporting tables, traced back to a schema change made
  seven months earlier (September 2022, `RMSO-2193`) that was never
  mirrored onto the reporting-side copy of the same table. See
  tribal-knowledge doc §1 for the full cross-database-drift pattern this
  exemplifies.
- **2023-04-25**: "RDS Monthly Backup Review and Restoration Testing"
  milestone begins (ran through 2024-04, later resumed as
  "...2025"/"...2026" dated variants).
- **2023-05-06**: **Issue #330**, incident — a daily index-rebuild job
  scheduled for 04:15 fired at ~06:00 instead, locking `SalesTransactions`
  during peak hours for over an hour before a DBA identified and killed
  the session. See tribal-knowledge doc §4.

## 2023-12 → 2025-07 — the GIT#441 saga (Digi Bill Payment)

An 18-month, ~18-MR effort to integrate Digi's new Bill Payment API,
including a mid-flight production revert. Full account in
tribal-knowledge doc §3; headline dates:

- **2024-01-15**: first SIT merge (!551).
- **2024-03-19**: a "Drop column" MR (!680) deliberately closed/deferred
  out of the release.
- **2024-05-10**: the `main` production MR is closed —
  *"postpone to further notice"*.
- **2025-03-21 → 2025-03-26**: work resumes (Revision 3 merges; Revision
  4 is abandoned).
- **2025-04-02 → 2025-04-16**: DEV/QA have drifted from Production by
  this point; a dedicated `GIT#441-revertToProd` MR (!1167, !1185)
  resyncs them, followed by a `v1_v2_combination` MR (!1168) that
  actually lands the feature; two more attempted variants
  (`-version2`, `-v2postdeployment`) are opened and abandoned.
- **2025-04-16 → 2025-05-19**: the fix ships to production across three
  consolidated release MRs (!1183, !1207, !1227).
- **2025-07-16**: final standalone production MR for GIT#441 merges
  (!1293) — saga closed.

## 2025-06 — the bigint migration is proposed

- **2025-06-09**: `reload` issues **#1857** ("...PIN Service") and
  **#1858** ("...Non-Pin Service") opened — proposing to widen primary
  keys from `int` to `bigint` across `INVENTORY`, `INVENTORY_MASTER`,
  `REPORTSUMMARY`, and `TRANSACTION` ahead of projected identity-range
  exhaustion. This becomes the single largest body of related MRs in the
  repo's history (see below and tribal-knowledge doc §2).

## 2026-02-04 — the most severe recorded incident

- **Issue #713** — *"PIN service disruption due to table/data corruption"*.
  A SQL Agent job intended for a restored copy instead executed against
  production `Inventory`/`Inventory_Master`, corrupting data. Recovery
  required a live point-in-time-recovery + database rename with PIN sales
  suspended for roughly 5 hours (07:45–12:45). Full 5-Whys RCA on file;
  headline root cause: no mandatory pre-run target validation or peer
  approval existed for production-data-modifying jobs before this
  incident. See tribal-knowledge doc §4 for the full chronology.

## 2026-04 → 2026-08 — the bigint migration executes

- **2026-04-06 → 2026-04-17**: first SIT MRs for #1857/#1858 open
  (!1633, !1649, !1658, !1664); !1649 and !1664 are explicitly titled
  **"DOWNTIME NEEDED"**.
- **2026-04-17 (in !1649's description)**: a **tentative Scheduled Release
  Date of 2026-08-12** is set, with an explicit "DO NOT merge to
  Production until release date" hold.
- **2026-05 → 2026-07**: repeated SIT/UAT revisions (up to Revision 6 on
  SIT, Revision 4 on UAT) as the swap-table DDL is refined across all four
  databases; interim consolidated `main` MRs (!1698, !1706, !1772) bundle
  #1857/#1858 alongside many unrelated tickets as part of ordinary release
  trains while the downtime-gated piece stays held back.
- **2026-08-05**: !1649 itself (the SIT "DOWNTIME NEEDED" MR) finally
  merges.
- **2026-08-12**: **MR !1808**, `[main] {RDS} GIT#1857, GIT#1858`, merges
  to production — matching the tentative date set four months earlier in
  April. Migration complete.

## 2026 (recent) — pull cutoff

- **2026-09-02**: `reload` issue #2354 ("Bill Payment - Included Late
  Submit Transactions to All Batch File") closes after 4 SIT/UAT revision
  rounds (MRs !1751–!1802) — the most recently closed multi-revision item
  at pull time.
- **2026-09-04 17:06 (pull cutoff)**: latest MR in the dataset, `Draft:
  [SIT] {RDS} GIT#2415` (!1835) — still open/draft, i.e. active work in
  flight as of this pull.

## What's not in this timeline

This reconstructs *DB-repo-visible* history only. Milestones like
"Database Audit Log Review" and "Database User Access Review" are
recurring compliance cadences (quarterly/periodic reviews), not one-off
events — they're noted above at their start date but recur throughout the
whole period at roughly the cadence implied by their issue counts (14–32
issues each over ~3.5 years). Any architectural narrative from the
`reload` (application) side that isn't reflected in a `reload_db` MR/issue
is out of scope for this doc.

## Related

- [[gitlab-analysis/reload_db-tribal-knowledge]] — full detail on the bigint migration and GIT#441 saga summarized here
- [[gitlab-analysis/reload-timeline]] — the parallel application-side timeline
- [[architecture/reload_db/00-overview]] — the estate this timeline tracks changes against
