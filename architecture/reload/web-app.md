---
tags: [reload/architecture]
---

# `web_app` → `BackOffice/Web`

See [`00-topology.md`](00-topology.md) §3 — no folder is literally named `web_app`. The
only traditional web-forms UI application found anywhere in this checkout is
`BackOffice/Web`, so that's what this doc covers. See
[`reload-portal.md`](reload-portal.md) for the open question of whether this is also
what "reload_portal" refers to.

## What it is

- **Path:** `reload/web/DEV/NET/Applications/BackOffice/Web`
- **Project:** `Fiuu.App.BackOffice.Web.vbproj` / `.sln`
- **Type:** ASP.NET Web Forms, **VB.NET**, .NET Framework
- **Scale:** 1,346 tracked files under this path (by far the largest single application
  in the repo) — 374+ files directly under `WebForms/` alone.
- **Purpose:** the internal back-office administration portal — dealer, store,
  terminal, product, commission, and wallet management for the reload business, used
  by Fiuu staff and/or dealers (not confirmed which; the presence of both an
  `AspNetSqlMembershipProvider`/`SqlRoleProvider` config and BotDetect CAPTCHA handlers
  suggests it's exposed to external logins, not purely intranet-only, but this wasn't
  confirmed further).

## Entry points

- `Global.asax` / `Global.asax.vb` — application startup.
- `Default.aspx` — landing page.
- `WebForms/*.aspx(.vb)` — the bulk of the UI (hundreds of pages; not enumerated
  individually in this pass — e.g. `ProductEdit.aspx` was seen as one of the few files
  with uncommitted local changes at the time of this trace).
- `BackOffice.Master` — the shared master page/layout.
- `Helpers/` (`BackofficeExtension.vb`, `ConverterHelper.vb`, `HelperFunction.vb`,
  `Lookup.vb`) — page-level utility code.

## Dependencies (confirmed via `.vbproj`)

- `HintPath` (legacy `Libraries/NET`) → `Fiuu.Logging.1.1.0`, `Fiuu.Lookup`,
  `Fiuu.MasterFramework.1.1.0`.
- `ProjectReference` → `Components/CEPP/Fiuu.CEPP.csproj` and
  `Components/CEPP/Payment/BillPayment/Fiuu.Reloads.BillPayment.csproj`.
- `ProjectReference` → `Components/Lookup/Fiuu.Lookup.csproj`.
- `ProjectReference` → `Components/ReloadsPatching/Fiuu.Patching.csproj`.
- ASP.NET membership/role providers configured against a connection string named
  `ApplicationServices` (`AspNetSqlMembershipProvider`, `AspNetSqlProfileProvider`,
  `AspNetSqlRoleProvider` in `Web.config`) — this is the standard ASP.NET membership
  schema, a **separate** connection-string name from the `RMS_Offline`/`LOGGING`/
  `Notification` file-based aliases used elsewhere (see
  [`00-topology.md`](00-topology.md) §7). Where `ApplicationServices` itself is
  configured was **not found** as a literal `<connectionStrings>` entry in
  `Web.config` — likely supplied by a config transform or machine-level config not
  present in this checkout. Flagged as unknown.
- No direct `ProjectReference`/`HintPath` to `class-library`'s `Database` or `AWSCore`
  projects was found in this `.vbproj` itself — any dependency on those is **transitive**
  through `Components/CEPP` (which does depend on `class-library` — see
  [`class-library/cepp.md`](class-library/cepp.md)).

## What it does NOT appear to be

This is a WebForms admin console, not a customer-facing storefront. No shopping-cart
or public checkout code was found under this path. If a consumer-facing "reload
online top-up" web page exists, it wasn't found in this checkout —
`Applications/OnlineTopUp/` only contains a `Scheduler` (background job) component, no
web front-end (confirmed via `git ls-tree`, see
[`00-topology.md`](00-topology.md) §3 table). Flagged as a gap, not a confirmed
absence of such a page somewhere else.

## Databases / external systems touched

- `RMS_OFFLINE` (transitively, via `Components/CEPP` → `class-library/Database`).
- ASP.NET membership schema via the `ApplicationServices` connection string name
  (identity of the target database not confirmed — see above).
- No direct partner integration code was found in this project itself; any partner
  calls it triggers would go through `Components/CEPP` service classes, same as the
  API (see [`web-api.md`](web-api.md)).

## Related

- [[architecture/reload/reload-portal]] — the open question of whether "reload_portal" refers to this same app
- [[architecture/reload/class-library/cepp]] — the domain layer this portal's dealer/store/terminal admin pages sit on top of
- [[architecture/reload/class-library/lookup]] — the direct source-level `Fiuu.Lookup` dependency confirmed above
- [[gitlab-analysis/reload-tribal-knowledge]] — the validator-scope bugs (§2.1, §2.2) specific to this WebForms portal
