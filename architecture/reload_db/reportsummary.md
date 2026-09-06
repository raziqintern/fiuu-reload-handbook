---
tags: [reload_db/architecture, module/reportsummary]
---

# REPORTSUMMARY

**Database:** `REPORTSUMMARY` - **Schema:** `dbo` only - **Tables:** 40 -
**Stored procedures:** 83

Downstream settlement and billing-report aggregation. One
`*BillerReport`/`*SettlementReport` table per channel (TNG, MOLPay, Incomm,
Pinless/PIN Reload, and each bill-payment biller), fed from `TRANSACTION` and
the provider modules on a schedule (see `SQLAgentJob` in `00-overview.md` -
e.g. `[0130]Daily.SalesTransactionReport_Ins.sql` calls
`REPORTSUMMARY.dbo.SalesTransactionReport_Ins` daily at 13:00). This is
explicitly a reporting/aggregation layer, not a system of record - the
underlying transaction rows live in `TRANSACTION` and the provider databases;
`REPORTSUMMARY` reshapes them for billing and settlement output.

## Key tables

- **`SalesOrders`/`SalesTransactions`/`SalesTransactionReport`** - a
  near-duplicate of `TRANSACTION`'s own `SalesOrders`/`SalesTransactions`
  tables (same columns, same `_new_GIT1857` migration pair), plus
  `SalesTransactionReport` as the actual reporting projection
  (`SalesTransactionId` FK back to `SalesTransactions`, denormalized with
  `StateId`/`RegionId` for geographic rollups).
- **Per-channel settlement/biller pairs**: `TNGBillerReport`/
  `TNGSettlementReport`, `MOLPayBillerReport`/`MOLPaySettlementReport`,
  `IncommBillerReport`/`IncommSettlementReport`, `PinlessSettlementReport`,
  `PINReloadBillerReport`/`PINReloadSettlementReport`,
  `OfflinePaymentBillerReport`/`OfflinePaymentSettlementReport`,
  `BillPaymentBillerReport`/`BillPaymentSettlementReport`. "BillerReport" and
  "SettlementReport" are consistently two separate tables per channel - the
  former looks like the per-transaction detail feeding a biller-facing
  statement, the latter the aggregated dealer-facing settlement figure, but
  no report-consuming code was inspected to confirm the exact distinction.
- **Per-biller raw transaction copies**: `ASTROBillPayment`, `ATXBillPayment`,
  `IWKBillPayment`, `MBMBBillPayment`, `PayLinkBillPayment`,
  `TELEKOMBillPayment`, `TNBBillPayment` - mirrors of the corresponding
  `BILL_PAYMENT.<Biller>.BillPayment` tables, landed here for reporting
  rather than joined live cross-database.
- **`CardTransactions`/`CardTransactionBatches`** - a generic card-transaction
  shape (`TerminalId`/`LocationId`/`SpId` as `char` codes rather than CEPP FK
  ints) that also appears verbatim in `TNG.dbo` - looks like a shared
  card-network transaction format rather than something unique to either
  database.
- **`GoodReceivedNotes`** - the one stock/purchasing table that made it into
  this reporting database, presumably for GRN-based commission/settlement
  reporting.

## Stored procedures

Standard `<Table>_<Verb>` CRUD plus report-generation procs invoked by the
scheduled jobs in `SQLAgentJob/` - `SalesTransactionReport_Ins` is confirmed
directly via a live job script (`[0130]Daily.SalesTransactionReport_Ins.sql`,
run once for 7-Eleven dealers, `@DealerId=1`, and once for everyone else,
`@DealerId=0` - the same 7-Eleven-as-special-channel pattern seen in CEPP's
`SevenE*` commission tables shows up here too).

## Relationships to other modules

Downstream consumer of `TRANSACTION` and every provider module (`TNG`,
`BILL_PAYMENT`, `RESTORIFY`, `INCOMM`/`INCOMM_TRANS`) - reads their
transaction data, writes its own aggregated report tables, and feeds
`DataWarehouse` in turn. References `CEPP` for dealer/store/terminal/product
identity like everything else. Populated on a schedule by SQL Agent jobs,
not synchronously as part of the request path.

## Reconciliation against live scripts

Table list and column shapes checked against a sample of
`reload_db/MAINT/REPORTSUMMARY/Table/*.sql` matched what the vault and DBML
already had - nothing to add here beyond `00-overview.md`'s headline finding
that `REPORTSUMMARY` itself (unlike `TRANSACTION`/`CEPP`) wasn't where the
gaps turned out to be.

## Related

- [[architecture/reload_db/transaction]] — the upstream system of record this database aggregates from
- [[architecture/reload_db/datawarehouse]] — the star schema this database feeds in turn
- [[architecture/reload_db/bill-payment]] — one of the per-channel `*BillerReport`/`*SettlementReport` sources
- [[gitlab-analysis/reload_db-tribal-knowledge]] — the cross-database schema-drift incident (§1) on this database's `SalesTransactionReport` columns
