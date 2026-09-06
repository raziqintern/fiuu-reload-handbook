---
tags: [reload_db/architecture]
aliases: ["Vault Drift Notes"]
---

# Vault vs. live MAINT scripts — drift notes

The existing Obsidian vault (`Fiuu_Reload_DB_Vault_Code/`) is a solid,
well-corroborated starting point — its own stated methodology (parse every
`CREATE`/`ALTER TABLE` in ~4,700 scripts, cross-check relationships against
real cross-database SQL in the app code) is sound and its caveats about its
own weak spots (CEPP/TRANSACTION incompleteness, inferred-vs-enforced FKs)
turned out to be accurate self-assessment. This file records everywhere a
targeted verification pass against the live `reload_db/MAINT/` scripts found
it to actually be wrong, incomplete, or stale — not a full table-by-table
re-audit of all ~470 tables (out of scope for the time available), but every
concrete discrepancy found while writing the per-module docs.

## 1. Two entire databases are missing from the vault (the big one)

The vault's title and every summary claim **16 databases**. Live `MAINT/` has
patch-script folders for `EINVOICE/` and `SAP/` in addition to the 16 the
vault covers — both are real, actively-patched SQL Server databases:

- `reload_db/MAINT/EINVOICE/Table/TRANS.Invoices.sql` opens with `USE [EINVOICE]`
  and `CREATE TABLE [EInvoice].[TRANS].[Invoices]`. Oldest table script found
  is dated 2024-08-15 (`GIT#1174`, "[CR] eInvoicing API") — this database
  predates the vault's construction by well over a year, it isn't something
  that appeared after the vault was built.
- `reload_db/MAINT/SAP/Table/TRANS.Submissions.sql` opens with `USE [SAP]` and
  `CREATE TABLE [SAP].[TRANS].[Submissions]`, dated 2025-02-03 (`GIT#2103`).
- `reload_schema.dbml` (the vault's own 260KB DBML export) has **zero**
  occurrences of `EINVOICE` or `SAP.` anywhere in the file — confirmed by
  direct grep, not just absence from the summary docs.
- Combined, this is 5 tables (`EINVOICE.TRANS.Invoices/InvoiceItems/Submissions`,
  `SAP.TRANS.Submissions/SubmissionItems`) and their stored procedures
  (11 in EINVOICE, 4+ in SAP) with no vault coverage at all. See
  `einvoice.md` and `sap.md` for what's actually in them.

This isn't explained by "these are brand new, built after the vault" — the
EINVOICE database is over a year old. It looks like a genuine gap in the
vault's original sweep (plausibly: the vault's script listing didn't include
these two folders, or they were filtered out along with the DMS/temp-table
noise it says it excluded).

## 2. CEPP: one real table missing, and one description slightly stale

- **`CEPP.dbo.PublicHolidays` is missing.** Created 2026-03-05
  (`reload_db/MAINT/CEPP/Table/dbo.PublicHolidays.sql`, ticket `GIT#2103` —
  same ticket as the SAP tables above, work landing in CEPP much later than
  the SAP side of the same ticket per the header dates, for whatever that's
  worth) — `HolidayDate` (PK) / `HolidayDescription` / `CreatedDateTime`.
  No `Tables/CEPP.dbo.PublicHolidays.md` note exists in the vault, and the
  vault's own `CEPP` table count (83) matches exactly the note-file count in
  `Tables/` — i.e. this table was never picked up, not just under-described.
  Seeded via `CEPP/Data/GIT_2103/PublicHolidays_Insert_Year_2026_And_2027.sql`.
- **The vault's stated CEPP table count (83) is otherwise accurate** once you
  account for a wrinkle in the source material: `CEPP/Table/` contains 5 files
  that look like current tables by filename (`Packages`, `PackageProducts`,
  `StorePackages`, `StoreServices`, `DealerProductGroups`) but are actually
  **drop scripts** — each file's entire body is `DROP TABLE IF EXISTS
  [CEPP].[dbo].[xxx_<Name>]`, dated 2025-02-24 (four of them) and 2025-10-08
  (`DealerProductGroups`). The vault correctly excludes all 5 — flagged here
  only because a naive "count files in `Table/`" pass over-counts CEPP by
  these 5, and because `DealerProductGroups` in particular is easy to mistake
  for a live table (it's referenced by name in the `RMSO-366`
  master-data-seeding patch folder, `00-PatchScript-Global/RMSO-366/
  17-DealerProductGroups_Insert.sql`, from when it still existed).

## 3. TRANSACTION: at least 6 provider integration schemas missing

The vault states `TRANSACTION` has **14 schemas** (`dbo` + 13 named:
ATX, Celcom, DTOne, EPay, IIMMPACT, JomPay, LoadCentral, NPN, Panda, PayLink,
Richtech, UMobile, YTL). `reload_db/MAINT/TRANSACTION/Schema/` has **19**
schema-creation scripts (+ `dbo` = 20 total). The 6 missing from the vault,
each confirmed to have both a `Schema/<Name>.sql` and at least one real table
under `Table/<Name>.*.sql`:

| Schema | Table found | What it looks like |
|---|---|---|
| `AnyPay` | `Transactions` | Another pinless/reload provider, same shape as `Panda`/`LoadCentral` |
| `CelcomDigi` | `RequestTopUp` | Post-merger combined Celcom+Digi telco integration (Malaysia's Celcom and Digi telcos merged in 2022) — likely superseding or running alongside the standalone `Celcom` schema |
| `Giftee` | `Transactions` | A gift-card/e-voucher provider integration |
| `MobilityOne` | `Transactions` | Also has its own `BILL_PAYMENT.MobilityOne` schema (that one *is* in the vault) — this is the `TRANSACTION`-side counterpart, missing |
| `PrepayNation` | `Transactions` | International prepaid/airtime aggregator |
| `RazerGold` | `Transactions` | Razer's own gift-card/prepaid brand — notable since Fiuu is the former Razer Merchant Services; this looks like a direct-to-parent-brand integration |

This lines up with the vault's own caveat that CEPP/TRANSACTION are "almost
certainly incomplete" — it called that about baseline-table completeness, but
it turns out to extend to entire schemas. A provider integration typically
means the same table pattern (`AccountVerification`/`Transactions`/`RequestTopUp`)
gets stamped out per provider elsewhere in `BILL_PAYMENT` and `TRANSACTION`
both — check `bill-payment.md`'s schema list too before assuming a provider is
fully covered by either module doc.

A naive file-count pass (dedupe baseline vs. patch filenames in
`TRANSACTION/Table/`) suggests noticeably more distinct table names than the
vault's 144, but most of the extra names resolve to `_Temp` / `_Del_Log`
staging copies the vault's own methodology says it deliberately excludes (AWS
DMS replication scaffolding) — consistent with the vault, not a second drift
finding. The 6 missing schemas above are the real, verified gap.

## 4. NOTIFICATION: the vault is right, but for a subtler reason than it says

The vault's module note says NOTIFICATION is "Driven by stored procedures
(`Messages_Ins`, `Subscribers_Sel`, `Channels_Sel`)." True — but
**`reload_db/MAINT/NOTIFICATION/` has no `StoredProcedure/` folder at all**,
only `Data/`. The procedure names the vault cites are real (confirmed via
`class-library/Database/Notification/Context.cs`, which calls
`dbo.Messages_Ins`, `dbo.Subscribers_Sel`, `dbo.Channels_Sel`, and 7 others
via Dapper with `CommandType.StoredProcedure`) — so the app code genuinely
calls stored procedures by those names. What's missing is any `CREATE
PROCEDURE` script for them anywhere under `MAINT/`. Either they were created
directly against the database outside this script tree, or they live in a
location this pass didn't find. Worth knowing before assuming "grep MAINT for
the proc" will work for this one module — it won't; see `notification.md`.

## 5. Two non-schema folders the vault doesn't mention at all

`SQLAgentJob/` (scheduled batch job definitions) and `CICDTest/` (a
pipeline-validation sandbox database, not real schema) exist under `MAINT/`
with no vault coverage — reasonably, since the vault scoped itself to
"database schema" and these are respectively orchestration and test noise.
Flagged here only so a future pass doesn't mistake their absence for a gap.
See `00-overview.md`'s "Non-database MAINT folders" section.

## What wasn't re-verified

Time was spent proportional to modules with the most patch volume and the
vault's own stated risk flags (CEPP, TRANSACTION). The 6 real enforced SQL
foreign keys, the ~734 inferred-by-convention relationships, and the exact
column lists for the remaining ~15 smaller modules were **not**
independently re-derived from scratch — they were spot-checked against a
sample of `Table/*.sql` baselines per module while writing each module doc,
and matched what the vault/DBML claimed in every sample taken. Treat the
vault's relationship data for those modules with the same "strong hint, not
proof" confidence the `reload-db-schema` skill already recommends.

## Related

- [[architecture/reload_db/00-overview]] — the corrected estate summary (20 databases, not 16)
- [[architecture/reload_db/cepp]] — the missing `PublicHolidays` table (§2)
- [[architecture/reload_db/einvoice]] and [[architecture/reload_db/sap]] — the two databases missing from the vault entirely (§1)
- [[architecture/reload_db/notification]] — the "no `StoredProcedure/` folder" finding (§4)
