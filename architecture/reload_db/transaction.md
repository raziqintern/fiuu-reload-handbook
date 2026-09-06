# TRANSACTION

**Database:** `TRANSACTION` · **Schemas:** `dbo` + at least 19 provider
schemas (vault says 14 — see `vault-drift-notes.md` §3) · **Tables:** 144 per
vault, undercounted · **Stored procedures:** 822 (by far the most of any
module)

The core transaction-processing and staging database. Every terminal or API
reload/payment request is logged here first, then routed to a provider-
specific database (`TNG`, `INCOMM_TRANS`, `BILL_PAYMENT`, `RESTORIFY`,
`TICKET`) for the actual external call. End-of-day/end-of-shift
reconciliation, void/return handling, and stock movement are also owned here.
This is the busiest, most patched, and (per the vault's own admission and
this pass's schema-count check) least completely documented database in the
estate — treat anything here as a strong lead, verify before depending on it.

## `dbo` — the staging/orchestration core

The `Api*` tables are the front door: one per product line, all following
the same shape (`Id`, `TerminalId`/`StoreId`/`DealerId`, `ReferenceId`,
`CashierId`/`UserId`, an `MStatusId`-family status, `MSourceTypeId` for
channel). `ApiBillPaymentTransactions`, `ApiGiftCardTransactions`,
`ApiOfflineTransactions`, `ApiPinlessTransactions`, `ApiStockOrders`/
`ApiStockTransactions`, `ApiTicketTransactions`, `ApiTNGCardTransaction`,
`ApiTNGFundRequest`, `ApiMOLPayTransactions`, `ApiCarbonCalculatorTransactions`/
`ApiCarbonOffsetTransactions` (RESTORIFY-side). Several of these have a
`_new_GIT1857`/`_new_GIT1858`-suffixed sibling table with a `bigint` identity
instead of `int` — a live in-place migration to a wider key, both old and new
table kept during the transition (check which one a given stored procedure
actually targets before assuming it's the newer one).

Order/transaction pairs recur throughout: `SalesOrders → SalesTransactions`,
`MOLPayOrders → MOLPayTransactions`, `OfflineSalesOrders →
OfflineSalesOrderItems`, `RestockOrders → ReStockTransactions`/
`ReStockOrderItems`, `PurchaseOrders → PurchaseOrderItems`,
`AllocationOrders → AllocationOrderItems`, `VoidOrders → VoidTransactions`,
`ReturnRequests/ReturnOrders → ReturnRequestItems/ReturnTransactions`. The
"order" row is the commercial envelope; the "transaction"/"item" rows are its
line items — same pattern as `SalesOrders`/`SalesTransactions` repeated for
every stock/return/void flow.

EOD/EOS reconciliation is its own dense cluster, one triplet per channel
(`EndOfDays`/`EndOfDayDetails`, `EodBillPaymentTransactions`/
`EodBillPaymentSummary`/`EodBillPaymentTransactionReconciliation`,
equivalents for GiftCard, Stock, MOLPay) — each `Eod*Transactions` table
carries both a `t_*` (terminal-reported) and `s_*` (system-recorded) copy of
`ApiTransactionId`/`ReferenceId`/`CashierId`, and the `MVarianceTypeId`
column on the `*Reconciliation` tables is where a terminal-vs-system mismatch
gets classified. `TopupInfo`/`TopupPayments`, `StoreAccountStatements`/
`StoreAccountTransactions` handle store-level bank top-up flows separate from
customer-facing reloads.

## Provider schemas

One schema per external service, each holding that provider's raw
request/response transaction log — `ATX`, `Celcom`, `DTOne`, `EPay`,
`IIMMPACT`, `JomPay`, `LoadCentral`, `NPN`, `Panda`, `PayLink`, `Richtech`,
`UMobile`, `YTL`, plus **`AnyPay`, `CelcomDigi`, `Giftee`, `MobilityOne`,
`PrepayNation`, `RazerGold`** (all six missing from the vault — see
`vault-drift-notes.md` §3). Table shape per schema is consistently
`Transactions` (or `RequestTopUp`/`BillPayment`/`PinlessTransactions`
depending on the provider's own vocabulary) plus, for a few providers,
`AccountVerification` as a separate pre-transaction check. `IIMMPACT` and
`PayLink` both explicitly FK `AccountVerification → Transactions` via
`TransactionId`.

`RazerGold` is worth calling out specifically: Fiuu was formerly Razer
Merchant Services, and this schema is a direct-to-(former)-parent-brand
prepaid/gift-card integration — architecturally it's just another provider
schema, but it's a reminder that "provider" here includes Fiuu's own
corporate family, not only arm's-length third parties.

## Sales, stock, void/return

`SalesDiscrepancies`/`SalesDiscrepanciesDetails` and `SaleSummaries` support
dealer-level sales reconciliation reporting. The stock/purchasing cluster
(`PurchaseOrders`, `GoodReceivedNotes`, `AllocationOrders`, `RestockOrders`,
`DailyStockBalance`) models the physical/virtual stock supply chain from
supplier → dealer group → store, feeding `INVENTORY`/`INVENTORY_MASTER`'s
`Stocks` tables. `StockVoucherRedemptions`/`ApiStockVoucherRedemptions` is a
separate voucher-redemption flow alongside standard stock sales.

## Stored procedures

Same `<Table>_<Verb>[_By_X]` convention as CEPP, at roughly 5-6x the volume
(822 vs CEPP's 538) — expected, given this database sits at the intersection
of every product line. No further pattern beyond that was surveyed in depth
given the volume; if hunting for a specific flow's procs, filter by the
`Api*`/provider-schema table name first.

## Relationships to other modules

`TRANSACTION` is the hub-and-spoke center of the *transactional* (as opposed
to master-data) side of the platform: it receives from terminals/APIs, reads
`CEPP` for dealer/store/terminal/product identity (the single largest
inferred-relationship flow in the whole estate per the vault), reads
`MLookUp`/`CEPP.dbo.LookupCodes` for status enums, and pushes settlement rows
downstream into `REPORTSUMMARY`. It also hands off to every provider database
(`TNG`, `INCOMM_TRANS`, `BILL_PAYMENT`, `RESTORIFY`, `TICKET`) — the `Api*`
staging tables here are the request as the platform received it; the
provider database holds what actually got sent externally.

## Drift vs. vault

See `vault-drift-notes.md` §3 — 6 provider schemas (`AnyPay`, `CelcomDigi`,
`Giftee`, `MobilityOne`, `PrepayNation`, `RazerGold`) exist live and are
missing from the vault. A naive file-count also suggests more distinct table
names than the vault's 144, but most of that gap is `_Temp`/`_Del_Log`
staging copies the vault deliberately (and correctly) excludes.
