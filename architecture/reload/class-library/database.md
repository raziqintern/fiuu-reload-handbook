---
tags: [reload/architecture, module/database]
---

# Database (Fiuu.Database)

**Source:** `reload/class-library/Database` — a genuine `class-library` submodule
module.

## What it's for

The primary data-access layer for the `RMS_OFFLINE` SQL Server database, built on
Dapper. This is the newer of the two parallel data-access layers found in this
codebase — see [`provider.md`](provider.md) for the older `SqlAccessor`-based one
(`Fiuu.Provider`/`Fiuu.MasterFramework.Database`) that coexists with it.

## Structure

- `Base/BaseProvider.cs` — generic `BaseProvider<T>`: takes a connection string in its
  constructor, exposes `GetSingle`, `GetList`, `Update`, `Delete`, `Insert` — all via
  `Dapper.Query`/`Execute`/`ExecuteScalar` against a **stored procedure name** passed
  in as a string (`CommandType.StoredProcedure`), using a fresh `SqlConnection` per
  call.
- `Base/RMSOffineProvider.cs` (sic — "Offine" is a typo in the actual class name) —
  `RMSOffineProvider<T> : BaseProvider<T>`, hardcodes the connection string to
  `DBConnectionHelper.GetRMSOFFLINEConnectionString()`. Every concrete provider in
  `Providers/RMS_OFFLINE/` extends this.
- `Base/LoggingProvider.cs` — presumably the equivalent for the `LOGGING` database
  (not read in this pass, but `DBConnectionHelper.GetLOGGINGConnectionString()` exists
  alongside the RMS_OFFLINE one, so this is a reasonable inference).
- `Helpers/DBConnectionHelper.cs` — **the connection-string mechanism.** No
  `<connectionStrings>` config anywhere; instead, at runtime it looks for a plain text
  file named `{alias}.txt` (aliases seen in code: `RMS_Offline`, `LOGGING`,
  `Notification`) in `d:\db\` or `c:\db\` on the host machine, and reads the raw file
  contents as the connection string, caching it in a static field after first read.
  See [`../00-topology.md`](../00-topology.md) §7 — this is described here as a
  mechanism only; no actual connection string value exists in this repo to expose.
- `Providers/RMS_OFFLINE/*` — over 30 concrete providers, one per table/entity area:
  `AuditLogsProvider`, `ConfigProvider`/`ConfigDetailsProvider`, `CountryProvider`,
  `StateProvider`, `DevicesLoginTrailProvider`, `EInvoiceRequestProvider`,
  `FAQCategoryProvider`/`FAQDetailsProvider`, `FooterCategoryProvider`/
  `FooterDetailsProvider`, `HomePageDetailsProvider`, `MaintenanceNoticeDetailsProvider`,
  `MiscellaneousDetailsProvider`, `OneTimePasswordProvider`, `PartnersProvider`/
  `PartnerPurchaseProvider`/`PartnerServiceChargeProvider`, `PaymentOptionProvider`/
  `PaymentTransactionsProvider`, `ProductProvider`/`ProductGroupProvider`,
  `RetryTransactionsProvider`, `RewardCampaignsProvider` (+ `Cap`/`CapBalance`/
  `Platform`/`Product`/`Transaction` variants), `ServiceProvider`,
  `SupportCategoryProvider`/`SupportDetailProvider`, `TransactionDetailsProvider`,
  `UserExternalLoginsProvider`, `UsersProvider`.
- `Models/`, `Services/` — not enumerated in this pass.

## What this confirms about the `RMS_OFFLINE` database

The provider list above is a reasonable proxy for what `RMS_OFFLINE` actually stores:
users/auth, partners, products, payment transactions and options, reward campaigns,
config/content (FAQ, footer, homepage, maintenance notices), audit logs, device login
trails, and a queue of "retry transactions" (consistent with the retry-oriented
service classes seen in `Pinless/Core` — see
[`reloads-pin.md`](reloads-pin.md)). This is not a full schema — see the
`reload-db-schema` skill / `reload_db` repo for the authoritative schema.

## Consumers

A repo-wide grep for `Fiuu.Database.csproj` across every `.csproj`/`.vbproj` found
**exactly one** direct `ProjectReference`: `Notification/Api/Core/Fiuu.App.Notification.Core.csproj`
(see [`notification.md`](notification.md)). This is narrower than might be expected
given `RMS_OFFLINE` is described elsewhere (partner secrets, config, transactions) as
the central database — most other apps likely reach it through the prebuilt
`class-library` DLL rather than a source-level `ProjectReference` (which a
`.csproj`-text grep wouldn't catch), or through `Fiuu.Provider`/`SqlAccessor` instead
(see [`provider.md`](provider.md)) rather than `Fiuu.Database`/Dapper. Which apps use
which data-access layer for `RMS_OFFLINE` was **not** exhaustively mapped in this
pass — flagged as a real follow-up rather than assumed.

## Related

- [[architecture/reload_db/rms-offline]] — the `RMS_OFFLINE` database this Dapper layer reads/writes
- [[architecture/reload/class-library/notification]] — the confirmed sole direct `ProjectReference` consumer
- [[architecture/reload/class-library/provider]] — the older, parallel `SqlAccessor`-based data-access layer
- [[conventions/data-access]] — the three coexisting data-access patterns, including this one, documented in full
