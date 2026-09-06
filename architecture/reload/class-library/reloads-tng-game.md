# Reloads/TNG and Reloads/Game (bonus doc — real class-library source modules,
not in the original module list)

**Source:** `reload/class-library/Reloads/TNG` (`Fiuu.Reloads.TNG.csproj`) and
`reload/class-library/Reloads/Game` (`Fiuu.Reloads.Game.csproj`). These are genuine
`class-library` submodule **source** modules (not prebuilt DLLs), consumed via
`ProjectReference` — unlike CEPP/Logging/Lookup/MasterFramework/Provider, whose
source lives outside `class-library` (see [`../00-topology.md`](../00-topology.md)
§4). Documented here because they're central to the one fully-traced sequence diagram
for TNG (see [`../diagrams/tng-reload-flow.md`](../diagrams/tng-reload-flow.md)).

## Reloads/TNG

- **Structure:** `Cryptography/` (`CryptographyBase.cs`, `LocalKeyStoreProvider.cs`),
  `Providers/` (`ReportsProvider.cs`, `TNGFundRequestsProvider.cs`,
  `WalletProvider.cs`), `Services/` (`CommissionRatesService.cs`,
  `TNGCardTransactionsService.cs`, `TNGFundRequestsService.cs`,
  `TNGTerminalOperationService.cs`, `WalletService.cs`, and — per the topology diff —
  additional services present only in this (newer) submodule checkout:
  `ISchedulerService`, `ISevenESettlementRptTNGService`/
  `SevenESettlementRptTNGService`, `StatementSchedulerService`), plus
  `Exceptions/MissingMerchantSecretKeyException.cs`, `Dependency.cs`/
  `DependencyRegistrar.cs`.
- **What it's for:** the TNG (Touch 'n Go e-wallet) integration's lower-level
  services — merchant key storage/crypto (`LocalKeyStoreProvider`,
  `MissingMerchantSecretKeyException` implies each merchant/dealer needs its own TNG
  secret key provisioned), fund requests, wallet operations, card transaction
  recording, and "Seven-E" settlement reporting (7-Eleven, referenced elsewhere in
  this codebase as `enumDefaultDealerId.Seven_Eleven` — 7-Eleven is evidently a
  major/flagship dealer for TNG reload).
- **Depends on:** `AWSCore` (confirmed `ProjectReference`, see
  [`awscore.md`](awscore.md)) — TNG merchant credentials likely flow through Secrets
  Manager, consistent with the "MissingMerchantSecretKeyException" naming, though the
  exact call site wasn't traced.
- **Consumed by:** `MOLReloads/Core/Services/TNGService.cs` (direct `Imports` /
  `EngineContext.Resolve<...>` for `ITNGTerminalService` etc.), and directly by
  `Reloads/TerminalServer/Console/MessageHandlers/TNGProfileHandler.vb` (confirmed
  `Imports Fiuu.Reloads.TNG.Services`) — see
  [`../terminal-application.md`](../terminal-application.md).

## Reloads/Game

- Confirmed to exist (`Fiuu.Reloads.Game.csproj`) and to be referenced via
  `ProjectReference` from the same consumers as TNG (`MOLReloads/Core`,
  `Reports/Scheduler`, `Reloads/Scheduler`, `Game/Scheduler` — see the `.sln`/
  `.csproj` grep results cited in [`reloads-pin.md`](reloads-pin.md)'s sibling
  research). Its internal structure was **not read** in this pass — flagged as a gap.
  Given the sibling `Applications/Game/Scheduler` app and `GameController` in the
  Terminal API, this is almost certainly the online-gaming-credit
  reload/top-up integration (a well-known reload product category — game credit
  top-ups), but that specific inference wasn't confirmed by reading `Game`'s own
  source.
