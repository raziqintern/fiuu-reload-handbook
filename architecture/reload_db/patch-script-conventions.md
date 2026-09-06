---
tags: [reload_db/architecture, conventions]
aliases: ["MAINT Patch Script Conventions"]
---

# MAINT patch-script conventions

There is no migrations framework (no EF migrations, no Flyway/Liquibase, no
version table). `reload_db/MAINT/` is a flat folder-per-object-type tree of
hand-written, hand-run SQL scripts, and the *filenames and folder layout are
the only versioning system that exists*. This matters architecturally because
it's also why the vault (and this handbook) can only ever reconstruct "latest
known state" by reading every script and taking the most recent-looking
version of each object — there's no single source of truth to just query.

## Two different things live under `MAINT/<Module>/`

1. **Object baselines**, organized by type: `Table/`, `StoredProcedure/`,
   `Function/`, `Index/`, `Type/`, `Schema/`, `Data/`, `DataReference/`,
   `Trigger/`, `View/`. Each file is meant to represent one database object.
2. **Ticket-numbered patch folders**, at the top level of `MAINT/`, outside
   any module folder: `00-PatchScript/`, `00-PatchScript-Global/`,
   `00-Excel Patching/`, `00-Excel Patching-Global/`, `01-Release/`. These are
   the actual "run this against prod" runbooks, cutting across modules.

These two views overlap in content but not in organization — a single change
normally touches both (a new/altered object file under a module's `Table/`
or `StoredProcedure/`, *and* a step script under `00-PatchScript/GIT#nnnn/`
that actually performs the `ALTER`/data-fix), tied together only by a shared
ticket number in the filename or the header comment.

## Object-file naming inside a module

- **Baseline**: `<schema>.<ObjectName>.sql`, e.g.
  `CEPP/Table/dbo.Dealers.sql`. Generated in the classic SSMS
  "Generate Change Script" shape: `DROP TABLE IF EXISTS [...]` immediately
  followed by the full `CREATE TABLE [...]`. This looks like a destructive
  script but isn't run as one against a live table with data — it's a
  point-in-time definition snapshot, most likely produced by a schema-compare
  tool at each release. Read it as "this is what the object looks like now,"
  not as an instruction to actually drop-and-recreate.
- **Incremental patch**: `<schema>.<ObjectName>_<Action>_<Ticket>.sql`, e.g.
  `CEPP/Table/dbo.Contacts_AlterColumn_GIT#1327.sql`. `<Action>` is free text
  (`AddColumn`, `DropColumn`, `AlterColumn`, `Add_Column`, `RemoveColumn`,
  `UpdateDescription`, `AddConstraint`, `Patching`, ...) — no enum, no
  enforced vocabulary, sometimes with and sometimes without underscores
  between words. **A table's real current shape is the baseline file plus
  every later-dated patch file for it, not the baseline alone** — this is
  exactly the vault's own stated methodology and the reason CEPP/TRANSACTION
  (highest patch-file counts by far) are flagged as least reliable.
- **True removals** are rare and have a distinct, unambiguous shape: a short
  file whose header says `Description: Drop table` and whose body is *only*
  `DROP TABLE IF EXISTS [Db].[dbo].[xxx_TableName]` (note the `xxx_` prefix —
  the convention is apparently rename-to-`xxx_`-prefix first, drop later).
  Only 5 such files exist in the entire estate, all in `CEPP/Table/`
  (`Packages`, `PackageProducts`, `StorePackages`, `StoreServices`,
  `DealerProductGroups` — see `vault-drift-notes.md`).

## Ticket ID formats — four spellings, one tracker

Filenames and header comments reference issue numbers in at least four
punctuation styles, used inconsistently by different authors/years, all
apparently pointing at the same GitLab issue tracker (`gitlab-reload-fetch`
territory) plus an older `RMSO-` prefix:

- `GIT#nnnn` (e.g. `GIT#1909`)
- `GIT-nnnn` (e.g. `GIT-197`)
- `GIT_nnnn` (e.g. `GIT_1687`)
- `RMSO-nnnn` (e.g. `RMSO-366`) — looks like an older/parallel ticket prefix,
  seen concentrated in `00-PatchScript-Global/` and in bulk historical data
  patches; also appears combined as `CR-RMSO-nnnn` for what read like formal
  change requests.

No normalization was ever applied retroactively — don't assume a script
without a recognizable ticket suffix has no ticket; check the header comment.

## The `00_/01_/NN_` step convention (ticket-numbered patch folders)

Every `00-PatchScript/<Ticket>/` and `00-PatchScript-Global/<Ticket>/` folder
that has more than one file follows the same shape, confirmed across many
tickets (`GIT#1358`, `GIT#1559`, `GIT-197`, `GIT_1687`, `GIT#1909`, ...):

1. **`00_...` (pre-check / preverify)** — a `SELECT` that captures the *before*
   state, often with a hand-written comment recording the exact row count/IDs
   found at the time (`-- total = 3 with ER.State = 'Not Applicable'`,
   `-- id = 3, 273, 274`). This is effectively a manual audit trail baked into
   the script itself, since there's no migrations table to record it.
2. **`01_...` through `NN-1_...` (the actual patch)** — one file per logical
   unit of change, named `<Table>_<Verb>` (`Update_EInvoiceRequests_State`,
   `StoreAccountStatements_Upd`, `AuditLogs_Ins`). Multiple files here run in
   numeric order when a ticket touches more than one table.
3. **`NN_Verify` (post-check)** — re-runs the `00_` query and expects an empty
   or corrected result, again with the expected count hand-annotated in a
   comment (`--Total = 0`).

`00-PatchScript-Global/` additionally numbers by **dependency order** rather
than just sequence — e.g. `RMSO-366/` seeds master data as
`01-Regions_Insert → 02-States_Insert → 03-ProductTypes_Insert →
04-ServiceProviders_Insert → 05-ProductGroups_Insert → 06-Products_Insert →
... → 15-Dealers_Insert → 17-DealerProductGroups_Insert →
18-LookupCodes_Insert`, mirroring the actual FK-by-convention chain
documented in `cepp.md`. A `_2` suffix on a step (`05-ProductGroups_Insert_2`)
means a follow-up batch for the same step, not a retry-replaces-original.

Some tickets are a single file with no pre/post-check at all
(`GIT#1217/01_UMobile_SFTP_Migration.sql`) — the 3-step shape is the norm for
data-correction patches specifically, not a hard rule for every change.

## Excel-tracked patches

`00-Excel Patching/` and `00-Excel Patching-Global/` hold `.xlsx` files
instead of `.sql` (e.g. `RMSO-705/SupplierProducts_Patching_Script.xlsx`,
`RMSO-705/Functions_Sequence_Patching_Script.xlsx`) — used for patches whose
"script" is really a large data-entry/verification checklist (bulk supplier
product mappings, sequence renumbering) too unwieldy to review as raw SQL
diffs. Not opened as part of this pass (binary spreadsheet content), but
their existence is itself the point: not every schema/data change in this
estate is a `.sql` file.

## Releases

`01-Release/` is thin and inconsistent — two `.zip` bundles named after
features (`CentralizedTransaction_20210923.zip`,
`JobId.2.MonthlySales.RazerGold.CSVToSFTP_20210923.zip`, both date-stamped
`YYYYMMDD`) sitting next to one loose `Rename_Table_GIT-870.sql`. This does
not look like a maintained release-packaging process (only two zips exist,
both from 2021) so much as a one-off archive of what a couple of specific
releases bundled at the time.

## Deployment mechanism

`reload_db/Console/Offline/` and `reload_db/Console/Reload/` each contain a
compiled `SQLConsole.exe` (with `NLog.config` for logging and
`Microsoft.Data.Tools.Sql.BatchParser.dll` / `Microsoft.SqlServer.ConnectionInfo.dll`
alongside it — i.e. it links SSDT's own batch-parsing/connection libraries,
consistent with it being a DACPAC/SSDT-style script runner) — one console app
per target environment (Offline = `RMS_OFFLINE`, Reload = the main estate).
Only the compiled binaries are checked into this workspace, not source, so
exactly how it walks the `MAINT/` tree and in what order wasn't verified here
— flagged as a genuine blocker if that logic ever needs to be relied on.

## Scheduled jobs are versioned the same way

`SQLAgentJob/` (see `00-overview.md`) isn't schema, but follows an analogous
convention: one file per job, named `[HHMM]<Frequency>.<JobName>_<Verb>.sql`
or `[DAILY.HHMM].<Category>.<Job>.sql`, containing the full
`msdb.dbo.sp_add_job` / `sp_add_jobstep` / `sp_add_jobschedule` script SSMS
generates when you script out a SQL Agent job. Same pattern as `Table/`
baselines: a full definition snapshot, not a diff, re-generated whenever the
job changes.

## Related

- [[architecture/reload_db/00-overview]] — where `MAINT/` sits in the overall estate
- [[architecture/reload_db/vault-drift-notes]] — the `xxx_`-prefix drop-table convention (§3 here) cross-checked against the vault
- [[conventions/sql-conventions]] — stored-procedure/index naming conventions inside each object file
- [[gitlab-analysis/reload_db-mr-review-checklist]] — how reviewers enforce the numbering/environment-suffix conventions described here
