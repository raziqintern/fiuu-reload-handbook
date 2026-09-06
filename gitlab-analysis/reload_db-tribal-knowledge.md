---
tags: [gitlab-analysis, repo/reload_db]
aliases: ["reload_db Tribal Knowledge"]
---

# `reload_db` — Tribal Knowledge

Synthesized from the **full** issue and merge-request history of the
`reload_db` project on `git2u.fiuu.com`, pulled 2026-09-05.

> **Project path correction.** The task that produced this doc assumed the
> project lives at `offline-teams/reload_db`. That path does not exist on
> this GitLab instance. The actual DB-side sibling of `offline-teams/reload`
> is **`server/offline/rds/reload`** (project id `684`, description "reload
> under RDS (for database script)", default branch `SIT`) — confirmed both
> by the GitLab API (no `offline-teams/reload_db` project exists in the
> `offline-teams` group's 87 projects) and by the local clone's own git
> remote (`C:\git\fiuu_reload\reload_db` → `origin` →
> `https://git2u.fiuu.com/server/offline/rds/reload.git`). Everything below
> is pulled from that project. Wherever "GIT#nnnn" appears in an MR/issue
> title in this repo, it refers to an **issue in `offline-teams/reload`**
> (project 747), not an issue in this repo's own tracker — this repo's own
> issues are almost all `[Release]`/`[Patch Request]` operational tickets,
> and cross-references confirmed the numbers don't line up with local iids
> (e.g. this repo's own issue #441 is an unrelated `[release]` ticket, while
> "GIT#441" in dozens of MR titles here means `reload` issue #441).

## Coverage

- **792 issues** (782 closed / 10 open), created 2022-08-30 → 2026-09-02.
- **1,835 merge requests** (1,762 merged / 62 closed / 11 open), created
  2022-09-01 → 2026-09-04.
- Full metadata (title, description, state, labels, milestone, author,
  dates, branches) pulled for all of the above — see
  `raw/reload_db/issues.json` and `raw/reload_db/merge_requests.json`.
- Deep content (discussion threads) pulled for a **representative sample**
  of ~30 MRs, weighted toward the highest-discussion, highest-revision, and
  incident/rollback items identified from the metadata scan below — not
  every MR's discussion was read. Two full incident reports were read in
  full. This doc's claims about "what reviewers flag" are drawn from that
  sample and should be read as *strong recurring patterns*, not an
  exhaustive catalogue.

## Which databases actually get patched/break most

Ranked by mention count across all 1,835 MR titles+descriptions (a proxy
for "how much patch/schema-change traffic this database sees"):

| Database (MAINT folder) | MR mentions | Issue mentions |
|---|---|---|
| `TRANSACTION` | 1,064 | 167 |
| `CEPP` | 555 | 23 |
| `TNG` | 275 | 31 |
| `BILL_PAYMENT` | 222 | 26 |
| `CONFIGURATION` | 201 | 10 |
| `REPORTSUMMARY` | 195 | 4 |
| `INCOMM` | 162 | 29 |
| `INVENTORY` | 152 | 114 |
| `TICKET` | 129 | 5 |
| `RMS_OFFLINE` | 115 | 4 |
| `INCOMM_TRANS` | 99 | 23 |
| `EINVOICE` | 90 | 2 |
| `RESTORIFY` | 78 | 6 |
| `SAP` | 73 | 3 |
| `INVENTORY_MASTER` | 55 | 50 |
| `PREPAID` | 51 | 6 |
| `NOTIFICATION` | 19 | 2 |
| `LOGGING` | 13 | 2 |
| `DataWarehouse` | 8 | 0 |
| `MLookUp` | 3 | 4 |

`TRANSACTION` and `CEPP` dominate by a wide margin — every new payment
service-provider integration (Digi, MobilityOne, UMobile, IWK, YES, DTOne,
Celcom, ATX, ...) touches both: `CEPP` for the service/product/lookup
catalog, `TRANSACTION` for the actual transaction tables (usually one
partner-owned SQL schema per provider — see
`conventions/sql-conventions.md`). `INVENTORY`/`INVENTORY_MASTER` mentions
in *issues* are disproportionately high relative to MR mentions — most of
that is the recurring "Archive DB INVENTORY[_MASTER]" maintenance program
(see timeline), not bugs.

## Recurring bug/incident classes

### 1. Cross-database schema drift on mirrored tables

Several core entities are **physically duplicated across databases** —
e.g. `SalesTransactions`/`SalesOrders` exist in both `TRANSACTION` and
`REPORTSUMMARY`, and `Stocks` exists in both `INVENTORY` and
`INVENTORY_MASTER`. Nothing enforces that a column change in one copy
propagates to the other.

- **Issue #93** (the *only* issue in this repo carrying `Type::bug`): a
  SQL Agent job (`Daily.SalesTransactionReport_Ins`) started failing in
  April 2023 with `String or binary data would be truncated`, because a
  column-width increase to a `TRANSACTION`-side source table (via a
  release referencing `RMSO-2193`, done September 2022) was never mirrored
  onto the corresponding `ReportSummary.dbo.SalesTransactionReport` /
  `MOLPayTransactions` columns (`SoldBy`, `StaffId`, still `varchar(20)`).
  The bug didn't surface for ~7 months — until real data finally exceeded
  20 characters.
- The eventual fix for outgrowing `int` primary keys (see #2 below)
  required near-identical DDL across **four** databases in lockstep
  (`INVENTORY`, `INVENTORY_MASTER`, `REPORTSUMMARY`, `TRANSACTION` — MR
  !1649/!1658 etc.) specifically *because* the same logical tables are
  duplicated across all four.

**Takeaway:** when changing a column's type/width on any of
`SalesTransactions`, `SalesOrders`, `Stocks`, or similar core tables, check
the mirrored copy in the sibling database before assuming the change is
self-contained.

### 2. Running out of `int` — the bigint PK migration (2025-06 → 2026-08)

Issues **#1857** and **#1858** (`reload` project) — "increase table ID
Primary Key column size from int to bigint... PIN Service" /
"...Non-Pin Service" — tracked a company-wide migration once transaction
volume threatened to exhaust 32-bit identity ranges. This produced the
single largest, longest-running body of MRs in the sample:

- 6 SIT revisions + 4 UAT revisions for #1857 alone, plus parallel
  revisions for #1858, spanning MRs !1633 → !1826 (April–August 2026).
- The agreed technique, driven by reviewer pushback (see checklist doc),
  was **create-new-table → create-indexes → rename-table** ("swap table"),
  never an in-place `ALTER COLUMN` on a live high-traffic table — applied
  identically across `INVENTORY`, `INVENTORY_MASTER`, `REPORTSUMMARY`, and
  `TRANSACTION` (24 table-touching scripts in `TRANSACTION` alone in
  MR !1649).
  - `IIQ` note: an in-place `ALTER COLUMN` was attempted first
    historically (see #4 below re: index-rebuild locking) — the swap-table
    method is the lesson learned from that class of pain, not the starting
    point.
- MRs were explicitly labeled **"DOWNTIME NEEDED"** (!1649, !1664, !1806,
  !1807) and carried a `Scheduled Release Date` field locking them from
  premature production merge ("**DO NOT** merge to Production until
  release date"). The production rollout (MR !1808) merged on
  **2026-08-12**, matching the tentative date set back in April.

**Takeaway:** an `int` identity column on a high-volume table is a known,
already-hit capacity wall in this schema, not a hypothetical one. If a new
table's expected volume is large, consider `bigint` from the start rather
than repeating this migration.

### 3. Long-lived feature branches drifting from Production, requiring a revert

**GIT#441** ("Digi Bill Payment New API Integration", `reload` issue #441)
ran for **18 months** (Jan 2024 → Jul 2025) across at least 18 MRs in this
repo and is the clearest rollback story in the history:

1. 2024-01/04: initial SIT/UAT merge + Revision 2 (credential update).
2. 2024-03: a separate "Drop column" MR (!680) is deliberately **closed,
   not merged** — "do not include this MR same with the midnight release.
   Only deploy in next release." Destructive DDL kept out of the main
   patch batch on purpose.
3. 2024-05: the `main`/production MR is closed as **"postpone to further
   notice"** — the release itself stalls.
4. 2025-03: work resumes — Revision 3 merges, but Revision 4 (!1156) is
   closed/abandoned.
5. 2025-04: by now DEV/QA have drifted from Production (extra
   fields/columns that only exist non-prod). A dedicated
   **`GIT#441-revertToProd`** MR (!1167, !1185) is merged specifically to
   resync DEV/QA schema back to match Production, followed by a
   **`GIT#441-v1_v2_combination`** MR (!1168) to actually roll the feature
   forward correctly. Two more attempts (`-version2`, `-v2postdeployment`)
   are opened and closed without merging.
6. One MR in this saga (!1169) was closed because, per the author's own
   comment, "I did not update the store procedure but mess up this MR
   after resolve the conflict" — a botched conflict resolution, not a
   design change.
7. 2025-04 → 2025-07: the fix finally ships to production across three
   more consolidated `main` MRs (!1183, !1207, !1227) before a final
   standalone production MR (!1293, merged 2025-07-16).

**Takeaway:** when a CR's SIT/UAT branch sits unmerged to production for
months, DEV/QA can silently diverge from Production in ways that aren't
visible until someone tries to finish the release — budget for a
"revert-to-prod-baseline" pass before resuming, not just a "continue where
we left off."

### 4. Automated jobs targeting the wrong environment / wrong time

Two full incident reports exist in this repo (both use the strict
`[Incident]`-titled template — see `gitlab-reload-issues` §3.7):

- **Issue #713** — *"PIN service disruption due to table/data corruption –
  04 February 2026"*. A SQL Agent job intended for a restored copy of the
  `Inventory`/`Inventory_Master` databases instead executed against
  **production**, corrupting data and forcing a live
  point-in-time-recovery (PITR) + database rename under a 5-hour
  emergency-maintenance window (07:45–12:45). The recorded 5-Whys root
  cause: *"The job was connected to the production instance and the target
  database was not verified before execution... there was no mandatory
  pre-run validation or peer approval for data-modifying jobs."* One
  attempted shortcut mid-incident (recreate the table schema instead of
  waiting for PITR) was tried and explicitly walked back because it would
  have dropped indexes.
- **Issue #330** — *"AWS.TerminalAPI.EventLogMonitor... 06 May 2024"*. A
  daily index-rebuild job scheduled for 04:15 (low-traffic) instead fired
  at ~06:00 (start of peak traffic), locking `SalesTransactions` for
  reads/writes for over an hour before a DBA identified and killed the
  index-rebuild session.

**Takeaway:** the two recorded incidents are both "a scheduled/automated
job touched the wrong target (environment, or time-of-day)," not application
bugs. If reviewing a new SQL Agent job or scheduled maintenance task, the
two questions worth asking explicitly are "what stops this from ever
running against production by accident?" and "what stops this from running
outside its intended window?" — issue #713's own preventive action item
was exactly "require peer review and approval for any production
data-modifying change before execution," which had not existed before.

## Gotchas — conventions that aren't written down anywhere else

- **Scripts are frequently split and named per environment**
  (`01_DEV_X.sql`, `01_QA_X.sql`, `01_PRODUCTION_X.sql`), with the MR
  description explicitly calling out which files must **not** be run in
  Production (very common — dozens of MRs, e.g. !551, !718, !740, !1168,
  !1169). Reviewers (see checklist doc) will flag a script that doesn't
  carry this suffix when its data is clearly environment-specific
  (production-only lookup IDs, real credentials, etc.).
- **Unused columns get renamed with an `xxx_`/similar prefix before they
  get dropped, and dropping happens in its own later MR, not bundled with
  the feature change** (GIT#441 Revision 3: "add prefix xxx_ to unused
  column"; the standalone "Drop column" MR !680 was deliberately deferred
  out of a release). Treat "add prefix to deprecate" + "drop later" as the
  house pattern for retiring a column, not an immediate `DROP COLUMN`.
- **Structural changes to a live table use the create-new / create-indexes
  / rename-table "swap" pattern, not in-place `ALTER COLUMN`**, once the
  table is high-traffic (see bigint migration above). A reviewer will
  explicitly ask "why not rename the existing table/constraints instead of
  altering in place" for anything touching indexes/constraints on a busy
  table (MR !1649 discussion).
- **Nearly every one-off `Patch Request` MR ships with a paired
  `..._Verify.sql`** — 507 of 524 MRs (97%) that used the
  `Run DB Patching Scripts` section paired at least one patch script with
  a verification script. Treat "patch script with no accompanying verify
  script" as the exception needing justification, not the norm.
- **Reporting queries against a separate `RPT` instance need their own,
  separately-granted permissions** — `ALTER`/`CREATE`/`DROP` procedure and
  table-level `DELETE` grants on the RPT copies of `BILL_PAYMENT`,
  `REPORTSUMMARY`, `TRANSACTION` had to be requested mid-review on MR
  !1628 before the change could even be tested; don't assume dev access to
  the primary instance implies access to the reporting instance.
- **New payment-provider integrations that touch money movement build a
  rollback flag into the schema up front** — e.g. MobilityOne's
  integration (GIT#1338) shipped `..._Upd_IsRollback` stored procedures
  and an `IsRollback`-style column alongside the initial `Ins`/`Upd`
  procedures, not added after an incident.
- **SQL script comments are treated as an audit trail, not scratch
  space** — a reviewer explicitly blocked deleting old comments in a
  script ("You should not delete old comments. It is a logging.", MR
  !1074). Don't clean up/remove prior comments in a patch script even if
  they look stale.
- **The formal "Risk Analysis" MR template (Asset Value × Impact ×
  Likelihood) is essentially never used in practice** — see the review
  checklist doc for what actually substitutes for it. Don't assume a
  quantified risk score will be present on a real MR just because the
  official template has one.

## What's *not* covered by this pull

- This doc covers `reload_db` (`server/offline/rds/reload`) only, per
  scope. The `GIT#nnnn` issues referenced throughout live in
  `offline-teams/reload` and were only fetched individually, for context,
  for the ~20 highest-signal issue numbers identified from the MR-churn
  scan — not the full `reload` issue history.
- Discussion threads were read for ~30 of 1,835 MRs (the highest-discussion
  and highest-revision ones, by `user_notes_count` and revision-number in
  title) plus the 2 full incident reports — not every MR's thread.
- `RMSO-nnnn`-numbered items referenced in some MR titles are an external
  Jira ticket system this pull had no access to; those references are
  reproduced as-is where seen but not independently verified.

## Related

- [[architecture/reload_db/00-overview]] — the database estate this doc ranks by patch/break volume
- [[architecture/reload_db/cepp]] and [[architecture/reload_db/transaction]] — the two heaviest-traffic databases (§"Which databases actually get patched/break most")
- [[architecture/reload_db/patch-script-conventions]] — the naming/ticket-format conventions behind the "Gotchas" section
- [[gitlab-analysis/reload_db-timeline]] — the bigint migration and GIT#441 saga in full chronological detail
- [[gitlab-analysis/reload_db-mr-review-checklist]] — the review patterns behind these same MRs
