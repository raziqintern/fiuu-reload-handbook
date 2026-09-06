# AWSCore

**Source:** `reload/class-library/AWSCore` — a genuine `class-library` submodule
module (not split out to `Components/`, unlike CEPP/Logging/Lookup/MasterFramework/
Provider — see [`../00-topology.md`](../00-topology.md) §4).

## What it's for

Centralizes access to **AWS Secrets Manager** for partner-integration credentials
(API keys, login IDs, passwords — never database connection strings, which use a
separate file-based mechanism, see [`database.md`](database.md) and
[`../00-topology.md`](../00-topology.md) §7).

## Structure

- `Services/SecretsManagerService.cs` — thin wrapper around the AWS Secrets Manager
  SDK; `ServiceBase.cs` is its (and other AWSCore services') common base.
- `Helpers/SecretsHelper.cs` — a singleton (`SecretsHelper.Instance`) that, on first
  use, reads an `EventAppName` app setting, maps it through `Enums/AppUserNames.cs`
  to decide **which** partner's secret labels this particular running application
  needs, then eagerly fetches every matching label from Secrets Manager into an
  in-memory `SecretsDictionary`.
- `Enums/SecretsLabels.cs` — one nested static class per partner, each holding
  `const string` label names of the form `"{Partner}#{Field}"` (e.g.
  `AnyPay.LoginId` = `"AnyPay#LoginId"`). Confirmed partners with dedicated label
  groups (from actually reading this file): **AnyPay, Astro, ATX, Celcom, Digi,
  DTOne, EInvoice, EPay, IIMMPACT, InComm, IWK, JomPay**, and more not enumerated
  individually in this pass (the file continues past what was read).
- `Enums/AppUserNames.cs` — the per-application identity constants
  (`AstroConsole`, `Astro`, etc. seen referenced) that `SecretsHelper` switches on to
  decide which labels to preload — i.e. each deployed app only pulls the secrets it
  actually needs, not the whole partner roster.
- `Providers/ConfigurationProvider.cs` — not read in detail in this pass.
- `Models/` — not enumerated in this pass.

## Why this matters for the rest of the handbook

This is the reason no `<connectionStrings>`-style partner credential ever appears in
any `Web.config`/`App.config` in this repo — anywhere a controller or service needs a
partner API key/password, expect it to come from `SecretsHelper.Instance` or
`SecretsManagerService`, not from config. This was confirmed as the mechanism, not
inferred — but which specific classes call `SecretsHelper` for which partner
integration was not individually traced for every partner (e.g. it wasn't directly
confirmed that `Pin/Core`'s `AnyPaySecureProvider.cs` calls `SecretsHelper` rather than
reading `ConfigurationManager.AppSettings` the way `EInvoiceSecureProvider.cs` and
`InCommSecureProvider.cs` do for their *endpoint URLs* — those two do use
`AppSettings` for URLs, which is a different, non-secret piece of config).

## Consumers

Confirmed via `grep` for `AWSCore` across every `.csproj` in the repo: **only
`class-library`'s own sibling modules** reference it via `ProjectReference` —
`Reloads/TNG/Fiuu.Reloads.TNG.csproj`, `Secure/Astro/Fiuu.Astro.Secure.Core.csproj`,
`Secure/Incomm/Fiuu.InComm.Secure.Core.csproj`,
`Secure/Telekom/Fiuu.Telekom.Secure.Core.csproj`. **No application project
(`Applications/*`) references `AWSCore.csproj` directly** — meaning any application
that needs secrets gets them transitively through those four modules (e.g. through
`MOLReloads/Core` → `Reloads/TNG` → `AWSCore` for TNG credentials), not by referencing
`AWSCore` itself. This is narrower than initially assumed from the partner roster in
`SecretsLabels.cs` (which lists many more partners than just TNG/Astro/Incomm/
Telekom) — either those other partners' secret-fetching code lives somewhere that
reaches `AWSCore` some other way (e.g. via the prebuilt `class-library` DLLs rather
than `ProjectReference`, which this grep wouldn't catch), or `SecretsLabels.cs` defines
labels for partners whose actual secret-fetching call site wasn't found in this pass.
Flagged as a real follow-up, not resolved.
