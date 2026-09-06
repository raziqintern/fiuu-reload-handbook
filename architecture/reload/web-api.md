# `web_api` → `Reloads/Terminal/Api` (+ `BackOffice/Api`)

See [`00-topology.md`](00-topology.md) — there is no folder literally named `web_api`.
This name is mapped onto the two REST APIs found in the repo. They are documented
together here since the brief asked for one `web-api.md`; they are separate deployables.

## Primary: `Reloads/Terminal/Api`

- **Path:** `reload/web/DEV/NET/Applications/Reloads/Terminal/Api`
- **Project:** `Fiuu.App.Reloads.Terminal.Api.csproj` / `.sln`
- **Type:** ASP.NET Web API (System.Web.Http), C#, .NET Framework
- **Purpose:** the production REST API that terminals (physical POS hardware via a
  gateway, software terminals, and third-party PGW integrators) call to perform reload
  transactions. This is the modern counterpart to the legacy TCP socket protocol served
  by `Reloads/TerminalServer/Console` (see
  [`terminal-application.md`](terminal-application.md)).

### Entry points / public surface

Controllers under `Controllers/` (all inherit `RMSAuthController` → `BaseController`
unless noted), each mapped to `[Route(...)]` attributes:

- `TNGController` — `tngreload/tngProfile`, `hostauthentication`, `onlinecardvalidation`,
  `blacklistedcard`, `fundrequest`, `cardtransaction` (Touch 'n Go e-wallet reload).
- `GiftCardController` — `giftcard/initiate`, `giftcard/confirm` (INCOMM gift cards).
- `TicketController`, `StockController`, `BillController`, `PinlessController`,
  `MOLPayController`, `OfflineController`, `MobileAppController`, `GameController`,
  `CarbonCalculatorController`, `CarbonOffsetController`, `ProfileController`,
  `ReconciliationController`, `CacheController`, `VersionController`, `DemoController`,
  `TestController` — one controller per business capability; not individually traced in
  this pass.
- `Controllers/Pgw/Pgw_*Controller` — a parallel set of controllers (`Pgw_BaseController`,
  `Pgw_BillController`, `Pgw_GiftCardController`, `Pgw_MOLPayController`,
  `Pgw_OfflineController`, `Pgw_PinlessController`, `Pgw_StockController`,
  `Pgw_TNGController`) — appears to be a variant surface for a specific
  "PGW" (payment gateway) integration channel, distinct from the main controllers above.
  Not traced further; flagged as needs-follow-up to confirm the exact difference from
  the non-`Pgw_` equivalents.
- `RMSAuthController` (`Controllers/RMSAuthController.cs`) — not a route itself; the
  shared base class providing `AccessId` and `DealerType` from the authenticated
  `ClaimsPrincipal`.

### Authentication

Custom scheme, not ASP.NET Identity / OAuth. Verified in
`Infrastructure/Security/AuthenticationAttribute.cs`:
- Every `RMSAuthController`-derived controller is decorated `[Authentication]`
  (an `IAuthenticationFilter`).
- Expects a standard `Authorization` HTTP header whose scheme name is looked up via a
  pluggable `AuthenticationSchemeFactory`, and whose parameter is
  `base64(accessId):base64(signature)`.
- The resolved scheme's `AuthenticateRequest(...)` validates the `accessId`+`signature`
  pair and produces an `IPrincipal`; on success `AccessId` becomes available to
  controllers via `RMSAuthController.AccessId`. The exact signature-verification
  algorithm (which scheme classes exist, e.g. HMAC vs. something else) was **not**
  traced in this pass — `AuthenticationSchemeFactory` and its scheme implementations
  are a follow-up.

### Dependencies (confirmed via `.csproj`)

From `Fiuu.App.Reloads.Terminal.Api.csproj`:
- `ProjectReference` → `Components/CEPP/Fiuu.CEPP.csproj` and
  `Components/CEPP/Payment/BillPayment/Fiuu.Reloads.BillPayment.csproj`
- `ProjectReference` → `Applications/Restorify/Core/Fiuu.Reloads.Restorify.csproj`
- `ProjectReference` → `Applications/MOLReloads/Core/Fiuu.Reloads.csproj` (the business
  logic layer — see below)
- `ProjectReference` → `class-library/Reloads/TNG/Fiuu.Reloads.TNG.csproj` and
  `class-library/Reloads/Game/Fiuu.Reloads.Game.csproj`
- `HintPath` (legacy) → `web/Libraries/NET/Fiuu.Logging.1.1.0/...` and
  `Fiuu.MasterFramework.1.1.0/...`

The controllers themselves are thin — they map request models, call into
`Applications/MOLReloads/Core` (`Fiuu.Reloads` namespace) service classes
(`TNGService`, `GiftCardService`, etc. — see
[`class-library/cepp.md`](class-library/cepp.md) for how those services are composed),
and map the resulting `ErrorCode` back to an HTTP response. All real business logic
(terminal/store/dealer lookup, commission calculation, wallet debit, partner call,
DB persistence) lives one layer down in `MOLReloads/Core`, not in the API project
itself.

### External systems reached (confirmed by code, see sequence diagrams)

- **TNG** — via `class-library/Reloads/TNG` source, called from
  `MOLReloads/Core/Services/TNGService.cs`. Wire protocol not traced.
- **INCOMM** — via `Components/CEPP/Payment/INCOMM`
  (`InCommOperationService` → `InCommSecureProvider`), which does a plain HTTPS JSON
  POST to a URL from `AppSettings["GetInCommApiUrl"]`. See
  [`diagrams/giftcard-incomm-flow.md`](diagrams/giftcard-incomm-flow.md).
- Everything else the controller list implies (Ticket, Stock, Bill, Pinless, MOLPay,
  Game, Carbon Calculator/Offset) was not traced end-to-end in this pass.

### Databases touched

Via `MOLReloads/Core` → `class-library/Database` (`Fiuu.Database`, Dapper +
`RMS_OFFLINE` stored procedures) and `class-library/AWSCore` (partner credentials from
Secrets Manager). See [`00-topology.md`](00-topology.md) §7 for the exact mechanism —
no literal connection strings exist in this repo to cite.

## Secondary: `BackOffice/Api`

- **Path:** `reload/web/DEV/NET/Applications/BackOffice/Api`
- **Project:** `Fiuu.App.BackOffice.Api.csproj` (25 tracked files — much smaller than
  the Terminal API) + a `Core` sub-project (`Fiuu.App.BackOffice.Core.csproj`).
- **Purpose (inferred from name and its consumer):** a REST API backing
  `BackOffice/Web` (see [`web-app.md`](web-app.md)) for AJAX/JSON calls the WebForms
  portal makes. Not traced in depth in this pass — flagged as needs-follow-up if the
  portal's client-side behavior needs documenting.
- A repo-wide check found `Fiuu.App.BackOffice.Core.csproj` does **not** reference
  `class-library/Database/Fiuu.Database.csproj` directly (that direct reference exists
  only from `Notification/Api/Core` — see
  [`class-library/database.md`](class-library/database.md)). How `BackOffice/Api`
  reaches `RMS_OFFLINE` (prebuilt DLL? `Fiuu.Provider`? something else?) was not
  confirmed in this pass — flagged as follow-up rather than assumed.

## Note: a third, dead "BackOfficeAPI"

`Applications/BackOfficeAPI/` (capitalized differently, no space) also exists on disk
but has **zero tracked files at HEAD** — it's removed/dead code with only leftover
local build artifacts. See [`00-topology.md`](00-topology.md) §5. Do not confuse this
with the live `BackOffice/Api` documented above.
