---
name: reload-db-architecture
description: Condensed reference for the reload_db SQL Server estate (20 real business databases, one per domain, no shared "one database many schemas" design) — the module-to-database map, headline vault-drift gaps, patch-script/MAINT conventions, and cross-module relationships — reverse-engineered from live MAINT/ scripts, not just the older Obsidian vault. Use when tracing which database owns a table or how modules relate across databases, checking whether a schema/table actually exists before trusting the reload-db-schema skill's cached vault data, planning or reviewing a schema/patch change and needing the MAINT folder/naming convention, or before making any claim about the reload_db estate's structure.
---

# reload_db — database architecture (condensed)

Read `fiuu-reload-handbook` (master skill) first, especially correction #3
(the GitLab project is `server/offline/rds/reload`, not
`offline-teams/reload_db`) and correction #4 (the vault's gaps). Full
source: [`../../architecture/reload_db/`](../../architecture/reload_db/),
verified 2026-09-05.

## What this is

One SQL Server instance, **one database per business domain** — not
schemas-in-one-database. Traced from the existing Obsidian vault
(`Fiuu_Reload_DB_Vault_Code/`, `reload_schema.dbml`), then cross-checked
against every live patch script in `reload_db/MAINT/<MODULE>/`. There is no
migrations framework (no EF migrations, no Flyway/Liquibase, no version
table) — `MAINT/`'s filenames and folder layout **are** the versioning
system. See
[`patch-script-conventions.md`](../../architecture/reload_db/patch-script-conventions.md)
before touching a schema.

## The database estate (20 real, currently-patched databases)

| Database | Role | Tables | Vault gap? |
|---|---|---|---|
| `CEPP` | Master-data & back-office hub: org hierarchy (Company→Dealers→Stores→Terminals), users/roles, product catalog, commission/settlement. Most cross-referenced DB in the estate. | 84 | `PublicHolidays` table missing |
| `TRANSACTION` | Core staging + EOD/EOS reconciliation + one schema per external provider. Busiest, most-patched, least-completely-documented DB. | 144+ | **6 provider schemas missing** (see below) |
| `BILL_PAYMENT` | One schema per biller/partner (18) + shared `TRANS` order workflow. | 54 | None found |
| `REPORTSUMMARY` | Settlement/billing-report aggregation, downstream of `TRANSACTION`+providers. | 40 | None found |
| `RMS_OFFLINE` | Consumer-facing "Reload Offline" self-service app — separate user base from CEPP. | 41 | None found |
| `TNG` | Touch 'n Go transactional/reconciliation data (hardware+account provisioning lives in `CEPP` instead). | 22 | None found |
| `RESTORIFY` | Carbon-offset/subscription-billing product line (`dbo`, `STACS`, `TRANS`). | 22 | None found |
| `INCOMM` | InComm gift-card partner-API request/response envelope. | 14 | None found |
| `INCOMM_TRANS` | Terminal-facing activation/deactivation/reversal companion to `INCOMM`. | 10 | None found |
| **`EINVOICE`** | Malaysia e-Invoicing (MyInvois/LHDN) submissions + reporting procs. | 3 | **Missing from vault entirely** |
| **`SAP`** | SAP Business One posting staging. | 2 | **Missing from vault entirely** |
| `DataWarehouse` | Reporting star-schema fed from CEPP + sales facts. | 11 | None found |
| `NOTIFICATION` | Outbound messaging (channels/subscribers/delivery tracking). | 9 | None (but see gap below) |
| `INVENTORY_MASTER` | Authoritative stock-on-hand balances. | 3 | None found |
| `MLookUp` | Separate geography/telco lookup store (not the same physical table as `CEPP.dbo.LookupCodes`). | 5 | None found |
| `PREPAID` | Prepaid *registration* tracking (day-to-day sales live in `TRANSACTION`). | 4 | None found |
| `CONFIGURATION` | Shared runtime config key/value store. | 3 | None found |
| `TICKET` | Ticket2U integration + shared `TRANS` order workflow. | 3 | None found |
| `INVENTORY` | Stock staging (42:1 proc-to-table ratio — heavily procedure-driven). | 2 | None found |
| `LOGGING` | Single-table cross-app device/login audit trail. | 1 | None found |

Non-database `MAINT/` folders (not modules): `SQLAgentJob/` (scheduled job
definitions — the orchestration actually driving
`TRANSACTION → REPORTSUMMARY → DataWarehouse`) and `CICDTest/` (pipeline
smoke-test sandbox, not real schema).

## The big picture (data flow)

```
Terminals/APIs → TRANSACTION → {TNG, INCOMM_TRANS, BILL_PAYMENT, RESTORIFY, TICKET}
                       │                              │
                       └──────────────┬───────────────┘
                                       ▼
                                REPORTSUMMARY → DataWarehouse
TRANSACTION ‑‑ sales/commission feed ‑‑> SAP ‑‑ submits via (inferred) ‑‑> EINVOICE
RMS_OFFLINE ‑‑ own e-invoice requests ‑‑> EINVOICE
Nearly everything ‑‑ references ‑‑> CEPP (master data)
```

Full mermaid with every edge:
[`00-overview.md`](../../architecture/reload_db/00-overview.md). The
`SAP → EINVOICE` link is inferred from shared `U_EIV_*`-prefixed column
vocabulary, **not a proven join** — no cross-database query was found
confirming it either way.

**Only 6 real, database-enforced foreign keys exist in the entire estate**
(`INCOMM.InCommTransactions → ApplicationRequests` is one) — everything
else is "inferred by naming convention," per the vault's own methodology.
Treat any other relationship in this handbook or the vault as a strong hint,
not proof.

## Vault-drift headlines (full evidence: `vault-drift-notes.md`)

1. **`EINVOICE` and `SAP` are entirely absent from the vault**, including
   its 260KB `reload_schema.dbml` export — both are real, actively-patched
   databases (`EINVOICE` predates the vault by over a year).
2. **`CEPP.dbo.PublicHolidays`** (added 2026-03-05) is missing. Separately,
   5 filenames under `CEPP/Table/` (`Packages`, `PackageProducts`,
   `StorePackages`, `StoreServices`, `DealerProductGroups`) are drop scripts
   for already-removed tables — the vault correctly excludes them, but a
   naive file-count over-counts.
3. **`TRANSACTION` is missing 6 provider schemas**: `AnyPay`, `CelcomDigi`,
   `Giftee`, `MobilityOne`, `PrepayNation`, `RazerGold` — vault says 14
   schemas, live `MAINT/TRANSACTION/Schema/` has 19 (+`dbo`).
4. **`NOTIFICATION` has no `StoredProcedure/` folder in `MAINT/` at all**,
   even though the app code genuinely calls real, named stored procedures
   (`dbo.Messages_Ins` etc., confirmed via
   `class-library/Database/Notification/Context.cs`) — don't expect to
   `grep MAINT` for this module's proc bodies; they aren't there. `SAP` has
   the same gap for `SubmissionItems_*`.
5. `SQLAgentJob/` and `CICDTest/` aren't vault-covered (correctly, out of
   the vault's schema scope).

Time budget was spent proportional to patch volume/risk (CEPP,
TRANSACTION); the ~734 inferred-by-convention relationships and remaining
~15 smaller modules' exact column lists were spot-checked, not
independently re-derived — treat as "matched the vault where checked," not
a full re-audit.

## Patch-script conventions (full: `patch-script-conventions.md`)

- Each `MAINT/<Module>/` splits into **object baselines** by type
  (`Table/`, `StoredProcedure/`, `Function/`, `Index/`, `Type/`, `Schema/`,
  `Data/`, `DataReference/`, `Trigger/`, `View/`) and **ticket-numbered
  patch folders** at the top level (`00-PatchScript/`,
  `00-PatchScript-Global/`, `00-Excel Patching/`, `01-Release/`).
- Baseline naming: `<schema>.<ObjectName>.sql` (a `DROP IF EXISTS` +
  `CREATE` snapshot, not a destructive instruction). Incremental patch:
  `<schema>.<ObjectName>_<Action>_<Ticket>.sql`. **A table's real current
  shape is the baseline plus every later-dated patch file** — there's no
  single source of truth to just query.
- True removals are rare and distinct: rename to an `xxx_`-prefix first,
  drop later, in its own file.
- Ticket IDs appear in at least four spellings (`GIT#nnnn`, `GIT-nnnn`,
  `GIT_nnnn`, `RMSO-nnnn`) — never normalized; search by bare number too.
- Multi-step patches follow a `00_` (pre-check) → `01_..NN-1_` (patch) →
  `NN_Verify` (post-check) numbered-folder convention — a real, repeatable
  pattern even though it's informal.
- Deployment runs via a compiled `SQLConsole.exe` per environment
  (`reload_db/Console/Offline`, `.../Reload`); its internal walk-order logic
  isn't in this checkout (binary only).

## Per-module docs and ER diagrams

One doc per module in
[`../../architecture/reload_db/`](../../architecture/reload_db/) (e.g.
`cepp.md`, `transaction.md`, `bill-payment.md`, `einvoice.md`, `sap.md`,
`tng.md`, `incomm.md`, `incomm-trans.md`, `restorify.md`, `rms-offline.md`,
`reportsummary.md`, `datawarehouse.md`, `notification.md`, `prepaid.md`,
`ticket.md`, `inventory.md`, `inventory-master.md`, `mlookup.md`,
`configuration.md`, `logging.md`) plus one Mermaid ER diagram per module
under [`diagrams/`](../../architecture/reload_db/diagrams/), and
[`diagrams/cross-module-relationships.md`](../../architecture/reload_db/diagrams/cross-module-relationships.md)
for tables joined across module boundaries.

Notable per-module gotchas worth knowing up front:
- **Same table name, different physical table per database**: `LookupCodes`,
  `Regions`, `AutoNumbers`, and `Config`/`ConfigDetails` each exist as
  *separate* tables in `CEPP`/`MLookUp`/`RMS_OFFLINE`/`CONFIGURATION` —
  don't assume a `RegionId` column traces back to one canonical table;
  check which database the calling code actually targets.
- **Mirrored tables drift**: `SalesTransactions`/`SalesOrders` exist in both
  `TRANSACTION` and `REPORTSUMMARY`; `Stocks` exists in both `INVENTORY` and
  `INVENTORY_MASTER`. Nothing enforces the two copies stay in sync — see
  `reload-tribal-knowledge`'s issue #93 write-up for a real 7-month-latent
  bug this caused.
- **`_new_GIT1857`/`_new_GIT1858` sibling tables** across `TRANSACTION`,
  `REPORTSUMMARY`, `INVENTORY`, `INVENTORY_MASTER` are a live in-place
  int→bigint key-width migration — check which table a given stored
  procedure actually targets before assuming it's the newer one.

## Staleness

Verified against live `reload_db/MAINT/` 2026-09-05. This wasn't a full
table-by-table re-audit of all ~470 tables — treat module docs marked "none
found" as spot-checked, not exhaustively proven, and re-verify against the
live scripts before depending on anything CEPP/TRANSACTION-specific for a
high-stakes change (highest patch volume, least reliable historically).
