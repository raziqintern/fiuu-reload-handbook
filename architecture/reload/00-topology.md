---
tags: [reload/architecture]
aliases: ["Reload Topology"]
---

# Topology: what's actually on disk vs. what we assumed

This doc replaces assumption with verification. Everything below was checked directly
against `.git` state, `.gitmodules`, `git remote -v`, `git log`, and folder diffs on
2026-09-05. Where something could not be confirmed, it says so.

All paths below are relative to the local workspace root (`C:\git\fiuu_reload\` on the
machine this was traced on — never written out, and irrelevant to the finding).

## 1. The headline finding: most "sibling folders" are empty

The starting assumption was that `fiuu_reload/` contains several **independent git
checkouts** side by side: `reload`, `reload_db`, `class-library`, `web_api`, `web_app`,
`terminal_application`, `console_app`, `power_bi`, `powershell`, `reload_portal`.

Verified reality:

| Folder | Has `.git`? | Contents | Verdict |
|---|---|---|---|
| `reload/` | Yes (real repo) | Full working tree | **Real, active repo** |
| `reload_db/` | Yes (real repo) | Full working tree (SQL patch scripts) | **Real, active repo** |
| `class-library/` (top level) | Yes (real repo) | Full working tree, but **stale** (see §2) | **Real repo, but a stale clone** |
| `web_api/` | No | 0 entries | **Empty directory** |
| `web_app/` | No | 0 entries | **Empty directory** |
| `reload_portal/` | No | 0 entries | **Empty directory** |
| `terminal_application/` | No | 0 entries | **Empty directory** |
| `console_app/` | No | 0 entries | **Empty directory** |
| `power_bi/` | No | 0 entries | **Empty directory** |
| `powershell/` | No | 0 entries | **Empty directory** |

Confirmed with `ls -la` and `find <dir> -mindepth 1 | wc -l` on each — all seven report
zero entries. These are not checked-out repos with content that was overlooked; they are
genuinely empty placeholder directories (`mkdir`'d, never populated — likely reserved for
future/expected clones that never happened, or a scaffold left over from planning this
handbook's own folder layout). **Nothing in this handbook can come from those seven
folders.** Every "application" the task asks about actually lives inside the `reload/`
repo itself (see §3).

This is the single most important correction to the brief: **there is no separate
`web_api` repo, no separate `web_app` repo, etc.** They're one monorepo (`reload/`) with
internal subfolders per application.

## 2. `class-library`: one repo, two checkouts, out of sync

`reload/.gitmodules`:
```
[submodule "class-library"]
	path = class-library
	url = https://git2u.fiuu.com/offline-teams/rmsreload/class-library
```

So `reload/class-library` is a **git submodule** of the `reload` superproject. Its
`.git` file confirms this (`gitdir: ../.git/modules/class-library`).

The top-level `class-library/` folder is **also** a full clone of the exact same remote
(`https://git2u.fiuu.com/offline-teams/rmsreload/class-library.git` — confirmed via
`git remote -v` in both locations), but it is a **separate, independent checkout**, not
the submodule's working tree.

The two are at **different commits**:

| Checkout | HEAD commit | HEAD date |
|---|---|---|
| `reload/class-library` (submodule, matches `reload`'s recorded submodule pointer) | `cfda1892…` | 2026-09-04 |
| `class-library/` (top-level standalone clone) | `bda8e5ec…` | 2026-08-18 |

`diff -rq` between the two working trees shows real source differences (e.g.
`AWSCore/Enums/AppUserNames.cs`, `AWSCore/Enums/SecretsLabels.cs`,
`AWSCore/Helpers/SecretsHelper.cs`, most of `Reloads/TNG/*`, `Secure/Incomm/*`), plus the
top-level clone is missing things the submodule has (`Reloads/Game`, some `TNG/Services`
files, `TNG/Exceptions/MissingMerchantSecretKeyException.cs`) and vice versa
(`Reloads/TNG/app.config`, a handful of `Services` files) — i.e. genuine divergent
history, not just build artifacts.

**Verdict: the top-level `class-library/` is a stale, out-of-date standalone clone of
the same repo the `reload` submodule points at.** It is not consumed by anything (no
`.csproj` in `reload/` references paths under the top-level `class-library/` — all
`ProjectReference`/`HintPath` entries that mention `class-library` resolve relative to
`reload/class-library`, the submodule). Treat `reload/class-library` as the
source-of-truth checkout for everything in this handbook; the top-level `class-library/`
should be treated as a leftover/orphaned clone and ignored (or deleted) rather than
documented as a second thing.

## 3. Where the real applications actually live

`reload/` contains two important subtrees:

- `reload/web/DEV/NET/Applications/` — every deployable application (web apps, REST
  APIs, Windows services/console jobs, one WinForms desktop tool).
- `reload/web/DEV/NET/Components/` — shared source libraries consumed by those
  applications (see §4 for how this relates to `class-library`).
- `reload/web/Libraries/NET/` — a large folder of vendored third-party **and** internal
  prebuilt DLLs, versioned by folder name (e.g. `Fiuu.Logging.1.1.0/`,
  `Fiuu.MasterFramework.1.1.0/`, `AWSSDK.Core.3.7.5.7/`) — a pre-NuGet-style local
  package drop that many `.csproj`/`.vbproj` files still reference via relative
  `HintPath`.
- `reload/web/DEV/NET/Tools/` — build tooling (`libz`, `VersionSmith`) — not traced
  further, out of scope for this pass.

Mapping the brief's requested component names onto what's actually there:

| Requested name | What was actually found | Confidence |
|---|---|---|
| `web_api` | `web/DEV/NET/Applications/Reloads/Terminal/Api` (`Fiuu.App.Reloads.Terminal.Api`) — the terminal-facing REST API. A second, smaller API (`web/DEV/NET/Applications/BackOffice/Api`, `Fiuu.App.BackOffice.Api`) also exists, serving the back-office web app. | Medium — "web_api" isn't a name used anywhere in the code; this is the best-fit mapping. See `web-api.md`. |
| `web_app` | `web/DEV/NET/Applications/BackOffice/Web` (`Fiuu.App.BackOffice.Web`) — the only traditional web-forms UI application found (374+ `.aspx` pages). | Medium — see caveat below and in `web-app.md`. |
| `reload_portal` | **No separate codebase found.** The only candidate is the same `BackOffice/Web` app used for `web_app`. | **Low / unresolved** — see `reload-portal.md` for the explicit open question. |
| `terminal_application` | `web/DEV/NET/Applications/Reloads/TerminalServer/Console` (`Fiuu.App.Reloads.TerminalServer.Console`) — a Windows console/service hosting a raw TCP socket server that legacy POS terminal hardware connects to, plus its companion `Reloads/TerminalServer/ControlPanel` WinForms monitor app. | Medium-high — this is a distinct, clearly terminal-hardware-facing app, unlike the REST API. |
| `console_app` | A family of ~12 independent Scheduler/background-job console apps (one per business module — `BackOffice/Scheduler`, `EInvoice/Scheduler`, `EPay/Scheduler`, `Game/Scheduler`, `OnlineTopUp/Scheduler`, `Pinless/Scheduler`, `Reloads/Scheduler`, `Reports/Scheduler`, `Restorify/Scheduler`, `Ticket/Scheduler`) plus standalone one-off tools (`BulkUploadFile`, `SalesDiscrepancy`, `SAP`, `UploadStock`). There is no single "console_app" project — it's a category, not one app. | Medium — see `console-app.md`. |
| `class-library` | `reload/class-library` (the submodule — see §2), **plus** `reload/web/DEV/NET/Components/*` (see §4). The brief's description of `class-library`'s contents (AWSCore, Database, Reloads, Secure, plus prebuilt DLLs) matches the submodule exactly. | High. |

**Open question flagged for follow-up:** the brief expected `web_app` and
`reload_portal` to be two different things. Only one web-forms application
(`BackOffice/Web`) was found in this checkout. Either (a) they're the same app under two
names used by different people/docs, or (b) a genuine second portal exists but isn't
present in this local checkout (wrong branch? not yet migrated into this monorepo?
lives in a repo not present on this machine?). This needs a human answer — don't treat
`reload-portal.md` as authoritative until that's resolved.

## 4. The three-tier "shared library" pattern

This codebase has **three different places** shared/common code can live, and they
overlap in confusing ways. This was reverse-engineered from actual `.csproj`
`ProjectReference`/`Reference`/`HintPath` entries, not assumed:

1. **`reload/web/DEV/NET/Components/*`** — source-level shared projects that live
   *inside* the `reload` repo itself: `CEPP`, `Logging`, `Lookup`, `MasterFramework`,
   `Provider`, `ReloadsPatching`, `UMobile`. Consumed by Applications via
   `<ProjectReference>` (compiled together, same solution) — e.g.
   `Reloads/Terminal/Api` references `..\..\..\..\Components\CEPP\Fiuu.CEPP.csproj`.

2. **`reload/class-library` (submodule)** — a mix of:
   - **source** projects consumed via `<ProjectReference>`: `AWSCore`, `Database`,
     `Reloads/TNG`, `Reloads/Game`, `Secure/Astro`, `Secure/Incomm`, `Secure/Telekom`.
     Example: `MOLReloads/Core/Fiuu.Reloads.csproj` references
     `..\..\..\..\..\..\class-library\Reloads\TNG\Fiuu.Reloads.TNG.csproj`.
   - **prebuilt binaries** sitting at the repo root: `Fiuu.CEPP.dll`, `Fiuu.EInvoice.dll`,
     `Fiuu.Logging.dll`, `Fiuu.Lookup.dll`, `Fiuu.MasterFramework.dll`,
     `Fiuu.Provider.dll`, `Fiuu.Reloads.Pin.dll`, `Fiuu.Reloads.Restorify.dll`,
     `MOL.Notification.Client.dll`. These are consumed via `<Reference><HintPath>`
     pointing straight at `class-library\Fiuu.*.dll` (confirmed: e.g.
     `Components/CEPP/Fiuu.CEPP.csproj` references
     `..\..\..\..\..\class-library\Fiuu.Lookup.dll` directly).
   - **Unresolved:** the *source* for several of these prebuilt DLLs (CEPP, Logging,
     Lookup, MasterFramework, Provider) is **not** in `class-library` — it's in
     `Components/*` (tier 1) or in `Applications/*/Core` for Pin/Restorify/EInvoice/
     Notification (tier 3 below). How the built DLL ends up committed into
     `class-library`'s repo root was **not confirmed** — `class-library/.gitlab-ci.yml`
     only runs a SonarQube-scan template, with no visible build-and-publish job, and
     `class-library/README.md` is unedited GitLab scaffold boilerplate ("This is a
     simple pipeline example…"), not real documentation. Most likely explanation
     (unconfirmed): a developer builds the source project locally and manually commits
     the resulting DLL into `class-library`. Flagged as needs-follow-up.

3. **`reload/web/Libraries/NET/*`** — an older, per-version vendored-DLL drop
   (`Fiuu.Logging.1.1.0/Lib/net40/Fiuu.Logging.dll`,
   `Fiuu.MasterFramework.1.1.0/…`, `Fiuu.Lookup/…`, `MOL.Notification.Client.1.0.0/…`).
   Several apps (e.g. `BackOffice/Web`, `Reloads/Terminal/Api`) reference **these** older
   copies via `HintPath` for `Fiuu.Logging`/`Fiuu.Lookup`/`Fiuu.MasterFramework` instead
   of the `class-library` root DLLs, while simultaneously using `ProjectReference` into
   `class-library`'s `Reloads/TNG`/`Reloads/Game`/`Database` source. **Not every app has
   migrated to referencing `class-library` consistently** — this is a live, only
   partially-completed consolidation, not a clean layering. Treat any claim like "app X
   depends on class-library module Y" as meaning "verified via a specific
   `ProjectReference`/`HintPath` in X's project file," documented per-app in the
   component docs — not as a blanket architectural rule.

## 5. Dead / removed folders (0 tracked files at HEAD)

Several folders under `Applications/` exist on disk with real-looking content (NuGet
`packages/`, `.csproj.user` files, Visual Studio `.vs/` caches, publish profiles) but
have **zero files tracked in `reload`'s git HEAD** (`git ls-tree -r HEAD -- <path>` is
empty), even though `git log -- <path>` shows historical commits touching them. This
means the projects were **removed from the repository at some past commit**, and what
remains locally is leftover build cruft from when a developer last had them checked out
and building (nuget-restored `packages/`, IDE `.user`/`.vs` files — all conventionally
gitignored, so git deleting the tracked source doesn't clean these up).

Confirmed dead (0 tracked files, local-only leftovers):
- `Applications/BackOfficeAPI` (both `Api` and `Core` subfolders)
- `Applications/CEPP` (the old per-module CEPP umbrella — `BackOffice`, `BillPayment`,
  `OnlineTopUp`, `Ticket`, `SAPReporting`, etc. subfolders; **not** the same thing as
  the live `Components/CEPP`, see §4)
- `Applications/PGW`
- `Applications/UMobile` (compare to the live `Components/UMobile`)

**Do not treat these four as real, current applications anywhere else in this
handbook.** Their names resemble live things (`Components/CEPP` vs. dead
`Applications/CEPP`; `Components/UMobile` vs. dead `Applications/UMobile`) — this looks
like the result of a past reorganization that moved surviving code into `Components/`
and per-module `Scheduler` folders under `Applications/`, and deleted the old umbrella
folders, without a corresponding local cleanup.

## 6. `reload_db`

`reload_db/` is a real, independent git repo (remote:
`https://git2u.fiuu.com/server/offline/rds/reload.git`). It is **not** a deployable
application — it's a database change-management repo: `MAINT/<DATABASE_NAME>/` holds
patch/migration SQL scripts per database (`BILL_PAYMENT`, `CEPP`, `CONFIGURATION`,
`DataWarehouse`, `EINVOICE`, `INCOMM`, `INCOMM_TRANS`, `INVENTORY`, `INVENTORY_MASTER`,
`LOGGING`, `MLookUp`, `NOTIFICATION`, `PREPAID`, `REPORTSUMMARY`, `RESTORIFY`,
`RMS_OFFLINE`, `SAP`, `SQLAgentJob`, `TICKET`), plus a couple of `Console/` tools. This
confirms the multi-database SQL Server estate referenced elsewhere (see the
`reload-db-schema` skill / `reload_schema.dbml`). This repo was not traced further in
this pass — application-to-database mapping in the component docs is based on
connection-string *alias names* referenced from application code (see §7), not on
reading `reload_db` itself.

## 7. Database connectivity mechanism (names only, no values)

No `<connectionStrings>` section was found anywhere under `reload/web` (repo-wide
search). Instead, two separate mechanisms were found and confirmed by reading code:

- **SQL Server connections** (`class-library/Database/Helpers/DBConnectionHelper.cs`):
  connection strings are **not** in any config file. At runtime, `DBConnectionHelper`
  looks for a plain text file named `<alias>.txt` (e.g. `RMS_Offline.txt`,
  `LOGGING.txt`, `Notification.txt`) in `d:\db\` or `c:\db\` on the machine the app is
  deployed to, and reads the connection string out of that file's contents. The three
  aliases found in code: `RMS_Offline`, `LOGGING`, `Notification` — corresponding to the
  `RMS_OFFLINE`, `LOGGING`, and `NOTIFICATION` databases in the `reload_db` estate. Data
  access itself goes through Dapper (`class-library/Database/Base/BaseProvider.cs`)
  calling stored procedures.
- **Partner/integration credentials** (AWS Secrets Manager, via
  `class-library/AWSCore`): `AWSCore/Services/SecretsManagerService.cs` wraps the AWS
  Secrets Manager SDK; `AWSCore/Helpers/SecretsHelper.cs` preloads a dictionary of
  secrets for the current app (keyed by an `EventAppName` app setting mapped through
  `AWSCore/Enums/AppUserNames.cs`) using labels of the form `PartnerName#FieldName`
  defined in `AWSCore/Enums/SecretsLabels.cs` (e.g. `TNG`, `InComm`, `Astro`, `Celcom`,
  `Digi`, `DTOne`, `EInvoice`, `EPay`, `JomPay`, etc. — one label-set per partner). This
  is the mechanism for partner API keys/passwords; it is **not** used for the SQL
  Server connection strings above.

No literal connection strings, secrets, or file contents were read or are reproduced
anywhere in this handbook — only the file/label naming mechanism, which is what makes
this checkable later without exposing anything sensitive.

## 8. Git remotes (for reference)

| Repo | Remote |
|---|---|
| `reload` | `https://git2u.fiuu.com/offline-teams/reload.git` |
| `reload_db` | `https://git2u.fiuu.com/server/offline/rds/reload.git` |
| `class-library` (submodule, and the stale top-level clone) | `https://git2u.fiuu.com/offline-teams/rmsreload/class-library.git` |

At the time of this pass, `reload`'s working tree had 3 uncommitted local
modifications (`class-library` submodule pointer, `BackOffice/Web/Web.config`,
`BackOffice/Web/WebForms/ProductEdit.aspx`) — noted for completeness, not treated as
architecturally meaningful since it just reflects whoever's local dev state at the time.

## Related

- [[architecture/reload/01-overview]] — the system-level summary built on top of this trace
- [[architecture/reload/reload-portal]] — the open question this doc flags (§3) about a possible second portal codebase
- [[architecture/reload_db/00-overview]] — the `reload_db` estate referenced in §6
- [[conventions/configuration-and-secrets]] — expands on the connection-string/secrets mechanisms traced in §7
