---
tags: [reload/architecture, module/pin, module/pinless]
---

# Reloads.Pin (+ sibling Reloads.Pinless)

**Source:** `reload/web/DEV/NET/Applications/Pin/Core`
(`Fiuu.Reloads.Pin.csproj`, 47 tracked files). **Prebuilt artifact:**
`class-library/Fiuu.Reloads.Pin.dll` — source lives in `Applications/Pin/Core`, not in
`class-library` (see [`../00-topology.md`](../00-topology.md) §4).

A sibling module, **Reloads.Pinless** (`Applications/Pinless/Core`,
`Fiuu.Reloads.Pinless.csproj`, 156 tracked files), is documented here too since it's
the direct counterpart (pinless = direct top-up without a physical/e-PIN, as opposed
to PIN-based reload) and shares the same partner-integration shape. It does **not**
have a corresponding prebuilt DLL in `class-library` — its consumers must use
`ProjectReference` directly.

## What it's for

Both modules implement **upstream prepaid supplier integrations** — the "wholesale"
side of reload, where Fiuu buys/redeems airtime credit or PINs from third-party
aggregators/suppliers to fulfill a reload request, as opposed to `CEPP`'s "retail" side
(terminal/dealer/store/wallet). Each partner gets its own `*SecureProvider.cs` class.

## Confirmed partner integrations (from actual `Providers/` file names)

**Pin** (`Applications/Pin/Core/Providers/`): AnyPay (`AnyPaySecureProvider`), ATX
(`ATXSecureProvider`), Giftee (`GifteeSecureProvider`), IIMMPACT
(`IIMMPACTSecureProvider`), NPN (`NPNSecureProvider`), RazerGold
(`RazerGoldSecureProvider`) — the last is notable since "Razer Gold" is Razer's own
gaming-credit product, consistent with Fiuu's history as Razer Merchant Services.

**Pinless** (`Applications/Pinless/Core/Providers/SecureApi/`): AnyPay, CelcomDigi,
Celcom, DTOne, IIMMPACT, MobilityOne, NPN, Panda, PayLink, PrepayNation, Richtech,
UMobile, YTL.

Several of these partner names (AnyPay, ATX, Celcom, DTOne, IIMMPACT) also have
dedicated secret-label groups in `class-library/AWSCore/Enums/SecretsLabels.cs`,
confirming they're live, credentialed integrations rather than dead code — see
[`awscore.md`](awscore.md).

Response/error-code enums per partner exist under `Pin/Core/Models/Enums/`
(`AnyPayResponseCode`, `ATXErrorCode`, `GifteeResponseCode`,
`IIMMPACTResponseCode`, `NPNErrorCode`, `RazerGoldResponseCode`), plus a shared
`ServiceProviderType` enum and a `RazerGoldCredentialsType` enum.

## Structure (Pin)

- `Models/` — one request/response pair per partner operation (balance check, status
  check, reload/recharge, stock purchase, e-gift generation, PIN order submit/check).
- `Providers/` — the `*SecureProvider` HTTP client classes.
- `Helpers/` — `HttpClientHelper`, `LogHelper`, `UtilHelper`.

## Structure (Pinless)

- `Services/` — `ApiPinlessService`/`IApiPinlessService`, `PinlessSalesService`,
  `RetryServiceProviderService` (implies automatic retry-on-failure across supplier
  providers — consistent with having many redundant partners for the same telco),
  `ReportService`, `PinlessCountryServiceLocator`, `ServiceLocator`.
- `Providers/` — `ApiPinlessProvider`, `PinlessSalesProvider`, `ReportProvider`,
  `RetryServiceProviderProvider`, `Database.cs`, plus the `SecureApi/*` partner
  clients listed above.

## Consumers

Confirmed via `grep` for `Fiuu.Reloads.Pin.csproj`/`Fiuu.Reloads.Pinless.csproj` across
all `.csproj`/`.vbproj` files — both are referenced (`ProjectReference`) by:
- `MOLReloads/Core/Fiuu.Reloads.csproj` — i.e. `Reloads/Terminal/Api`'s
  `PinlessController` (see [`../web-api.md`](../web-api.md)) reaches Pin/Pinless
  **transitively** through `MOLReloads/Core`, not directly.
- `BackOffice/Web/Fiuu.App.BackOffice.Web.vbproj` — direct reference (see
  [`../web-app.md`](../web-app.md)).
- `Pinless` additionally referenced by `Components/ReloadsPatching/Fiuu.Patching.csproj`.

`Pinless/Scheduler` (see [`../console-app.md`](../console-app.md)) is the background
job for this module; not confirmed whether it references `Pinless/Core` directly (not
checked in this pass).

## Related

- [[architecture/reload_db/prepaid]] — the legacy Prepaid/Pinless registration-tracking database (day-to-day sales actually live in `TRANSACTION`)
- [[architecture/reload/class-library/awscore]] — the confirmed secret-label groups for several partners listed above (AnyPay, ATX, Celcom, DTOne, IIMMPACT)
- [[gitlab-analysis/reload-tribal-knowledge]] — the Pin/Pinless drift pattern (§2.3) this module's split structure explains
