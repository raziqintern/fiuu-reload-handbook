---
tags: [reload_db/architecture, module/datawarehouse]
---

# DataWarehouse

**Database:** `DataWarehouse` · **Schema:** `dbo` only · **Tables:** 11 ·
**Stored procedures:** 35

Reporting star-schema fed from `CEPP` master data and daily sales facts —
the analytics layer at the end of the flow (`TRANSACTION`/provider DBs →
`REPORTSUMMARY` → `DataWarehouse`).

## Star schema

- **`FACT_DAILYSALES`** — the fact table: `DealerId`, `ProductId`,
  `MerchantId`, `TransId`, `Productgroupid`, `ProductServiceId`, `StoreId`.
  **`TEMP_DAILYSALES`** is a near-identical shadow table (same columns minus
  `StoreId`) — almost certainly a staging/ETL landing table the merge
  procedures load into before upserting `FACT_DAILYSALES`, given the
  `DW_SYNC_DATA*` procedure names below.
- **`DIM_DEALERS`**, **`DIM_PRODUCTS`** (`IncommProductId`/`TerminalServiceId`
  — a product dimension unified across at least the InComm and core
  terminal-service catalogs), **`DIM_SERVICEPROVIDER`** (keyed by
  `DimIdTerminalservice`, FK-ish columns `TerminalServiceId`/
  `ServiceProviderId`), **`DIM_WEEKS`**/**`DIM_WEEKS_ACCUM`** (calendar
  dimension, plain vs. accumulated).
- **`pinless_storeid_20212021`**/**`reload_sto_reid2021`** — year-stamped,
  oddly-named one-off tables (note the doubled "2021" in the first name).
  These read as ad-hoc historical backfill/migration artifacts from 2021
  rather than part of the maintained schema — flagged rather than
  documented as if they were designed tables, since their purpose isn't
  otherwise inferable.
- **`UserPrivAudit`/`UserPrivAudit2`** — `UserPrivAudit2` has only generic
  `column1`/`column2`/`column3` `nvarchar` columns, i.e. it was never
  properly typed/named. Ties to the `[_MONTHLY].DBA.Report.GetUserPermission.sql`
  job in `SQLAgentJob/` — this looks like DBA-level SQL Server permission
  auditing (who has access to what), not business data, sitting in this
  database seemingly for lack of a better home.

## Stored procedures

A distinctly different naming convention from the CRUD-proc modules:
`DW_SYNC_DATA` (+ dated/environment variants `_2018_2019`, `_OFFLINE`,
`_REPORT_DB`, `_RETRY`) and `Dim_<Dimension>_Merge` (+ `_Prod`/`_PROD`/
`_Prod_Test` variants) — ETL/merge procedures, not `Ins`/`Sel`/`Upd`/`Del`
CRUD. The proliferation of `_Prod`/`_PROD`/`_Test` suffixed duplicates of the
same logical procedure (`Dim_Products_Merge`, `Dim_Products_Merge_Prod`,
`Dim_Products_Merge_Prod_Test`) suggests environment-specific copies were
made ad hoc rather than parameterized — worth checking which one a given SQL
Agent job actually calls before assuming the "clean" name is the live one.

## Relationships to other modules

Fed from `CEPP` (dealer/product master data via the merge procedures) and
`REPORTSUMMARY`/`TRANSACTION` (sales facts). Confirmed scheduled via
`SQLAgentJob/rmsp-dw/[0200]DAILY.SALES.SYNC.sql` and
`[30Mins]DAILY.STOCK.SYNC.sql` running on what looks like a dedicated
data-warehouse sync server (the `rmsp-dw` subfolder name).

## Related

- [[architecture/reload_db/reportsummary]] — the settlement/billing aggregation this star schema is fed from
- [[architecture/reload_db/cepp]] — the master-data source for the dimension tables
- [[architecture/reload_db/00-overview]] — where this database sits at the end of the transactional flow
