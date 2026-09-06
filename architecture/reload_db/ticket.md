---
tags: [reload_db/architecture, module/ticket]
---

# TICKET

**Database:** `TICKET` · **Schemas:** `Ticket2U`, `TRANS` · **Tables:** 3 ·
**Stored procedures:** 24

Ticketing/voucher payment integration (Ticket2U — a Malaysian e-ticketing
platform) plus the same shared `TRANS` payment-order shape used in
`BILL_PAYMENT`.

## Key tables

- **`Ticket2U.Transactions`** — the partner-integration transaction log
  (`PartnerUserId`, `PaymentId`).
- **`TRANS.PaymentOrders → TRANS.PaymentTransactions`** — identical shape
  (same column names, same `MSourceTypeId`/`BPMTransStatusId`/
  `CommissionTypeId`) to `BILL_PAYMENT.TRANS.PaymentOrders`/
  `PaymentTransactions` — this is the smallest, clearest example in the
  estate of the "generic payment order" table shape being reused as a
  *pattern*, independently defined per database, rather than a single
  shared physical table.

## Relationships to other modules

Receives from `TRANSACTION.dbo.ApiTicketTransactions`. References `CEPP`
for dealer/store/terminal/`TerminalServiceProduct` identity.

## Drift vs. vault

None found — table list and shapes matched the vault exactly (smallest
module surveyed, easiest to fully verify).

## Related

- [[architecture/reload_db/bill-payment]] — the other module independently reusing the same `TRANS.PaymentOrders`/`PaymentTransactions` shape
- [[architecture/reload_db/transaction]] — the `ApiTicketTransactions` staging table this database receives from
