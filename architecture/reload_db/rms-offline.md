---
tags: [reload_db/architecture, module/rms-offline]
---

# RMS_OFFLINE

**Database:** `RMS_OFFLINE` · **Schema:** `dbo` only · **Tables:** 41 ·
**Stored procedures:** 192

Powers the consumer-facing "Reload Offline" self-service web app: its own
`Users`, `Partners`, `Products`, reward campaigns, payment transactions,
CMS content (FAQ/Footer/HomePage/Maintenance-notice), and e-Invoice requests.
Architecturally the odd one out in the estate — a separate consumer identity
system, not an extension of `CEPP`'s back-office user base.

## Consumer identity & partners

- **`Users`** — `Id` is a `uniqueidentifier`, not an `int` identity like
  `CEPP.dbo.Users.Id` — a different identity scheme for a different user
  population (consumers, not back-office staff). `PartnerId`/`CountryId` FK
  out; `UserExternalLogins` (composite `LoginProvider`+`ProviderKey` PK)
  supports third-party/social login.
- **`Partners`** — external platforms this consumer app is embedded in or
  sold through (`MOLPayMerchantId` column ties a partner to a MOLPay
  merchant account). `PartnerProducts`/`PartnerServiceCharges`/
  `PartnerPurchase` scope the product catalog and fee structure per partner.

## Catalog & transactions

`Services → ServiceTypes`, `ProductGroups → Products` — a simpler, flatter
catalog than CEPP's multi-layer one, scoped by `CountryId` directly on
`Products`. `PaymentTransactions → TransactionDetails` is the core purchase
record (`MOLPayTransId`, `PaymentChannelId`), with `TransactionDetails`
carrying the actual product/service reference and linking to `Users.Id`.
`RetryTransactions` handles failed-payment retry by `ServiceTypeId`.

## Reward campaigns

A fully self-contained sub-domain: `RewardCampaigns → RewardCampaignsCap →
RewardCampaignsCapBalance` (spend caps and running balance),
`RewardCampaignsChannels`/`RewardCampaignsCategories` (classification),
`RewardCampaignsPlatform` (per-partner activation, FK to `PartnerId`), and
`RewardCampaignsProduct`/`RewardCampaignsTransaction` (which products
qualify, and the actual reward payout transaction). This looks like a
promotions/cashback engine layered on top of the base purchase flow.

## CMS & support content

`FAQCategory/FAQDetails`, `FooterCategory/FooterDetails`, `HomePageDetails`,
`MaintenanceNoticeDetails`, `MiscellaneousDetails`, `SupportCategory/
SupportDetails`, `EmailTemplate` — flat CMS content tables backing the
public-facing site, unrelated to the transactional core.

## e-Invoicing

**`EInvoiceRequests`** — this is a *different* table from anything in the
`EINVOICE` database: it's the consumer-app-side request to have an invoice
generated (`ReferenceId`), not the LHDN submission record itself. See
`einvoice.md`'s open question about whether this feeds `EINVOICE.TRANS.Submissions`
directly. A live patch (`00-PatchScript/GIT#1909/`) fixing invalid `State`
values on this exact table (`'Not Applicable'` → `'17'`) was inspected while
building `patch-script-conventions.md` — one of the few tables in this whole
survey with a directly-observed real-world data-quality patch.

## Stored procedures

`<Table>_<Verb>[_By_X]`, 192 procedures — proportionally the second-heaviest
module after `TRANSACTION`/`BILL_PAYMENT`, reflecting that this is a full
consumer web app's entire backend, not just an integration log.

## Relationships to other modules

Loosely coupled to `CEPP` (`Partners.MOLPayMerchantId`, `Products.CountryId`)
— the vault's own framing that RMS_OFFLINE "only loosely touches CEPP"
matched what was found here. Not otherwise linked into the
`TRANSACTION`→provider→`REPORTSUMMARY` flow that the rest of the estate
follows; this is a parallel, independent transactional path.

## Drift vs. vault

None found in the sample checked — table list and shapes matched.

## Related

- [[architecture/reload/class-library/database]] — the `Fiuu.Database`/Dapper layer that is this database's confirmed data-access component
- [[architecture/reload_db/einvoice]] — the open question of whether this database's `EInvoiceRequests` feeds `EINVOICE.TRANS.Submissions`
- [[architecture/reload_db/configuration]] — the separately-defined but near-identical `Config`/`ConfigDetails` pair duplicated here
- [[architecture/reload_db/patch-script-conventions]] — the `EInvoiceRequests` data-quality patch example cited above
