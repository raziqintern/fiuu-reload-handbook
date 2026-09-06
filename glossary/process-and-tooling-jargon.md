# Process & Tooling Jargon

Internal GitLab conventions, ticket-tracking quirks, review-process jargon,
and patch-script vocabulary — the stuff that makes issue/MR history and
`reload_db/MAINT` scripts unreadable to someone new until it's translated. See
[`business-and-partner-terms.md`](business-and-partner-terms.md) for
partner/domain vocabulary instead.

---

## GitLab label & category taxonomy

- **`Type::bug`** — the one GitLab *label* confirmed in the mined docs. It is
  used on only **27 of 2,604** `offline-teams/reload` issues (~1%) and on
  exactly **1 of 792** `reload_db` issues (#93) — searching by this label
  alone will make the system look far more stable than it is. Most real
  defects instead surface as an unlabeled `[Issue]`-titled ticket, a
  **`Patch Request`**, or a **`Variance`** (see below) — see
  [`gitlab-analysis/reload-tribal-knowledge.md`](../gitlab-analysis/reload-tribal-knowledge.md) §1.
  **Note:** the mined docs only confirm this one `Type::` label value. A
  fuller `Type::` taxonomy (e.g. other values beyond `bug`) is not detailed
  anywhere in the architecture/conventions/gitlab-analysis docs this glossary
  draws from — don't assume additional `Type::*` values exist or mean
  something specific without checking GitLab directly.
- **Category brackets** — issue titles are conventionally prefixed with a
  bracketed category rather than relying solely on labels:
  - **`[CR]`** — Change Request (a planned, requested change, as opposed to a
    reported defect).
  - **`[Release]`** — a production-deployment tracking ticket (252 of these
    in `reload`, roughly weekly-to-biweekly cadence since Dec 2022).
  - **`[Issue]`** — the de facto "something is broken" bracket, used far more
    consistently than the `Type::bug` label itself.
  - **`[Incident]`** — the formal Incident Response Report template, reserved
    for the 8 (reload) / 2 (reload_db) most serious events in the datasets.
  - **`Patch Request`** — the single largest category in `reload` (445 of
    2,604 issues, 17%): a one-off request for IT to run a script against
    production data to fix the *symptom* of a bug, not necessarily followed
    by a code fix.
  - **`Variance`** — a reconciliation mismatch between Reload's own records
    and a partner/service-provider's records, discovered during settlement
    (205 of 2,604 issues, 8%).
  - **`Enhancement`** — non-bug improvement/tech-debt work (e.g. the 2023-12-29
    bulk migration batch of tech-debt tickets).
- **Milestones as recurring compliance programs, not one-off tickets** — names
  like *"Archive DB TRANSACTION"*, *"Archive DB INVENTORY[_MASTER]"*,
  *"Database Audit Log Review"*, *"Database User Access Review"*, and *"RDS
  Monthly Backup Review and Restoration Testing"* are periodic operational
  cadences (quarterly/monthly reviews), launched as a formal DB-governance
  program in Jan 2023 — not individual incidents or feature requests. These
  five milestones alone account for 108 of `reload_db`'s 792 issues.
  Detail: [`gitlab-analysis/reload_db-timeline.md`](../gitlab-analysis/reload_db-timeline.md).

---

## Ticket-tracker prefix variants

At least **four spellings** reference the same issue tracker
(`offline-teams/reload`, project id 747), used inconsistently by different
authors/years:

| Format | Example |
|---|---|
| `GIT#nnnn` | `GIT#1909` |
| `GIT-nnnn` | `GIT-197` |
| `GIT_nnnn` | `GIT_1687` |
| `GITnnnn` (no separator) | `GIT1858` |

Plus an older, parallel prefix:

- **`RMSO-nnnn`** — a legacy Jira ticket ID, predating this GitLab tracker.
  On **29 Dec 2023**, a batch of ~30 GitLab issues (`#842`–`#872`) was created
  in a single day, each tagged "Jira ticket migration - RMSO-xxxx" — the point
  where the old Jira backlog was consolidated into git2u GitLab issues.
  `RMSO-` references still appear standalone in `reload_db` patch filenames
  and are also seen combined as **`CR-RMSO-nnnn`** for formal change requests.

**Critical gotcha:** these are not normalized against each other. The *same*
ticket can appear with different spellings across sibling files in the same
patch (e.g. `TRANSACTION/Data/GIT#1857/...` next to `TRANSACTION/Table/GIT1857/...`).
Don't assume grepping for one format finds every reference — search for the
bare number too. Also: `GIT#nnnn` inside a `reload_db` MR/issue title always
refers to an issue in the *`reload`* project (747), never to `reload_db`'s own
issue tracker (whose own numbers are unrelated and mostly `[Release]`/
`[Patch Request]` tickets).
Detail: [`architecture/reload_db/patch-script-conventions.md`](../architecture/reload_db/patch-script-conventions.md),
[`conventions/sql-conventions.md`](../conventions/sql-conventions.md),
[`gitlab-analysis/reload_db-tribal-knowledge.md`](../gitlab-analysis/reload_db-tribal-knowledge.md).

---

## `deepcode_ai` — the automated review bot

An automated AI code-review bot that first appears on **13 June 2025**
(commenting on `!1304`) and is still active as of the most recent sampled MR.
This marks a real, dateable process change: from mid-2025 on, every MR in
`offline-teams/reload` gets reviewed by *both* the long-standing human lead
reviewer (`khenggek`, below) *and* this bot. Its comments are long, structured
"Deepcode Review / Overall Summary" write-ups that cluster around mechanical
correctness issues: `int`→`long` type-widening risks on stored-procedure
parameters, unguarded `FirstOrDefault()`/null-dereference chains, stale
references left after a parameter-list refactor, duplicated logic that should
call an existing helper, copy-paste variable-name typos, and a standing
security note whenever a diff touches encryption-key/secrets handling.
Detail: [`gitlab-analysis/reload-mr-review-checklist.md`](../gitlab-analysis/reload-mr-review-checklist.md)
§B.

## `khenggek` — the fixed human reviewer

Kheng Gek Goh (Manager, Software Development) reviews essentially every MR in
both `reload` and `reload_db`'s history from project start (2022) onward, and
is the team's documented mandatory-reviewer assignment. If you see the same
reviewer handle across nearly every MR thread regardless of module, this is
who it is — not an accident of sampling. What they flag by hand (naming
prefixes, blank-line discipline, log-and-rethrow duplication, partner-spec
cross-checks, `NOLOCK`/join-shape correctness on the DB side) is the
practical, unwritten review standard for both repos.
Detail: [`gitlab-analysis/reload-mr-review-checklist.md`](../gitlab-analysis/reload-mr-review-checklist.md)
§A, [`gitlab-analysis/reload_db-mr-review-checklist.md`](../gitlab-analysis/reload_db-mr-review-checklist.md).

---

## MAINT patch-script conventions

`reload_db/MAINT/` has **no migrations framework** (no EF migrations, no
Flyway/Liquibase, no version table) — filenames and folder layout *are* the
only versioning system that exists.

- **`MAINT/<Database>/<ObjectType>/`** — object baselines, one file per
  database object, organized by type (`Table/`, `StoredProcedure/`,
  `Function/`, `Index/`, `Type/`, `Schema/`, `Data/`, `DataReference/`,
  `Trigger/`, `View/`).
- **Baseline vs. incremental patch filenames** — `<schema>.<Object>.sql` is a
  full point-in-time definition snapshot (looks like a destructive
  `DROP`+`CREATE` but isn't run as one against live data); `<schema>.<Object>_<Action>_<Ticket>.sql`
  is an incremental patch. A table's real current shape is the baseline
  **plus every later-dated patch file**, never the baseline alone.
- **`00_`/`01_`.../`NN_Verify` step convention** — inside a ticket-numbered
  patch folder, `00_` is a pre-check `SELECT` capturing the *before* state
  (often with a hand-annotated expected row count), `01_` through `NN-1_` is
  the actual patch (one file per logical change unit), and the final `NN_`
  (commonly named `..._Verify`) re-runs the pre-check query and expects an
  empty/corrected result. This is a manual audit trail baked into the script
  itself, standing in for a migrations table that doesn't exist.
- **Ticket-numbered patch folders** (top level of `MAINT/`, outside any
  module folder): `00-PatchScript/`, `00-PatchScript-Global/` (also numbers by
  dependency order for master-data seeding, e.g. Regions before States before
  Dealers), `00-Excel Patching/` and `00-Excel Patching-Global/` (`.xlsx`
  files instead of `.sql`, for patches too unwieldy to review as raw SQL
  diffs), and `01-Release/` (loosely-maintained release-bundle archives).
- **`xxx_` prefix** — the "deprecate before drop" convention: a column/table
  gets renamed with an `xxx_` (or similar) prefix first, and the actual
  `DROP` happens later in its own separate MR, not bundled with the feature
  change. Only 5 true table-drop files exist in the entire `CEPP` estate.
- **"Swap table" pattern** — the accepted technique for structural changes to
  a live, high-traffic table: create the new table → create its indexes →
  rename tables to swap, **never** an in-place `ALTER COLUMN`. This is the
  lesson learned from earlier in-place-`ALTER`-caused locking incidents (see
  the index-rebuild-locking incident, #330), and was the mandated approach
  for the 2026 bigint migration across four databases at once.
- **`_new_GIT1857` / `_new_GIT1858`** — sibling-table suffixes marking the
  in-place `int`→`bigint` primary-key migration (issues #1857/#1858): both
  the old (`int`) and new (`bigint`) table are kept side-by-side during the
  transition — check which one a given stored procedure actually targets
  before assuming it's the newer one.
- **Environment-suffixed scripts** — `01_DEV_X.sql`, `01_QA_X.sql`,
  `01_PRODUCTION_X.sql` (also seen as a bare `-AWSQA` suffix); reviewers
  expect production-only scripts to be named unambiguously and will ask where
  the DEV/QA counterpart is if one isn't provided.
- **`DOWNTIME NEEDED`** — an explicit MR-title marker for DDL expected to lock
  a busy table, paired with a **`Scheduled Release Date`** field in the
  description and a "DO NOT merge to Production until release date" hold.
- **"Deployment Notes"** — an MR description section present on ~86% of
  sampled `reload_db` MRs; even "Not available" is the expected explicit
  value on a simple patch MR, not a blank section.
- **The formal "Risk Analysis" template (`Asset Value × Impact × Likelihood`)
  is essentially never used** — across all 1,835 `reload_db` MRs, only the MR
  that originally added the template file itself actually contains the words
  "Risk Analysis"/"Risk Score." What substitutes for it in practice: a
  **`Total = N`** record-impact count (on ~31% of MRs), a per-database/
  per-object-type script inventory with counts, a paired verify script, an
  explicit `DOWNTIME NEEDED`/environment-scoping flag, and attached execution/
  verification logs — operational signals instead of a qualitative
  impact/likelihood narrative.
- **`IX_` / `IXU_`** — SQL index-name prefixes: non-unique vs. unique
  nonclustered index, consistently applied.
- **SQLAgentJob naming** — `[HHMM]<Frequency>.<JobName>_<Verb>.sql` (e.g.
  `[0130]Daily.SalesTransactionReport_Ins.sql`), a full job-definition
  snapshot re-generated whenever the job changes, same philosophy as the
  `Table/` baselines.
- **`CICDTest`** — a scratch database under `MAINT/` used only to validate the
  patch-deployment pipeline itself; not real production schema.

Detail: [`architecture/reload_db/patch-script-conventions.md`](../architecture/reload_db/patch-script-conventions.md),
[`conventions/sql-conventions.md`](../conventions/sql-conventions.md),
[`gitlab-analysis/reload_db-mr-review-checklist.md`](../gitlab-analysis/reload_db-mr-review-checklist.md),
[`gitlab-analysis/reload_db-tribal-knowledge.md`](../gitlab-analysis/reload_db-tribal-knowledge.md).

---

## Environments and release flow

- **SIT / UAT** — System Integration Testing / User Acceptance Testing, the
  pre-production stages an MR moves through before a production (`main`-
  branch) merge. `reload_db`'s default branch is literally named `SIT`.
  MR titles carry `[SIT]`/`[UAT]`/`[main]` prefixes accordingly (e.g.
  `[main] {RDS} GIT#1857, GIT#1858`).
- **`main`-branch MR** — shorthand for "this is the actual production release
  merge," as opposed to an SIT/UAT-stage MR for the same ticket.
- **`Revision N`** — a merge request's revision-cycle counter (seen up to
  Revision 17 in `reload`, Revision 6+ in `reload_db`). A high revision count
  is **not automatically a quality signal** — a lot of it reflects evolving
  business requirements discovered mid-review, not repeated rejection of the
  same code.
- **PITR (Point-In-Time Recovery)** — the SQL Server recovery technique used
  during the Feb 2026 PIN-service data-corruption incident (#713) after a
  scheduled job ran against production by mistake.

---

## Other shorthand seen in code, issues, and patch scripts

- **`class-library` vs. `Components/`** — a recurring source of confusion:
  some shared modules (`AWSCore`, `Database`, `Reloads/TNG`, `Reloads/Game`,
  `Secure/*`) live as *source* inside the separate `class-library` git
  submodule/repo, while others with the exact same "shared library" role
  (`CEPP`, `Logging`, `Lookup`, `MasterFramework`, `Provider`) have their
  *source* inside the `reload` repo's own `Components/` folder but are
  *also* distributed as a prebuilt DLL sitting at `class-library`'s repo
  root. Don't assume "it's in class-library" means the source is there — it
  might only be the compiled artifact.
  Detail: [`architecture/reload/00-topology.md`](../architecture/reload/00-topology.md) §4.
- **`EngineContext` / Autofac service locator** — the
  `EngineContext.Current.Resolve<T>()` pattern used pervasively for
  cross-service dependencies (as opposed to constructor injection); the
  underlying DI container is Autofac, wrapped by `Fiuu.MasterFramework.Dependency`.
  Detail: [`conventions/layering-and-architecture.md`](../conventions/layering-and-architecture.md).
- **`SqlAccessor` / `ParameterCollection`** — the older of two coexisting
  data-access styles (a custom ADO.NET wrapper), as opposed to `Fiuu.Database`'s
  newer Dapper-based `BaseProvider<T>`. Seeing one or the other in a file
  doesn't indicate age by itself — it tracks module/author.
  Detail: [`conventions/data-access.md`](../conventions/data-access.md).
- **`_V1` suffix** — a versioned-duplicate stored-procedure naming pattern
  seen heavily in `INCOMM` (e.g. `ApplicationRequests_Ins` vs.
  `ApplicationRequests_Ins_V1`); which version is canonical/still-called
  wasn't determined from the script folder alone.
- **`SelOut_`** — a stored-procedure naming variant seen in `TNG` (e.g.
  `AccountServiceProviders_SelOut_SpId_By_AccountId`), likely denoting a
  single-output-value proc rather than a full row-set — not confirmed by
  reading proc bodies.
- **`M` prefix** — any column/property that's a foreign key into a lookup/
  status/master table (`MStatusId`, `MWorkFlowStatusId`, `MSourceTypeId`) —
  "M" for "Master." A genuine cross-cutting convention, not module-local.
  Detail: [`conventions/naming.md`](../conventions/naming.md).
- **`NOLOCK`** — the `WITH (NOLOCK)` hint applied unconditionally to
  essentially every `Sel`/read stored procedure in the estate — a deliberate
  throughput-over-consistency choice; dirty reads are possible by design.
  Detail: [`conventions/known-patterns-and-pitfalls.md`](../conventions/known-patterns-and-pitfalls.md).
- **`GIT#441-revertToProd`-style branch naming** — an ad hoc suffix
  convention for a branch whose purpose is to resync a drifted DEV/QA schema
  back to match Production before resuming a stalled feature, seen in the
  18-month GIT#441 (Digi Bill Payment) saga.
  Detail: [`gitlab-analysis/reload_db-tribal-knowledge.md`](../gitlab-analysis/reload_db-tribal-knowledge.md)
  §3.
- **PGW** — "Payment Gateway"; see [`business-and-partner-terms.md`](business-and-partner-terms.md)
  for the controller-level detail.

---

## Coverage note

Everything above is grounded in what the architecture/conventions/gitlab-analysis
docs actually document or cite (issue/MR numbers, file paths, or direct
quotes). Where a term's meaning was flagged as inferred-not-confirmed in the
source doc (e.g. `SelOut_`, `_V1`), that uncertainty is carried over here
rather than resolved by guessing.
