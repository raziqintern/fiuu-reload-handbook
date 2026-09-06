---
tags: [reload/architecture, module/masterframework]
---

# MasterFramework

**Source:** `reload/web/DEV/NET/Components/MasterFramework` (149 tracked files,
`Fiuu.MasterFramework.csproj`). **Prebuilt artifacts:** both
`class-library/Fiuu.MasterFramework.dll` and the older
`reload/web/Libraries/NET/Fiuu.MasterFramework.1.1.0/Lib/net40/...dll` coexist — see
[`../00-topology.md`](../00-topology.md) §4.

## What it's for

The cross-cutting technical framework underneath everything else — dependency
injection, caching, config, crypto, data access helpers, and general utilities. This
is **not** business logic (that's `CEPP`/`Database`/etc.) — it's plumbing that those
modules and every application build on.

## Structure (by subfolder)

- **`Dependency/`** — the DI container. `IContainerManager` /
  `AutofacContainerManager` / `ContainerManager` wrap Autofac;
  `AppDomainTypeFinder` / `WebAppTypeFinder` / `ITypeFinder` do assembly scanning for
  auto-registration; `IDependencyRegistrar` is the per-module registration contract
  (implemented by `DependencyRegistrar.cs` files seen in `Lookup`, `EInvoice`,
  `Restorify`, `Notification`, etc.). This is the mechanism behind the
  `EngineContext.Current.Resolve<T>()` pattern used pervasively in `CEPP`/`MOLReloads`
  service classes (`EngineContext` itself lives in `Fiuu.MasterFramework`, confirmed by
  its `using Fiuu.MasterFramework;` import in `GiftCardService.cs`/`TNGService.cs`).
- **`Caching/`** — caching abstraction (consumed by `Lookup/Caching.cs`,
  `Notification/Api/Core/Caching.cs`, `Restorify/Core/Services/CacheService.cs`, etc.).
- **`Configuration/`** — config access helpers.
- **`Cookies/`** — cookie helpers (web-app-specific).
- **`Cryptography/`**, **`Hashing/`**, **`RandomKeys/`** — crypto/signature/token
  utilities (the `AuthorizationHelper.NewToken(...)` used in `GiftCardService.cs` to
  mint gift-card authorization tokens likely sits on top of this, though
  `AuthorizationHelper` itself wasn't located/read in this pass).
- **`Data/`**, **`Database/`** — lower-level ADO.NET-style data access helpers
  (`SqlAccessor`, `SqlResult`, `ParameterCollection`, `ReturnType` — these are the
  types `Components/Provider/ProviderBase.cs` builds on; see
  [`provider.md`](provider.md)). This is a **different, older-style** data-access
  layer from `class-library/Database`'s Dapper-based one (see
  [`database.md`](database.md)) — the two coexist, not unified.
- **`Net/`** — networking helpers (HTTP clients, likely what
  `HttpClientHelper`/`HttpHelper` classes seen in `EInvoice`/`INCOMM` providers build
  on, though not directly confirmed).
- **`Pipelines/`**, **`Procesors/`** (sic — misspelled in the actual folder name) —
  some kind of processing-pipeline abstraction; not read in this pass.
- **`Utilities/`** — grab-bag helpers (`UtilHelper.GetConnectionTimeOutInMilliseconds()`
  /`GetConnectionTimeOutInSeconds()` seen used in `INCOMM`/`EInvoice` providers live
  here, per the `Fiuu.MasterFramework.Utilities` namespace).
- **`Validator/`** — validation helpers.
- **`WinRegistry/`** — Windows registry access (suggests some on-prem/desktop
  deployment concern, consistent with the WinForms `TerminalServer/ControlPanel` and
  socket-server console apps).

## Consumers

Universal — every application and nearly every other `class-library`/`Components`
module either references `Fiuu.MasterFramework` directly or transitively depends on
something that does. Confirmed direct references: `BackOffice/Web`,
`Reloads/Terminal/Api` (both via legacy `HintPath`), `CEPP`, `Lookup`, `Provider`
(via `Fiuu.MasterFramework.Database`), and every service class using `EngineContext`.

## Related

- [[conventions/layering-and-architecture]] — the `EngineContext`/service-locator DI pattern this module implements
- [[architecture/reload/class-library/provider]] — the `SqlAccessor`/`ParameterCollection` data-access helpers that live in this module's `Data`/`Database` subfolder
- [[architecture/reload/class-library/cepp]] — the busiest confirmed consumer of this module
