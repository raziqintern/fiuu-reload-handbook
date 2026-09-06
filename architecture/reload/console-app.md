---
tags: [reload/architecture]
---

# `console_app` — a family of background-job apps, not one app

See [`00-topology.md`](00-topology.md) §3. There is no single "console_app" project;
this name best maps to a **category** of independent console executables, each scoped
to one business module. They were not individually traced in depth in this pass —
this doc records what exists and where, at breadth, per the brief's priority on
covering every component rather than exhaustively reading each one.

Not covered here: `Reloads/TerminalServer/Console`, which is also technically a
console app but is documented separately in
[`terminal-application.md`](terminal-application.md) because it's a long-running
socket server for terminal hardware, not a scheduled background job — a different
category despite the shared "Console" folder name.

## Per-module scheduler apps

Each of these is `Applications/<Module>/Scheduler`, its own `.sln`/`.csproj`, and (per
the `git ls-tree` file counts in [`00-topology.md`](00-topology.md)) genuinely tracked,
live code:

| Module | Path | Project |
|---|---|---|
| BackOffice | `Applications/BackOffice/Scheduler` | `Fiuu.App.BackOffice.Console.csproj` |
| EInvoice | `Applications/EInvoice/Scheduler` | `Fiuu.App.EInvoice.Console.csproj` |
| EPay | `Applications/EPay/Scheduler` (+ `Scheduler/Core`) | `Fiuu.App.EPay.Console.csproj` / `Fiuu.App.EPay.Core.csproj` |
| Game | `Applications/Game/Scheduler` | `Fiuu.App.Game.Console.csproj` |
| OnlineTopUp | `Applications/OnlineTopUp/Scheduler` | (csproj not individually confirmed by name) |
| Pinless | `Applications/Pinless/Scheduler` | `Fiuu.App.Pinless.Console.csproj` |
| Reloads | `Applications/Reloads/Scheduler` | `Fiuu.App.Reloads.Console.csproj` |
| Reports | `Applications/Reports/Scheduler` | `Fiuu.App.Reports.Console.csproj` |
| Restorify | `Applications/Restorify/Scheduler` | `Fiuu.App.Restorify.Console.csproj` |
| Ticket | `Applications/Ticket/Scheduler` | `Fiuu.App.Ticket.Console.csproj` |

Confirmed dependencies for a sample of these (via `.csproj` `ProjectReference`,
see [`00-topology.md`](00-topology.md) §4 for the general pattern):
- `Reports/Scheduler`, `Reloads/Scheduler`, `Game/Scheduler` all reference
  `class-library/Reloads/TNG/Fiuu.Reloads.TNG.csproj` and
  `class-library/Reloads/Game/Fiuu.Reloads.Game.csproj` directly.
- The rest were not individually opened; assume the same shared-dependency pattern as
  their sibling `Api`/`Core` projects (documented in the relevant class-library docs)
  until confirmed otherwise.

Given the naming (BackOffice/EInvoice/EPay/Game/OnlineTopUp/Pinless/Reloads/Reports/
Restorify/Ticket), these are near-certainly scheduled jobs (report generation,
reconciliation, settlement batches, expiry/cleanup) for their respective business
module — but the specific jobs each one runs were not read in this pass (would require
opening each `Program.cs`/job-scheduling code individually).

## Standalone one-off tools

Smaller, don't fit the per-module Scheduler pattern:

- **`Applications/BulkUploadFile`** (`Fiuu.App.BulkUploadFile.Console.csproj`, 5
  tracked files) — bulk file upload utility (product/stock data import, inferred from
  name; not confirmed).
- **`Applications/SalesDiscrepancy`** (`Fiuu.App.SalesDiscrepancy.Console.csproj`, 5
  tracked files) — sales reconciliation discrepancy checker (inferred from name).
- **`Applications/SAP`** (`Fiuu.App.SAP.Console.csproj`, 27 tracked files, has its own
  `Helper/`, `Model/`, `Providers/`, `Services/` subfolders) — SAP integration/export
  tool, presumably for financial posting to an SAP ERP system. Largest of the
  standalone tools; plausibly worth a deeper look in a future pass given its size
  relative to "one-off."
- **`Applications/UploadStock`** (`Fiuu.App.UploadStock.Console.csproj`, 5 tracked
  files) — stock upload utility (inferred from name).
- **`Applications/EPay/Recon/Cmd`** (+ `Recon/Core`) — a reconciliation command-line
  tool specific to EPay, separate from `EPay/Scheduler`.
- **`Applications/Notification/Client/Cmd`** — a command-line variant of the
  Notification client (see [`class-library/notification.md`](class-library/notification.md)).

None of these had their `Program.cs` main logic read in this pass — only confirmed to
exist and to have a real entry point file.

## Dead/removed: the old `Applications/CEPP` scheduler umbrella

`Applications/CEPP/` (the old umbrella, distinct from the live `Components/CEPP`) used
to contain per-report console tools — `AutoUploadStock`, `BulkUploadFile`,
`MonthlySalesReport`, `MReloadSettlementReport`, `ProfitReport`, `ReversalBatch`,
`SalesDiscrepancy`, `SAPReporting`, `Scheduler`, `SevenETelcoSales`,
`StoreBulkUploadFile`, `TelcoSalesReport`, `TerminalReportScheduler`,
`TerminalServer_VB`, `Ticket`, `UnsoldStockBalanceReport`, `UploadStockBackend` — but
this entire folder has **zero tracked files at HEAD** (confirmed dead, see
[`00-topology.md`](00-topology.md) §5). The naming overlap with several of the
standalone tools above (`BulkUploadFile`, `SalesDiscrepancy`, `SAPReporting`/`SAP`,
`Ticket`) strongly suggests these were split out of the old CEPP umbrella into their
current per-module homes under `Applications/*` directly, and the umbrella folder was
deleted from git but not cleaned up locally. Treat the current per-module locations in
the tables above as the live versions; do not reference `Applications/CEPP/*` as
current anywhere.

## Related

- [[architecture/reload/00-topology]] — the dead-folder verification (§5) behind the "don't reference `Applications/CEPP/*`" warning
- [[architecture/reload/class-library/reloads-tng-game]] — the `Fiuu.Reloads.TNG`/`Fiuu.Reloads.Game` dependency confirmed for several schedulers
- [[architecture/reload_db/sap]] — the database the standalone `Applications/SAP` tool most likely posts to
