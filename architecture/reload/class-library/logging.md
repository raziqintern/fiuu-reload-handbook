---
tags: [reload/architecture, module/logging]
---

# Logging

**Source:** `reload/web/DEV/NET/Components/Logging` (39 tracked files,
`Fiuu.Logging.csproj`). **Prebuilt artifacts:** both `class-library/Fiuu.Logging.dll`
(newer) and the older, separately-versioned
`reload/web/Libraries/NET/Fiuu.Logging.1.1.0/Lib/net40/Fiuu.Logging.dll` coexist — see
[`../00-topology.md`](../00-topology.md) §4. Many apps (e.g. `BackOffice/Web`,
`Reloads/Terminal/Api`) still reference the **older** vendored copy via `HintPath`
rather than the `class-library` one.

## What it's for

A pluggable logging framework — the one visible in the API's own `Web.config`
(`<add name="Physical" type="Fiuu.Logging.Providers.FileProvider, Fiuu.Logging"
filePath="C:\Logs\RMS\TerminalApi\" .../>`), and referenced via a static
`Logger.WriteErrorToEventLogs(...)` call pattern used throughout every other module
documented in this handbook.

## Structure

- `LogManager.cs` — the main entry point.
- `Providers/` — `FileProvider`, `EmailProvider`/`SmtpProvider`, `SqlDataProvider`,
  `Database.cs` — pluggable log sinks.
- `MongoDB/` (`Models/`, `Providers/`) — a MongoDB-backed log sink, alongside the
  SQL/file ones.
- `Configuration/` (`LoggingConfigurationSection`, `Provider`/`ProviderCollection`,
  `Filter`/`FilterCollection`, `Level`/`LevelCollection`,
  `ExceptionNotification`/`ExceptionEmailConfigurationElement`) — a custom
  `<configSection>` design (config-driven, multiple named providers/filters/levels
  per app, similar in spirit to log4net's config model).
- `Http/` (`ExceptionLogger.cs`, `TraceMessageHandler.cs`, `Http/Filters/`) — ASP.NET
  Web API integration (global exception logging, request tracing).
- `Interfaces/ILogProvider.cs` — the provider contract.
- `Models/ExceptionInfo.cs`, `Models/Log.cs` — the log record shape.

## Consumers

Effectively every application and component documented in this handbook references
either this or its legacy vendored equivalent — it is the most universally-depended-on
module in the codebase (confirmed via the `Logger.WriteErrorToEventLogs` call sites
seen across `CEPP`, `TNGService`, `GiftCardService`, `EInvoiceSecureProvider`,
`InCommSecureProvider`, and the WebForms/console app config files).

## Related

- [[conventions/logging]] — the `LogHelper` wrapper patterns built on top of this component
- [[architecture/reload/class-library/cepp]] — one of the many confirmed `Logger.WriteErrorToEventLogs` call sites
- [[architecture/reload/class-library/masterframework]] — the sibling cross-cutting technical module this one sits alongside
