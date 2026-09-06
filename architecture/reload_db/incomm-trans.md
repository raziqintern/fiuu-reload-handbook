---
tags: [reload_db/architecture, module/incomm-trans]
---

# INCOMM_TRANS

**Database:** `INCOMM_TRANS` · **Schema:** `dbo` only · **Tables:** 10 ·
**Stored procedures:** 59

> Not in the handbook task's original per-module filename list (only
> `incomm.md` was named) but documented separately here since it's a
> distinct physical database with its own tables — folding it into
> `incomm.md` would misrepresent it as part of the same database.

Transaction-side companion to `INCOMM`: activation/deactivation transactions,
end-of-day/shift processing, reversal operations. Where `INCOMM` models the
partner-API request/response envelope (`ApplicationRequests`, `RTGRequests`),
this database models the terminal-facing side of an actual gift-card
activation happening in a store.

## Key tables

- **`ActivateTransactions → ActivationStandInTransactions`/
  `ReActivateTransactions`** — the core activation flow, plus a "stand-in"
  variant (`ActivationStandInTransactions`, carrying its own `RetailerId`
  and `AuthorizationId`) for when the primary activation path is unavailable
  — a resilience/fallback pattern, not just a duplicate.
- **`DeactivateTransactions`/`ReversalTransactions`/`ReversalOperation`** —
  the undo side. `ReversalOperation` is the request/tracking row
  (`MRequestStatusId`), `ReversalTransactions` the executed result — same
  request/execution split seen elsewhere in the estate (e.g. TNG's
  `FundAssignments`/`FundTransactions`).
- **`EndOfDays`/`EndOfDayDetails`, `EndOfShifts`/`EndOfShitftDetails`** —
  note the typo in `EndOfShitftDetails` (missing an "f") — reproduced
  faithfully here because it's the actual live table name, not a
  transcription error in this doc.

## Stored procedures

`<Table>_<Verb>[_By_X]`, same convention as `INCOMM`.

## Relationships to other modules

Tightly coupled to `INCOMM` (shared domain, same `ProductId`/`DealerId`/
`StoreId`/`TerminalId` shape, `IncommProductId` FK from `EndOfDayDetails`).
Receives from `TRANSACTION.dbo.ApiGiftCardTransactions`. References `CEPP`
for dealer/store/terminal/product identity throughout.

## Related

- [[architecture/reload_db/incomm]] — the tightly-coupled partner-API-side database
- [[architecture/reload_db/transaction]] — the `ApiGiftCardTransactions` staging table this database receives from
- [[architecture/reload/diagrams/giftcard-incomm-flow]] — the traced initiate/confirm sequence this database's activation flow backs
