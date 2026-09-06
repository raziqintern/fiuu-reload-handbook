# CEPP

**Source:** `reload/web/DEV/NET/Components/CEPP` (1,551 tracked files — by far the
largest shared component). **Prebuilt artifact:** `Fiuu.CEPP.dll` sits at the root of
the `class-library` submodule, but its source is here in `Components/CEPP`, not in
`class-library` itself — see [`../00-topology.md`](../00-topology.md) §4 for that
split. The acronym "CEPP" is not expanded or explained anywhere in the code that was
read; its meaning was not confirmed in this pass.

## What it's for

The core retail/POS transaction engine shared by essentially every terminal-facing
flow: terminal/store/dealer identity and lookup, wallet/store-account balance
management, commission and margin-rate calculation, API transaction persistence, and
per-partner payment sub-modules. Functionally this is the "domain layer" underneath
both the REST Terminal API and the legacy terminal socket server (see
[`../web-api.md`](../web-api.md), [`../terminal-application.md`](../terminal-application.md)).

## Structure

- `Configuration/`, `Exceptions/`, `Helpers/`, `Models/`, `Properties/`, `Providers/`,
  `Services/` — the core CEPP domain (terminal, store, dealer, commission,
  transaction, maintenance-window services/providers).
- `Payment/` — one sub-project per payment/partner channel, each its own `.csproj`:
  - `Payment/BillPayment` (`Fiuu.Reloads.BillPayment.csproj`)
  - `Payment/INCOMM` (`Fiuu.Reloads.GiftCard.csproj`) — the INCOMM gift-card
    integration; see [`../diagrams/giftcard-incomm-flow.md`](../diagrams/giftcard-incomm-flow.md).
  - `Payment/MOLPay` (`Fiuu.Reloads.FiuuCash.csproj`)
  - `Payment/OfflinePayment` (`Fiuu.Reloads.OfflinePayment.csproj`)
  - `Payment/Ticket` (`Fiuu.Reloads.Ticket.csproj`)

## Public surface (confirmed via `EngineContext.Current.Resolve<T>()` calls in
`MOLReloads/Core/Services/GiftCardService.cs` and `TNGService.cs`)

Interfaces resolved through the Autofac-based DI container
(`Fiuu.MasterFramework.Dependency` — see
[`masterframework.md`](masterframework.md)): `ITerminalService`, `IStoreService`,
`IDealerService`, `IReconciliationService`, `ITerminalContentService`,
`ITerminalContentProductService`, `IApiTransactionProvider`, `IStoreAccountService`,
`ICommissionRatesService`, `ICommissionRateService`, `IScheduledMaintenanceService`,
`IInCommOperationService`, `IInCommTransactionService`, `IInCommTerminalService`,
`IInCommService`, and (from `class-library/Reloads/TNG`)
`ITNGTerminalService`/`ITNGAccountsService`/`ITNGTerminalsService`/
`ITerminalOperationService`/`ITNGFundRequestsService`/`ITNGCardTransactionsService`/
`IBlacklistCardsService`. A `ServiceLocator` static class is also used in places as an
alternative to constructor/property DI (seen in `GiftCardService`).

`Fiuu.CEPP.Models.Interfaces` defines the domain model contracts (`ITerminal`,
`IStore`, `IDealer`, `IInCommProduct`, `ISalesCommissionMarginRates`,
`IStoreAccount`, `ITerminalContent`, `ITerminalContentProduct`, etc. — inferred from
usage in `GiftCardService.cs`/`TNGService.cs`, not from reading the interface
definitions directly).

## Known dependencies

- `class-library/Fiuu.Lookup.dll` — direct `HintPath` reference from
  `Fiuu.CEPP.csproj` (confirmed).
- `class-library/Secure/Incomm` (ISO8583 framework) — used by the INCOMM payment
  sub-project's lower-level stand-in processing
  (`class-library/Secure/Incomm/Services/ActivationStandInService.cs`), while the
  live preauth/activation path (`InCommOperationService` →
  `InCommSecureProvider`) instead does a plain HTTPS JSON POST — see
  [`../diagrams/giftcard-incomm-flow.md`](../diagrams/giftcard-incomm-flow.md). The
  exact circumstances under which the ISO8583/stand-in path is used instead of the
  HTTP path were **not confirmed** — flagged as follow-up.
- `Components/Logging`, `Components/MasterFramework` (implied by nearly every class
  using `Logger.WriteErrorToEventLogs(...)` and `EngineContext`).

## Consumers

- `Reloads/Terminal/Api` (direct `ProjectReference`) — see
  [`../web-api.md`](../web-api.md).
- `Reloads/TerminalServer/Console` `MessageHandlers/*` (direct `Imports` of
  `Fiuu.CEPP` namespaces, confirmed in `TNGProfileHandler.vb`) — see
  [`../terminal-application.md`](../terminal-application.md).
- `BackOffice/Web` (direct `ProjectReference` to `Fiuu.CEPP.csproj` and
  `Fiuu.Reloads.BillPayment.csproj`) — see [`../web-app.md`](../web-app.md).
- `MOLReloads/Core` (`Fiuu.Reloads` — `TNGService`, `GiftCardService`) builds its
  orchestration directly on top of CEPP's services/providers.
