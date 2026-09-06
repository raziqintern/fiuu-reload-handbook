# `reload_portal` — open question, not resolved

## Status: unresolved, needs a human answer

The brief asked for this to be documented as a distinct component from `web_app`.
After searching the entire `reload` repo (the only place any application code
actually lives — see [`00-topology.md`](00-topology.md) §1), **no second web-forms /
web-UI application was found.** The only candidate is `BackOffice/Web`, which is
already documented as the answer for `web_app` in [`web-app.md`](web-app.md).

What was checked:
- `find reload/web/DEV/NET/Applications -iname "*portal*"` — the only hits are two
  model classes (`Reloads/Terminal/Api/Models/Portal/PortalPinlessCheckAvailabilityResponse.cs`,
  `PortalStockCheckVoidedStatusResponse.cs`) — these are just response DTOs named
  "Portal" inside the Terminal API, not a separate application.
- `grep -ri "reload_portal\|ReloadPortal"` across `Applications/` — no matches.
- Every `Applications/*` subfolder was enumerated (see the table in
  [`00-topology.md`](00-topology.md) §3) — `EPay`, `OnlineTopUp`, `MOLReloads`, etc. each
  contain only `Scheduler`/`Api`/`Core` console-or-API projects, no additional WebForms
  or MVC UI project besides `BackOffice/Web`.
- The top-level `reload_portal/` sibling folder (outside the `reload` repo) is
  confirmed empty — see [`00-topology.md`](00-topology.md) §1.

## Possible explanations (not verified — pick one with the team)

1. **Same thing, two names.** "reload_portal" and "web_app" both refer to
   `BackOffice/Web`, and the naming difference is just how different people/docs refer
   to the same deployable (e.g. internal team calls it "the portal," ops/infra calls it
   "web_app"). If so, this file should be merged into or made an alias of
   `web-app.md`.
2. **Doesn't exist yet here.** A genuinely separate merchant/dealer self-service portal
   (as opposed to the internal-admin-flavored `BackOffice/Web`) exists in a different
   repo, branch, or hasn't been migrated into this monorepo yet.
3. **Planning artifact.** The empty top-level `reload_portal/` folder (like the other
   six empty siblings) may just be a placeholder created for this handbook's own
   scaffold or a future reorg, not evidence a real "reload_portal" codebase exists
   anywhere yet.

**Recommendation:** confirm with the team which of the three is true before writing
anything more specific here. Until then, treat any reference to "the reload portal"
elsewhere in this handbook as meaning `BackOffice/Web` (documented in
[`web-app.md`](web-app.md)), with this ambiguity flagged.
