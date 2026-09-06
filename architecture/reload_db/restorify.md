---
tags: [reload_db/architecture, module/restorify]
---

# RESTORIFY

**Database:** `RESTORIFY` · **Schemas:** `dbo`, `STACS`, `TRANS` ·
**Tables:** 22 · **Stored procedures:** 88

Carbon-offset / sustainability-calculator product line: dealers subscribe to
a carbon-calculator plan, run purchase-weight/price-based calculations
against a project's carbon credits, and optionally check out through STACS
(a third-party carbon-registry/exchange integration). This is a notably
newer, differently-shaped product line than the reload/prepaid core of the
platform — its own project/batch/subscription model rather than the
dealer-terminal-product shape used everywhere else.

## `dbo` — projects, categories, subscriptions

- **`Projects → ProjectBatches → ProjectBatchBalances`** — a carbon-offset
  project is divided into batches, each batch tracking a remaining
  credit balance. `Projects.UUID` and `ProjectTypeId` suggest external
  registry identifiers and a typed classification (reforestation, renewable
  energy, etc. — not confirmed from the schema alone).
- **`CalculatorLevel1Categories → CalculatorLevel2Categories`**, with
  **`CalculatorSettingsPriceBased`** (keyed to Level1) and
  **`CalculatorSettingsWeightBased`** (keyed to Level2) — two different
  pricing models (by price paid vs. by item weight) applied at two different
  category granularities.
- **`CalculatorSubscriptionPlans → CalculatorDealerSubscriptionPlans →
  CalculatorDealerSubscriptionBalances`** — a dealer subscribes to a plan
  (`SubscriptionPlanTypeId`) and draws down a balance against it.
- **`DealerVATPackages`** — VAT handling per dealer, a compliance detail
  specific to this product line.
- **`ProjectTypePricingPackages`** — pricing tiers per project type.

## `STACS`

**`CarbonCheckout`** — the single table for the external checkout
integration: `ProjectUuid`, `RMSMerchantId`, `CarbonCertificateId`, and a
refund pair (`RefundRequestId`/`RefundUuid`). STACS (Sustainable Trade
Finance/carbon registry infrastructure — not independently confirmed beyond
what the schema implies) appears to be where the actual carbon-credit
certificate gets issued once a checkout completes.

## `TRANS` — transactions

`CalculatorTransactions` (the actual calculator sale, FK to both
`CalculatorDealerSubscriptionPlanId` and `CalculatorLevel2CategoryId`),
`CalculatorBulkTransactions` (bulk-upload variant, FK to
`BulkUploadFileId` — reusing `CEPP.dbo.BulkUploadFiles`'-style bulk upload
tracking), `CalculatorSubscriptionPayments` (paying for the subscription
itself, separate from buying offsets), `CarbonOffsetTransactions` (the
STACS-integrated purchase path, carrying `CarbonCertificateId` and a refund
reference directly on the transaction row), and `ProjectBatchTransactions`
(the ledger entry against a specific project batch's balance).

## Stored procedures

`<Schema>.<Table>_<Verb>[_By_X]`, same convention as everywhere else —
`STACS.CarbonCheckout_Ins/_Sel_By_OrderId/_Upd_RefundStatus_By_OrderId/
_Upd_Status_By_OrderId` is a clean example of the full lifecycle (create,
look up by partner order id, then two independent status-update paths for
the main flow vs. refunds).

## Relationships to other modules

Receives from `TRANSACTION.dbo` (`ApiCarbonCalculatorTransactions`/
`ApiCarbonOffsetTransactions`). `CEPP.dbo.MasterServiceProducts` carries a
`RestorifyProjectId` column pointing back into `RESTORIFY.dbo.Projects` —
the one place CEPP reaches into a provider database rather than the other
way around. Feeds `REPORTSUMMARY` per the top-level architecture diagram,
though no RESTORIFY-specific report table was found in `REPORTSUMMARY`
(unlike TNG/BillPayment/Incomm, which each have a named `*Report` table
there) — worth treating as an open question rather than assumed-absent,
since it wasn't exhaustively ruled out.

## Related

- [[architecture/reload/class-library/reloads-restorify]] — the `Fiuu.Reloads.Restorify` application code this database backs
- [[architecture/reload_db/cepp]] — the `MasterServiceProducts.RestorifyProjectId` cross-database link
- [[architecture/reload_db/transaction]] — the `ApiCarbonCalculatorTransactions`/`ApiCarbonOffsetTransactions` staging tables this database receives from
