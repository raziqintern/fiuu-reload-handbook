# BILL_PAYMENT

**Database:** `BILL_PAYMENT` · **Schemas:** 19 (`TRANS` + 18 biller/partner
schemas) · **Tables:** 54 · **Stored procedures:** 210

Bill-payment aggregator: one small integration schema per biller/partner —
`ASTRO`, `ATX`, `AnyPay`, `Digi`, `EPay`, `IIMMPACT`, `IWK`, `MBMB`,
`MobilityOne`, `Panda`, `PayLink`, `RazerPay`, `REDONE`, `Syabas`, `TELEKOM`,
`TNB`, `UMOBILE`, `YTL` — plus a shared `TRANS` schema for the
provider-agnostic payment-order/EOD/void workflow. Schema list checked
against `reload_db/MAINT/BILL_PAYMENT/Schema/` and matches the vault exactly
(19 schemas, no drift found here — contrast with `TRANSACTION`, which has the
same per-provider-schema pattern but is missing several).

## Per-biller schemas

Each biller schema is small and follows one of two shapes:

- **`AccountVerification` + `BillPayment`** (most billers: `ASTRO`, `ATX`,
  `Digi`, `IIMMPACT`, `IWK`, `MBMB`, `MobilityOne`, `PayLink`, `Syabas`,
  `UMOBILE`/`AnyPay`) — a pre-payment account/bill lookup, then the actual
  payment record.
- **`BillPayment` only** (`EPay`, `Panda`, `REDONE`) — no separate
  verification step modeled, or verification happens elsewhere.

`ASTRO` and `TNB`/`TELEKOM` additionally have `BillPaymentRetries`/
`BillPaymentReturnCode` tables — retry tracking and biller-specific return
code lookups aren't universal across billers, only added where the partner's
API apparently needed it. `RazerPay` stands out with a `Configurations` table
of its own (`MStatusId`-gated) — the only biller schema with what looks like
partner-specific runtime config stored alongside the transaction tables
rather than in the shared `CONFIGURATION` database.

## `TRANS` — the shared payment-order workflow

`PaymentOrders → PaymentTransactions` is the biller-agnostic order/transaction
pair (mirrors the same pattern seen in `TRANSACTION.dbo.SalesOrders/
SalesTransactions`), with a full void sub-flow:
`PaymentVoidRequests → PaymentVoidRejectionRequests` /
`PaymentVoidRepostRequests → PaymentVoidRepostTransactions`, and
`PaymentVoidTransactions` as the terminal void record. EOD/EOS
(`PaymentEndOfDays`/`PaymentEndOfDayDetails`,
`PaymentEndOfShifts`/`PaymentEndOfShiftDetails`) follows the same
Details-child-of-Day/Shift-parent shape used everywhere else in the estate.
`PaymentOrders`/`PaymentTransactions` both have `_new_GIT1858` wide-key
migration siblings, same as `TRANSACTION`.

Note: `TICKET` also has its own `TRANS.PaymentOrders`/`TRANS.PaymentTransactions`
pair with identical columns — this `TRANS` shape is a cross-module convention
for "generic payment order," reused independently per database rather than
shared from one physical table.

## Stored procedures

Standard `<Table>_<Verb>[_By_X]` CRUD, ~210 across 19 schemas — thin per
biller (most billers have well under 10 procedures each), with the bulk
concentrated in the shared `TRANS` schema.

## Relationships to other modules

Receives from `TRANSACTION` (`ApiBillPaymentTransactions` is the staging row;
`BILL_PAYMENT.TRANS.PaymentTransactions` is what actually got sent to the
biller). Feeds `REPORTSUMMARY` (`BillPaymentBillerReport`/
`BillPaymentSettlementReport`, plus the per-biller report mirrors like
`REPORTSUMMARY.dbo.ASTROBillPayment`). References `CEPP` for
dealer/store/terminal/`TerminalServiceProduct` identity throughout.
