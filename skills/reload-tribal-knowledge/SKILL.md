---
name: reload-tribal-knowledge
description: Condensed reference for tribal knowledge mined from the full GitLab issue/MR history of both offline-teams/reload (the application) and server/offline/rds/reload (the database repo, commonly mis-assumed to be "offline-teams/reload_db") — recurring bug classes, what the human reviewer vs. the deepcode_ai bot actually flag on merge requests, real incident root causes, and timeline highlights. Use before touching a module with a known bug-class history (Pin/Pinless drift, partner date/format contracts, TNG crypto handle leak, cross-database schema drift), before submitting or reviewing a merge request in either repo (to pre-empt the exact comments a reviewer will make), or when asked what's historically gone wrong or what reviewers care about in this codebase.
---

# Reload / reload_db — tribal knowledge (condensed)

Read `fiuu-reload-handbook` (master skill) first, especially correction #3
on the `reload_db` project path. Full source:
[`../../gitlab-analysis/`](../../gitlab-analysis/). Covers **two** separate
repos with separate histories — `offline-teams/reload` (project 747, 2,604
issues / 1,963 MRs, 2022-07-15→2026-09-05) and `server/offline/rds/reload`
(project 684, 792 issues / 1,835 MRs, 2022-08-30→2026-09-04) — kept distinct
below since their bug shapes and review norms differ.

Frame this as "things to know before you touch this code," not a changelog.

## `reload` (application repo)

### Where bugs actually live — don't filter on `Type::bug`

Only **27 of 2,604 issues (~1%)** carry `Type::bug`. Real defects
overwhelmingly surface as unlabeled `[Issue]` tickets, or as **`Patch
Request`** (445 issues, 17% — a one-off prod data-fix, not necessarily
followed by a code fix) or **`Variance`** (205 issues, 8% — a
reconciliation mismatch found during monthly settlement). Search by
category bracket and keyword, not the bug label, when researching "what
goes wrong here."

### Recurring bug classes (full detail + issue citations:
[`reload-tribal-knowledge.md`](../../gitlab-analysis/reload-tribal-knowledge.md))

1. **Validator scope drifts from what a role/tab actually shows** —
   mandatory-field validators fire for fields a given user role/dealer type
   can't even see (#2454, #2168). Check every validator on a multi-purpose
   page when adding a new tab/role/dealer type, not just new fields.
2. **Unguarded placeholder-dropdown → typed conversion** — resetting a
   dropdown to `-Please Select-` and saving throws on an empty-string→
   `Integer` conversion with no guard (#2190). Same shape recurs elsewhere.
3. **Pin and Pinless implementations drift apart** — treated as separate
   code paths for the same product line; a fix/feature in one routinely
   isn't mirrored to the other (#2108, the split #1857/#1858 bigint
   migration, numerous standalone per-partner Pinless integration CRs).
   **When touching a Pin-service bug/feature, check the Pinless equivalent
   and vice versa.**
4. **Partner unit/format contracts are a recurring trap** — expiry
   date-only vs. datetime (#2551), cents-vs-decimal amount formatting
   (#2346, also sent the "new balance" email before the balance was
   actually updated), and using `DateTime.Now` instead of the
   merchant-supplied transaction timestamp (CR #2328, plus a standing
   review comment — see MR checklist A5). **Check the partner's actual
   spec for unit/format, don't assume.**
5. **Two independent "payment completed" signals racing** — webhook
   Notification-URL callback and browser redirect both updated status
   independently, causing duplicate transactions (#1483, 683 records
   manually reversed). Any flow with two completion signals needs one
   authoritative source or a dedupe key.
6. **Per-request resource leak → "gets slow over hours, restart fixes it"**
   — TNG transactions crept to 2 hours because every transaction
   re-opened and RSA-decrypted a `.pfx` session key from scratch, never
   releasing the handle, inside a per-account lock that turned the leak
   into a queue (#2592). This exact shape (open-and-never-release inside a
   hot path + a per-resource lock) is worth checking for on any "degrades
   over time, restart helps" report.
7. **`int` identity columns have already hit their ceiling, twice** — #1857/
   #1858 migrated multiple high-volume tables to `bigint` after hitting
   30–65% of int32 max. Check `max(id)` vs int32 max before adding a new
   high-write-volume feature on an existing `int` PK.
8. **Log-and-rethrow when the caller also logs** — flagged repeatedly by
   the human reviewer as actively misleading during incident triage (see
   MR checklist A3).

### Incidents (all 8)

| # | Date | Root cause class |
|---|---|---|
| #97 | Jan 2023 | Partner API-contract mismatch (wrong enum value sent) |
| #1221 | Jun 2024 | MITM attack on Offline Portal, contained ~2h |
| #1525 / #2257 | Dec 2024 / Jan 2026 | Same alert class, over a year apart — 7-Eleven middleware error-rate; check whether #1525's remediation actually caught #2257 sooner |
| #1736 / #1772 | Apr 2025 | Not code bugs — a dealer Prepaid↔Consignment model switch actioned without the paired balance-reset step |
| #1892 | Jun 2025 | Terminal Server unhandled exception silently stopped TNG sales overnight, no alert fired |
| #2214 | reported Dec 2025 (period Jun–Jul 2025) | Reconciliation-detection lag, not a live incident |

**If handling a Prepaid↔Consignment model change, treat "zero out/reconcile
the balance" as a mandatory paired step**, not optional cleanup — it's
caused two of the eight recorded incidents.

### MR review checklist highlights (full:
[`reload-mr-review-checklist.md`](../../gitlab-analysis/reload-mr-review-checklist.md))

Two reviewer voices, both still active: **`khenggek`** (human lead,
reviews essentially every MR since 2022) and **`deepcode_ai`** (AI bot,
first appeared 13 Jun 2025 — a real, dateable process change, running
alongside not instead of the human review).

**What `khenggek` catches by hand** — do these yourself first:
- Every new local variable needs a datatype-indicating prefix (Hungarian
  notation), even in files that don't currently use it.
- Exactly one blank line between distinct logic blocks; consistent
  brace/bracket style within a file.
- Never log-and-rethrow to a caller that also logs.
- Partner-facing behavior (response codes, formats) must be checked
  against the actual spec or a sibling integration, never assumed.
- Transaction timestamps must use the merchant-supplied value, never
  `DateTime.Now`.
- New failure/edge-case log lines must include the record's key identifier
  (reference/terminal/dealer ID), not a generic message.
- No unbounded report queries — match the sibling report's row-limit
  convention.
- Confirm-then-remove dead code introduced/exposed by the change.
- Don't reuse a mismatched model/DTO where most fields are irrelevant.

**What `deepcode_ai` catches mechanically** — check these even though the
bot will too:
- Any `int`→`long`/`bigint` type-widening change needs every call site
  checked (stored-proc params, DTO properties, API contracts), not just the
  column.
- Null-check before dereferencing a `FirstOrDefault()`-style result.
- After a parameter-list change, grep the whole method body for stale
  references to the removed parameter.
- Duplicated logic should call the existing helper instead.
- Renamed variables checked across the whole file for leftover old-name
  references (copy-paste typos).
- Any secrets/encryption-key handling gets a security note — check it
  matches the AWS Secrets Manager migration direction, don't dismiss as
  boilerplate.

A high `(Revision N)` count (up to 17) is common and usually reflects
evolving business requirements mid-review, not poor initial code quality —
check what actually changed between revisions before reading it as a
quality signal.

### Timeline highlights (full:
[`reload-timeline.md`](../../gitlab-analysis/reload-timeline.md))

Nov 2022 project start → 2023 heavy CR/Patch/Variance volume + first CI/CD
investment → Feb–Aug 2024/2025 RMS→Fiuu rebrand → 2024 eInvoicing
integration begins (still needs monthly manual resubmission patches as of
mid-2026 — don't treat any one eInvoice fix as final) → Jun 2025
`deepcode_ai` adopted + bigint migration begins → 2025–2026 ongoing
"consolidate X" tech-debt cleanup (schedulers, reports, stored procedures)
→ May 2026 core modules move from `reload`'s `Components/` into the
separate Class Library repo → Aug 2026 TNG crypto-leak fix.

## `reload_db` (database repo — see path correction in master skill)

### Which databases actually get patched/break most

By MR-title/description mention count: **`TRANSACTION` (1,064) and `CEPP`
(555) dominate by a wide margin** — every new provider integration touches
both (`CEPP` for catalog, `TRANSACTION` for the transaction schema). `TNG`
(275), `BILL_PAYMENT` (222), `CONFIGURATION` (201) follow.
`INVENTORY`/`INVENTORY_MASTER` have disproportionate *issue* mentions
relative to MRs — mostly the recurring "Archive DB" maintenance program,
not bugs.

### Recurring bug/incident classes (full:
[`reload_db-tribal-knowledge.md`](../../gitlab-analysis/reload_db-tribal-knowledge.md))

1. **Cross-database schema drift on mirrored tables** — a column-width
   increase on a `TRANSACTION`-side table wasn't mirrored onto
   `REPORTSUMMARY`'s copy, and a SQL Agent job silently failed with
   truncation errors **7 months later** once real data exceeded the old
   width (issue #93, this repo's *only* `Type::bug`). Always check the
   mirrored copy (`SalesTransactions`/`Stocks`-style duplicated tables)
   before assuming a column change is self-contained.
2. **The int→bigint migration (2025-06→2026-08)** — the single largest MR
   body in the dataset, executed via **create-new-table → create-indexes →
   rename-table swap**, never an in-place `ALTER COLUMN`, across
   `INVENTORY`, `INVENTORY_MASTER`, `REPORTSUMMARY`, `TRANSACTION` in
   lockstep. MRs explicitly labeled `DOWNTIME NEEDED` with a locked
   `Scheduled Release Date`. If a new table's expected volume is large,
   start with `bigint`.
3. **GIT#441 (Digi Bill Payment) — an 18-month saga with a mid-flight
   revert** — a long-unmerged feature branch let DEV/QA drift from
   Production; a dedicated revert-to-prod MR was needed before the feature
   could actually land. **Budget for a revert-to-baseline pass, not just
   "continue where we left off," if a branch sits unmerged for months.**
4. **Two full incidents, both "an automated job hit the wrong target"** —
   issue #713 (Feb 2026): a job meant for a restored copy executed against
   **production**, corrupting `Inventory`/`Inventory_Master`, requiring a
   5-hour PITR+rename recovery (root cause: no mandatory target validation
   or peer approval existed for data-modifying jobs). Issue #330 (May
   2024): a daily index-rebuild job fired at peak traffic instead of its
   04:15 low-traffic slot, locking `SalesTransactions` for over an hour.
   **When reviewing a new SQL Agent job: what stops it running against
   prod by accident, and what stops it running outside its window?**

### Gotchas not written down anywhere else

- Scripts are split per environment (`01_DEV_X.sql`/`01_QA_X.sql`/
  `01_PRODUCTION_X.sql`) with production-only files explicitly named in
  Deployment Notes.
- Deprecating a column: rename to an `xxx_` prefix first, drop later in its
  **own** MR — never bundled with the feature change.
- 97% of one-off patch MRs pair a patch script with a `..._Verify.sql`.
- The formal quantified Risk Analysis template
  (`Asset Value × Impact × Likelihood`) is essentially **never** filled
  out in practice (exactly 1 of 1,835 MRs — the one that added the
  template itself). What substitutes in practice, and is what reviewers
  actually check:
  - a `Total = N` record-impact count (31% of MRs),
  - a per-database/object-type script inventory with counts,
  - a paired verify script,
  - explicit environment-scoping + `DOWNTIME NEEDED`/`Scheduled Release
    Date` instead of a qualitative impact narrative,
  - attached execution/verification logs for risky patches.
- SQL script comments are an audit trail — a reviewer explicitly blocked
  deleting old comments ("It is a logging.").

### MR review checklist highlights (full:
[`reload_db-mr-review-checklist.md`](../../gitlab-analysis/reload_db-mr-review-checklist.md))

Reviewer `@khenggek` again dominates. Most-repeated categories:
- Missing `WITH (NOLOCK)` on reads against busy tables.
- `LEFT JOIN` where semantics actually require `INNER JOIN` (esp. when the
  right side is filtered in `WHERE` anyway).
- `DISTINCT` papering over an actual join/duplication bug — expect to be
  asked "why do you need distinct," not just accepted.
- Status/workflow filters (`MStatusId`/`MWorkflowStatusId`) expected on
  every joined table that has them, applied at the join, not bolted on
  after.
- ID vs. Name lookup mismatches when onboarding a new provider's lookup
  codes.
- File path must match the object type's folder; filename must match the
  MR description exactly; the embedded `GIT#nnnn` must match the actual
  issue being worked (copy-paste-and-forgot-to-rename is a real recurring
  mistake).
- Environment-scoped files need an explicit suffix, and a DEV/QA
  counterpart if production-only.
- Multi-script patches on the same object need explicit numeric execution
  order.
- Default constraints can silently block a naive column drop — check
  `sys.default_constraints` first.
- A performance-motivated join-strategy change needs a before/after timing
  comparison, not just an assertion.

### Timeline highlights (full:
[`reload_db-timeline.md`](../../gitlab-analysis/reload_db-timeline.md))

Aug 2022 SVN→Git migration → Jan 2023 company-wide DB governance program
launched (Archive DB / Audit Log Review / User Access Review milestones,
108 of 792 issues) → Apr 2023 issue #93 (drift bug) and May 2023 issue #330
(mistimed job) → 2024–2025 GIT#441 saga → Jun 2025 bigint migration proposed
→ Feb 2026 issue #713 (worst incident) → Apr–Aug 2026 bigint migration
executes and ships (2026-08-12) → Sep 2026 pull cutoff, active work still
in flight.

## Coverage caveats

Both tribal-knowledge docs are full-metadata scans (every issue/MR title +
description) with **discussion-thread depth only on a sample**: `reload`
read all 8 incidents in full plus ~24 highest-discussion MRs (3,620
comments); `reload_db` read ~30 highest-discussion/highest-revision MRs
plus 2 full incident reports. Treat cited issue/MR numbers as representative
examples of a pattern, not an exhaustive list — see each source doc's own
"Coverage note" for exact numbers before relying on a claim of completeness.
