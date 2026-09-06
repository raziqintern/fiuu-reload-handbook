---
name: reload-architecture
description: Condensed reference for the real structure of Fiuu's reload application — the verified topology (which folders are real vs. empty), the component/application map, the class-library shared modules, the actual dependency graph, and the traced end-to-end transaction flows — reverse-engineered directly from the repo rather than assumed. Use when tracing how a reload transaction flows through the system, figuring out which application or component owns a given file/feature, checking what a module actually depends on before changing it, or before making any claim about the reload app's architecture; points into architecture/reload/ for full depth per component.
---

# Reload application — architecture (condensed)

Read `fiuu-reload-handbook` (master skill) first, especially correction #1
(most top-level sibling folders are empty) and #2 (the stale top-level
`class-library` clone) — everything below assumes those corrections. Full
source: [`../../architecture/reload/`](../../architecture/reload/), verified
2026-09-05.

## What the system does

A prepaid top-up / retail payment platform: physical and software POS
terminals submit transactions (telco airtime, e-wallet reload, gift cards,
bill payment, ...) which get validated, priced (commission/margin), persisted,
and routed to the relevant external partner, plus a back-office web portal
and a family of scheduled jobs for reporting/reconciliation/settlement.
Confirmed integrations: **TNG** (Touch 'n Go e-wallet), **INCOMM** (gift
cards), plus a large partner roster (Astro, Celcom, Digi, DTOne, JomPay,
ATX, AnyPay, IIMMPACT, IWK, Telekom, ...) reached only via AWS Secrets
Manager label names, not individually traced end-to-end. EInvoice (Malaysia
e-invoicing) and "Restorify" (carbon-offset subscription billing — despite
the name) are separate business lines in the same monorepo.

## The topology map: requested name → what's actually there

Everything lives inside the single `reload/` repo, under
`reload/web/DEV/NET/Applications/` (deployables) and `.../Components/`
(shared source libraries). Full verification:
[`../../architecture/reload/00-topology.md`](../../architecture/reload/00-topology.md).

| If you're looking for... | It's actually... | Doc |
|---|---|---|
| `web_api` | `Applications/Reloads/Terminal/Api` (`Fiuu.App.Reloads.Terminal.Api`, the terminal-facing REST API) + a smaller `Applications/BackOffice/Api` | [`web-api.md`](../../architecture/reload/web-api.md) |
| `web_app` | `Applications/BackOffice/Web` (`Fiuu.App.BackOffice.Web`, VB.NET WebForms, 1,346 files — the largest app in the repo) | [`web-app.md`](../../architecture/reload/web-app.md) |
| `reload_portal` | **Unresolved** — no second web-UI codebase found; only candidate is the same `BackOffice/Web` | [`reload-portal.md`](../../architecture/reload/reload-portal.md) |
| `terminal_application` | `Applications/Reloads/TerminalServer/Console` (legacy raw TCP socket server for POS hardware) + `.../ControlPanel` (WinForms operator monitor) | [`terminal-application.md`](../../architecture/reload/terminal-application.md) |
| `console_app` | **Not one app** — a family of ~12 per-module `Scheduler` background-job console apps, plus standalone tools (`BulkUploadFile`, `SalesDiscrepancy`, `SAP`, `UploadStock`) | [`console-app.md`](../../architecture/reload/console-app.md) |
| `class-library` | `reload/class-library` submodule **plus** `reload/web/DEV/NET/Components/*` — see the three-tier split below | per-module docs below |

Dead/removed folders with real-looking local build cruft but **zero tracked
files at HEAD** — never cite as current: `Applications/BackOfficeAPI`,
`Applications/CEPP` (the old umbrella, not the live `Components/CEPP`),
`Applications/PGW`, `Applications/UMobile` (not the live `Components/UMobile`).

## The three-tier "shared library" pattern

Confirmed via actual `.csproj`/`.vbproj` `ProjectReference`/`HintPath`
entries, not assumed layering:

1. **`Components/*`** (inside `reload` itself) — `CEPP`, `Logging`,
   `Lookup`, `MasterFramework`, `Provider`, `ReloadsPatching`, `UMobile` —
   consumed via `ProjectReference`.
2. **`class-library` submodule** — a mix of **source** (`AWSCore`,
   `Database`, `Reloads/TNG`, `Reloads/Game`, `Secure/Astro`,
   `Secure/Incomm`, `Secure/Telekom`, via `ProjectReference`) and
   **prebuilt DLLs at its repo root** (`Fiuu.CEPP.dll`, `Fiuu.EInvoice.dll`,
   `Fiuu.Logging.dll`, `Fiuu.Lookup.dll`, `Fiuu.MasterFramework.dll`,
   `Fiuu.Provider.dll`, `Fiuu.Reloads.Pin.dll`, `Fiuu.Reloads.Restorify.dll`,
   `MOL.Notification.Client.dll` — referenced via `HintPath` even though
   several of these DLLs' actual **source** lives in tier 1 or tier 3, not
   in `class-library` itself; how the DLL gets built/committed there is
   unconfirmed).
3. **`reload/web/Libraries/NET/*`** — an older, per-version vendored-DLL
   drop (`Fiuu.Logging.1.1.0/`, `Fiuu.MasterFramework.1.1.0/`, ...). Several
   apps (`BackOffice/Web`, `Reloads/Terminal/Api`) still reference **these**
   older copies via `HintPath` instead of `class-library`'s — a live,
   only-partially-completed consolidation, not clean layering. **Don't
   assume "app X depends on module Y" as a blanket rule** — verify the
   specific `ProjectReference`/`HintPath` per app (each component doc below
   does this).

Full detail: [`00-topology.md`](../../architecture/reload/00-topology.md) §4.

## Components (one doc each)

| Doc | Covers |
|---|---|
| [`web-api.md`](../../architecture/reload/web-api.md) | Terminal REST API — controllers, custom auth scheme, `Pgw_*` parallel controller set (unexplained), external calls |
| [`web-app.md`](../../architecture/reload/web-app.md) | `BackOffice/Web` — the WebForms admin portal, ASP.NET membership config |
| [`terminal-application.md`](../../architecture/reload/terminal-application.md) | Legacy TCP socket server, ~60 `MessageHandlers`, possible logic duplication vs. the REST API (only one handler traced) |
| [`console-app.md`](../../architecture/reload/console-app.md) | Per-module Scheduler apps + standalone tools |
| [`class-library/cepp.md`](../../architecture/reload/class-library/cepp.md) | The shared retail/POS transaction engine — terminal/store/dealer identity, commission calc, per-partner `Payment/*` sub-projects |
| [`class-library/database.md`](../../architecture/reload/class-library/database.md) | `Fiuu.Database` — Dapper-based `RMS_OFFLINE` data access (newer of two DB layers) |
| [`class-library/provider.md`](../../architecture/reload/class-library/provider.md) | `Fiuu.Provider` — older `SqlAccessor`-based DB layer, unresolved relationship to `Fiuu.Database` |
| [`class-library/awscore.md`](../../architecture/reload/class-library/awscore.md) | AWS Secrets Manager wrapper for partner credentials — only 4 modules reference it directly, most partners' secret call-sites unconfirmed |
| [`class-library/logging.md`](../../architecture/reload/class-library/logging.md) | `Fiuu.Logging` — the most universally-depended-on module |
| [`class-library/lookup.md`](../../architecture/reload/class-library/lookup.md) | Reference data (countries, languages, wallet limits) |
| [`class-library/masterframework.md`](../../architecture/reload/class-library/masterframework.md) | DI/Autofac, caching, crypto, the older ADO.NET data-access helpers `Provider` builds on |
| [`class-library/notification.md`](../../architecture/reload/class-library/notification.md) | Outbound messaging (email/SMS) — the prebuilt `MOL.Notification.Client.dll`'s source was **not** conclusively located |
| [`class-library/einvoice.md`](../../architecture/reload/class-library/einvoice.md) | E-invoicing submission client — target gateway identity (LHDN/MyInvois) is inferred, not confirmed |
| [`class-library/reloads-pin.md`](../../architecture/reload/class-library/reloads-pin.md) | Pin + Pinless upstream supplier integrations (AnyPay, ATX, Giftee, IIMMPACT, NPN, RazerGold, CelcomDigi, DTOne, ...) |
| [`class-library/reloads-restorify.md`](../../architecture/reload/class-library/reloads-restorify.md) | **Not** a transaction-recovery module despite the name — a carbon-offset/subscription-billing product line |
| [`class-library/reloads-tng-game.md`](../../architecture/reload/class-library/reloads-tng-game.md) | TNG lower-level services (merchant key storage, wallet ops) and the Game (online gaming credit) module |
| [`class-library/secure.md`](../../architecture/reload/class-library/secure.md) | Astro, Incomm (ISO 8583 framework), Telekom (SOAP) partner-integration modules, all depending on AWSCore |

## Dependency graph (condensed)

```
Applications (Reloads/Terminal/Api, BackOffice/Web, TerminalServer/Console, Schedulers, ...)
        │  ProjectReference / HintPath
        ▼
Components (CEPP, Logging, Lookup, MasterFramework, Provider, ReloadsPatching, UMobile)
        │
        ▼
class-library submodule (AWSCore, Database, Reloads/TNG, Reloads/Game, Secure/*, + prebuilt DLLs)
        │
        ▼
reload/web/Libraries/NET (legacy vendored DLLs — parallel path, not fully replaced)
```

CEPP is the hub nearly everything terminal-facing sits on. `AWSCore` is
reached **only** through `Reloads/TNG` and the three `Secure/*` modules at
the `.csproj` level — no `Applications/*` project references it directly,
narrower than the partner roster in `SecretsLabels.cs` would suggest. Full
mermaid diagram with every confirmed edge:
[`01-overview.md`](../../architecture/reload/01-overview.md).

## Traced end-to-end flows

- [`diagrams/tng-reload-flow.md`](../../architecture/reload/diagrams/tng-reload-flow.md) — TNG e-wallet transaction via the Terminal API.
- [`diagrams/giftcard-incomm-flow.md`](../../architecture/reload/diagrams/giftcard-incomm-flow.md) — INCOMM gift card initiate + confirm.
- [`diagrams/einvoice-submission-flow.md`](../../architecture/reload/diagrams/einvoice-submission-flow.md) — EInvoice submission is a **scheduled batch job**, not a live-transaction trigger (correction to the natural assumption).

## Open questions worth knowing before you answer confidently

- **`reload_portal`** — no second web-UI codebase found distinct from
  `BackOffice/Web`; three explanations proposed, none confirmed. See
  [`reload-portal.md`](../../architecture/reload/reload-portal.md).
- **`Pgw_*` controllers** in the Terminal API — a parallel controller set,
  exact difference from the non-`Pgw_` equivalents not traced.
- **Terminal socket server vs. REST API** — only one of ~60 `MessageHandlers`
  was traced; it calls `Fiuu.Reloads.TNG.Services` directly rather than
  through `MOLReloads/Core`'s `TNGService` the REST API uses — possible
  logic duplication between the two terminal-facing entry points, not
  confirmed across all handlers.
- **`MOL.Notification.Client.dll`** source was not conclusively found — the
  live `Applications/Notification/Client` project has a different assembly
  name (`Fiuu.App.Notification.Client`).
- What wasn't traced at all in this pass: `reload_db` itself (see
  `reload-db-architecture`), every `MessageHandler`, the exact
  Components→prebuilt-DLL build/publish mechanism, and any second
  `reload_portal`.

## Staleness

Verified against a live checkout 2026-09-05 (`.git` state, `.gitmodules`,
`git remote -v`, `git log`, folder diffs). Re-run the topology checks in
`00-topology.md` §1 if this handbook feels old — the empty-sibling-folders
finding in particular is worth re-confirming rather than assumed permanent.
