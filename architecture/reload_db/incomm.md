# INCOMM

**Database:** `INCOMM` · **Schema:** `dbo` only · **Tables:** 14 ·
**Stored procedures:** 78

InComm gift-card / stored-value program integration: application requests,
transaction and transfer-value processing, retailer exception handling.
InComm is a US-based prepaid/gift-card processor; this database models the
Fiuu-side of a fairly formal partner API (the `ApplicationRequests` /
`MRequestStageId` / `MRequestStatusId` staged-workflow shape reads like it
mirrors InComm's own API request lifecycle rather than being an internal
design choice).

## Key tables

- **`ApplicationRequests`** — the central staged request record
  (`MActionTypeId`, `ApplicationId`, `MRequestStageId`, `MRequestStatusId`).
  `InCommTransactions` FKs to it via `ApplicationRequestId` — **this is one
  of only 6 real, database-enforced foreign keys in the entire estate**
  (per the vault's methodology notes), everything else being inferred by
  naming convention. Worth remembering if you ever need a relationship you
  can actually trust without checking the proc.
- **`RTGRequests → RTGTransactions`/`RTGCancellations`** — a second,
  parallel request/transaction pattern ("RTG" — not expanded in the scripts
  found; likely "Real-Time Gift" given the gift-card domain, not confirmed).
  Same staged-workflow shape as `ApplicationRequests`
  (`MPointOfServiceId`, `MActionTypeId`, `MRequestStageId`).
- **`TransferValueRequests`/`TransferValueInCommTransactions`/
  `TransferValueHistoryInquiries`/`TransferValueTransactionInquiries`** — a
  "transfer value" flow, distinct from the main activation transaction flow,
  with its own request/inquiry/history sub-tables. `TransferValueInCommTransactions`
  carries `OriginStoreId`/`SpilId` — cross-store transfer tracking.
- **`RetailerExceptionFiles → RetailerExceptionDetails`** — exception/error
  file processing from the retailer (Fiuu) side, batch-oriented
  (`RetailerExceptionFileId` parent, `MActionTypeId` per detail row).
- **`ApiSettings`/`HealthMonitor`** — integration-level config and a health-
  check table, both `MStatusId`-gated.
- **`LookupCodes`** — another module keeping its own local enum table rather
  than only reading `CEPP.dbo.LookupCodes`.

## Stored procedures

`<Table>_<Verb>[_By_X]`, notable for extensive **`_V1`-suffixed duplicate
procedures** (`ApplicationRequests_Ins`/`ApplicationRequests_Ins_V1`,
and the same `_V1` pairing across `Sel_ActivationStandIn`,
`Sel_FastPinRevComparison`, `Sel_FastPinTOR`, `Sel_GiftCardRevComparison`,
`Sel_GiftCardTOR`, `Sel_IsFastPinReversalExist`) — a versioning pattern not
seen this consistently in any other module sampled. Whether `_V1` is the
newer or older version, and whether callers still use the un-suffixed
originals, wasn't determined from the script folder alone — check the
calling C# code (`Fiuu.CEPP` / gift-card provider classes) before assuming
either version is dead.

## Relationships to other modules

Feeds/receives from `INCOMM_TRANS` (the activation/deactivation transaction
side — see `incomm-trans.md`) and `TRANSACTION.dbo.ApiGiftCardTransactions`.
Feeds `REPORTSUMMARY.dbo.IncommBillerReport`/`IncommSettlementReport`.
References `CEPP` for product/dealer identity.
