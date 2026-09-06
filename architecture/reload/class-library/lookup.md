---
tags: [reload/architecture, module/lookup]
---

# Lookup

**Source:** `reload/web/DEV/NET/Components/Lookup` (32 tracked files,
`Fiuu.Lookup.csproj`). **Prebuilt artifacts:** both `class-library/Fiuu.Lookup.dll`
and the older `reload/web/Libraries/NET/Fiuu.Lookup/Lib/net40/Fiuu.Lookup.dll`
coexist — see [`../00-topology.md`](../00-topology.md) §4.

## What it's for

Reference/lookup data shared across apps: countries, languages, regions, phone-book
profiles, application registry, and wallet limits per account type.

## Structure

- `Models/` — `CountryInfo`, `StateInfo`, `Language`, `CountryLanguage`, `Region`,
  `Application`, `AccountTypeWalletLimit`, `LookupCodes`.
- `Enums/` — `MStatusEnum` (a generic active/inactive/pending-style status enum used
  widely — seen referenced as `EnumStatus` elsewhere, e.g. in `CEPP`),
  `PhoneBookProfileEnum`.
- `Services/` — `LookupService`, `CountryService`, `LanguageService`, `RegionService`,
  `ApplicationService`, `PhoneBookService`, `WalletLimitService`.
- `Providers/LookupProvider.cs` — data access.
- `Caching.cs`, `DependencyRegistrar.cs` — caching layer and Autofac module
  registration (see [`masterframework.md`](masterframework.md) for the DI mechanism
  this plugs into).

## Consumers

- `Components/CEPP` — direct `HintPath` reference to `class-library/Fiuu.Lookup.dll`
  (confirmed in `Fiuu.CEPP.csproj`) — i.e. CEPP depends on the **prebuilt** DLL rather
  than a `ProjectReference` to this source project.
- `BackOffice/Web` — direct `ProjectReference` to
  `Components/Lookup/Fiuu.Lookup.csproj` (source-level, not the DLL) — see
  [`../web-app.md`](../web-app.md). So the same logical module is consumed two
  different ways by two different callers; not unified.

## Related

- [[architecture/reload/class-library/cepp]] — the confirmed `HintPath` consumer of `Fiuu.Lookup.dll`
- [[architecture/reload/class-library/masterframework]] — the DI/caching mechanism this module's `DependencyRegistrar`/`Caching.cs` plug into

Note: this module's `LookupCodes`/`Region`/`Country` models plausibly correspond to either `CEPP.dbo.LookupCodes`/`Regions` or the separate `MLookUp` database (see [[architecture/reload_db/mlookup]], which explicitly warns these are physically distinct tables) — which one `Fiuu.Lookup` actually queries wasn't confirmed in this pass, so no link is asserted here to avoid guessing.
