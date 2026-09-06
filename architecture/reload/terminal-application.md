---
tags: [reload/architecture]
---

# `terminal_application` → `Reloads/TerminalServer/Console` (+ `ControlPanel`)

See [`00-topology.md`](00-topology.md) §3. No folder is literally named
`terminal_application`; this is the best-fit mapping — a Windows console/service app
that legacy POS terminal hardware connects to directly, as opposed to the modern REST
API in [`web-api.md`](web-api.md).

## `TerminalServer/Console` — the socket server

- **Path:** `reload/web/DEV/NET/Applications/Reloads/TerminalServer/Console`
- **Project:** `Fiuu.App.Reloads.TerminalServer.Console.vbproj` / `.sln`
- **Type:** VB.NET console application (built as a Windows Service in production,
  based on `ServerBase.vb`/`Program.vb` structure — service-hosting specifics not
  further confirmed).
- **Purpose:** hosts a custom raw **TCP socket server** that physical POS terminal
  hardware (and/or terminal-side software) connects to directly, as an alternative
  transport to the REST API. This is clearly the older/legacy integration path — the
  REST API (`Reloads/Terminal/Api`) and a `Reloads/Terminal/Simulator` project (which
  tests calls against that REST API) exist alongside it, suggesting an in-progress or
  completed migration from socket-based to REST-based terminal integration, with the
  socket server kept running for hardware that hasn't/can't move.

### Entry point / structure

- `Program.vb` → `TerminalServer.vb` / `ServerBase.vb` — startup and server lifecycle.
- `Sockets/ConnectionListener.vb`, `ConnectionHandler.vb`, `ClientConnection.vb`,
  `ConnectionManager.vb`, `ConnectionMonitor.vb` — the raw socket accept/dispatch layer.
- `MessageHandlers/TerminalMessageManager.vb` — routes an inbound message to the
  correct handler.
- `MessageHandlers/*.vb` — roughly **60 handler classes**, one (or a few, versioned by
  suffix like `10403`/`10405`/`10408`) per message type: `TNG*Handler` (Profile, Host
  Authentication, Online Card Validation, Blacklisted Card, Fund Request, Card
  Transaction, EndOfDay, EndOfShift, Summary Transaction, Audit Trail),
  `InComm*Handler` (Authorize Card, Profile, EndOfDay, EndOfShift),
  `OfflinePayment*Handler` (Address, EndOfDay, EndOfShift, Inquiry, Profile, QR
  Inquiry/Request, Refund, Reversal, Settlement, Transaction),
  `BillPayment*Handler` (Account Inquiry, EndOfDay, EndOfShift, Profile, PTPTN Account
  Query, Submission), `Pinless*Handler` (Check Transaction Status, Mobile Query, Sales,
  Submit Topup), `Restock*Handler`/`ReStock*Handler`/`StockReturn*Handler`,
  `Sales*Handler`/`VoidSales*Handler`, `TerminalProfileHandler`/`TerminalContentHandler`
  /`TerminalAutoRestockHandler`/`TerminalAppVersionHandler`, `PackageSchemaHandler`,
  `PrepaidCardRegistrationHandler`/`PrepaidRegisterProductHandler`,
  `ReloadWalletHandler`, `WalletBalanceHandler`, `MOLPayEndOfDayHandler`/
  `MOLPayEndOfShiftHandler`/`MOLPayProductHandler`, `EchoHandler`, `ServerTimeHandler`,
  `ErrorHandler`/`UnknownHandler`.

### Confirmed dependency on the shared business layer

Spot-checked `MessageHandlers/TNGProfileHandler.vb` — it directly `Imports`:
`Fiuu.CEPP`, `Fiuu.CEPP.Models`, `Fiuu.CEPP.Models.Interfaces`, `Fiuu.CEPP.Services`,
`Fiuu.Reloads.TNG.Models`, `Fiuu.Reloads.TNG.Services`,
`Fiuu.MasterFramework.Dependency`. This confirms the socket server calls into the
**same** `Components/CEPP` and `class-library/Reloads/TNG` source used by the REST API
(see [`web-api.md`](web-api.md) and [`class-library/cepp.md`](class-library/cepp.md)).

**Caveat:** only one handler was read in full. It calls `Fiuu.Reloads.TNG.Services`
directly rather than going through `MOLReloads/Core`'s `TNGService` (the class the REST
API's `TNGController` calls). This suggests the socket server and REST API may **each**
build their own orchestration on top of the same lower-level `CEPP`/`TNG` source,
rather than sharing one common orchestration service — i.e. **possible logic
duplication between the two terminal-facing entry points**, not a clean shared-service
architecture. The other ~59 handlers were not individually checked; this pattern was
not confirmed across all of them. Flagged as a real follow-up item, not resolved here.

## `TerminalServer/ControlPanel` — the operator console

- **Path:** `reload/web/DEV/NET/Applications/Reloads/TerminalServer/ControlPanel`
- **Project:** `Fiuu.App.Reloads.TerminalServer.ControlPanel.vbproj`
- **Type:** VB.NET WinForms desktop application (`MainForm.vb`).
- **Purpose (inferred from name/pairing):** an operator/ops desktop tool to monitor
  and/or control the `TerminalServer/Console` service (start/stop, view connections,
  etc.). Not traced further — `MainForm.vb` contents weren't read in this pass.

## What this is NOT

Not to be confused with `Reloads/Terminal/Api` (the REST API — see
[`web-api.md`](web-api.md)) or `Reloads/Terminal/Simulator` (a test harness for that
REST API, not the socket protocol). All three live under the same
`Applications/Reloads/` parent but are separate deployables.

## Related

- [[architecture/reload/web-api]] — the modern REST counterpart to this legacy socket server
- [[architecture/reload/class-library/cepp]] — the shared business layer both terminal-facing entry points call into
- [[architecture/reload/class-library/reloads-tng-game]] — the `Fiuu.Reloads.TNG.Services` confirmed called directly by `TNGProfileHandler.vb`
- [[gitlab-analysis/reload-tribal-knowledge]] — the #1892 incident (unhandled exception silently stopping TNG sales overnight) on this same component
