---
tags: [gitlab-analysis, repo/reload_db]
aliases: ["reload_db MR Review Checklist"]
---

# `reload_db` — MR Review Checklist

Derived from what reviewers **actually** flagged, repeatedly, across a
discussion-weighted sample of `reload_db` (`server/offline/rds/reload`)
merge requests — not from the official template's checklist, which is
mostly generic ("I have performed a self-review...", per
`gitlab-reload-mrs` §6.2). See `reload_db-tribal-knowledge.md` for the
project-path note and pull-coverage caveats; the same caveats apply here.

One reviewer, **`@khenggek`**, personally left the large majority of the
substantive (non-"updated"/non-system) comments across the highest-
discussion MRs sampled here (!425, !759, !921, !924, !1074, !1628, !1649,
and the incident MR !93) — consistent with `gitlab-reload-mrs` §9's
documented convention that `@Khenggek` is the fixed reviewer assignment.
The patterns below are effectively "what @khenggek checks for," reverse-
engineered from his own comments.

## 1. Query correctness & performance — the most repeated category

- **`WITH (NOLOCK)` hints on read queries against high-traffic tables.**
  Flagged repeatedly and independently across unrelated MRs (!759, !1074,
  !222 — "missing nolock" ×2 in one MR alone). If a new/changed
  `SELECT`-heavy stored procedure reads from a busy table and doesn't have
  it, expect this comment.
- **`LEFT JOIN` where the actual semantics require `INNER JOIN`.**
  Recurring exact phrasing: *"Use INNER JOIN instead"* (incident MR !93,
  reviewer `khenggek`); *"Cannot left join instead? Please compare the
  performance"* (!1628). If a join's right-hand side is filtered on in the
  `WHERE` clause (making the outer join pointless) or the relationship is
  actually mandatory, expect pushback toward `INNER JOIN`.
- **`DISTINCT` used to paper over a join problem.** *"What is the reason
  to add distinct? If there is duplicate records, by right is due to
  insufficient joining condition. You will need to check and resolve, not
  by using distinct."* (!427). A `DISTINCT` added to make row counts look
  right, without explaining *why* duplicates exist, will get questioned.
- **Filter placement — filter at the join/source, not in an outer wrapper
  query.** *"You should direct filter by active and approved directly...
  at main query"* / *"Please filter for active and approved for all the
  tables that you are using... if the table has mstatusid/mworkflowstatusid,
  please filter them"* (!427). Status/workflow filters (`MStatusId`,
  `MWorkflowStatusId`) are expected on every joined table that has them,
  applied where the join happens, not bolted on afterward.
- **ID vs. Name lookup mismatches.** *"How come check against
  'ServiceProviderName' but you are adding 'ServiceProviderId'?"* / *"Code
  is 30 but name is 35?"* (!759). When mapping a new provider's lookup
  codes, double-check the ID and the display Name actually correspond to
  the same row — this specific class of typo recurs whenever a new service
  provider/product is being onboarded into `CEPP`.
- **Prefer INNER JOIN over multiple repeated subqueries against the same
  table; consider a temp table for repeated cross-referencing** (MR !93,
  the incident's own follow-up report query — *"Try put main table query
  results into temp table and query from the temp table instead of
  querying multiple times from the main table for different service
  provider and compare performance result"*). When asked to justify a join
  strategy change, be ready to produce a **before/after timing table**
  (row count, duration before, duration after) — this is exactly what was
  produced and accepted in !1628 (`BillPaymentBillerReport_Ins`: 15s → 3s,
  `-80%`).

## 2. File & script hygiene

- **File path must match the actual object type's folder** (e.g. an index
  script belongs in `Index/`, not wherever it was dropped) — flagged in
  !222.
- **File extension and exact filename must be correct** — `.sql` missing,
  or a filename in the description not matching the actual committed file
  (an `s` missing from a filename, per !425) will get caught before merge.
- **The `GIT#nnnn` embedded in a script's filename must match the actual
  issue being worked, not a different, nearby issue number** — *"Why is
  this script file name for GIT-870? Not GIT#862?"* (!924). Copy-pasting a
  patch script from a related MR and forgetting to rename it is a real,
  recurring mistake.
- **Environment-scoped files need an unambiguous suffix** — *"These are
  using production data id for patching? The file name should have
  `_Production` etc to indicate is for production db only. You should also
  need to have similar patching file for Dev/QA db"* (!921). A script that
  is implicitly production-only but not named as such will be flagged, and
  the reviewer will also ask where its DEV/QA counterpart is.
- **Explicit execution-order numbering on multi-script patches** — *"Your
  scripts no need numbering to define the order of execution for the same
  table? Kindly check carefully and plan according as it would be executed
  in production"* (!1649); confirmed convention: *"The scripts already in
  a numbered folder following DBA Deployment Kit"* is an accepted answer.
  Multiple scripts touching the same object need numeric prefixes
  (`1.`, `2.`, `3....`) establishing execution order, mirrored in the
  MR description's own script list.
- **Don't delete pre-existing comments inside a SQL script** — *"You
  should not delete old comments. It is a logging."* (!1074). Historical
  comments in a stored procedure/script are treated as an audit trail.
- **Descriptive stored-procedure/object names, not abbreviations** —
  *"Please use full name. It is not obvious SP is meant for what. Why so
  conservative with the name?"* (!1628).

## 3. Structural/DDL safety on live tables

- **Renaming/altering an existing table's structure must preserve the
  final name, constraints, and indexes exactly as before** — *"Kindly
  ensure end result of the table (name, constraints, indexes) remain as
  existing. You should rename the existing table/constraints etc to a
  different name instead."* (!1649). The accepted pattern is: create the
  new table → create its indexes → rename tables to swap → (optionally)
  rename the old table out of the way — never alter the live object's
  identity in place. See tribal-knowledge doc's bigint-migration writeup
  for the full multi-database example.
- **Default constraints block naive column drops** — a drop-column script
  failed in SIT because of an undetected default constraint on the target
  column, requiring a DBA to manually intervene and re-run (!924). If a
  patch drops or alters a column, check for a default constraint on it
  first (`sys.default_constraints`) rather than assuming the column drops
  cleanly.
- **Destructive DDL (drop column, etc.) gets its own MR, deployed in a
  later release, not bundled into the feature/patch MR** — deliberate
  pattern seen in GIT#441 (see tribal-knowledge doc §3).

## 4. Deployment-note discipline

- **"Deployment Notes" is present in 86% of all MRs sampled** — treat its
  absence as unusual, not the default. Even "Not available" (used
  routinely on simple `Patch Request` MRs) is the expected explicit value
  when there's genuinely nothing to call out — don't leave the section
  blank.
- **Any file that must *not* run in a given environment needs to be named
  explicitly in Deployment Notes**, not just implied by its filename
  suffix — the two are meant to reinforce each other (dozens of MRs do
  both, e.g. !551, !1167).
- **A DDL change expected to lock a busy table gets an explicit
  `DOWNTIME NEEDED` marker in the MR title**, plus a `Scheduled Release
  Date` in the description with an accompanying "DO NOT merge to
  Production until release date" note (!1649, !1664, !1806, !1807). If a
  change will require an exclusive lock or a long-running rebuild on a
  live table, flag it this way rather than letting it ship in an ordinary
  release batch.

## What a good "risk analysis" looks like in practice (not the official template)

`reload_db` ships a formally rigorous **`Merge Request.md`** template with
a quantified `Risk Score = Asset Value × Impact × Likelihood` section (see
`gitlab-reload-mrs` §6.2). Checking the full MR corpus: **essentially no
real MR in this repo's history fills it out.** Searching all 1,835 MR
descriptions for `Risk Analysis`/`Risk Score`/`Asset Value` matches
exactly one MR — the one that originally *added* the template file itself
(!2). Zero MRs use the quantified scoring in practice.

What actually substitutes for a risk analysis, and shows up consistently
instead:

1. **A `Total = N` record-impact count** on every patch-style MR (present
   on 564 of 1,835 MRs, ~31%) — the de facto "how much does this touch"
   signal, taken from the simpler `Patch Request.md` template rather than
   the risk-scored one.
2. **A per-database, per-object-type script inventory with counts**, e.g.
   `Database: BILL_PAYMENT [5]` → `StoredProcedure [5]` → the 5 files
   listed — used on every consolidated `main`/release MR (!941, !1183,
   !1706, etc.). This is the practical stand-in for "list all the web
   page, functions or features that involve in this MR" from the official
   template's Asset Value prompt — except scoped to DB objects, which is
   what this repo actually controls.
3. **A paired `..._Verify.sql` script** proving the patch's effect can be
   checked mechanically post-deployment (97% of one-off patches do this —
   see tribal-knowledge doc). This is the closest real analogue to a
   documented mitigation for "what if this patch is wrong."
4. **Explicit environment-scoping and a `DOWNTIME NEEDED` /
   `Scheduled Release Date` flag** in place of a qualitative Impact/
   Likelihood narrative — the real signal for "this is risky" in this repo
   is operational (which environments, how much downtime, when) rather
   than a written likelihood/impact judgment.
5. **Execution logs attached as evidence**, not just claimed — e.g. !736's
   review thread has actual `Checklog_*.txt`/`ErrorLog_*.txt` files
   attached per verification step, with timing per step, before the
   reviewer signs off. For a patch touching production data, attaching the
   actual execution/verification log (not just "ran successfully") is the
   real bar being applied, even though no template field asks for it.

**Recommended checklist for a genuinely risky `reload_db` MR** (schema
change, cross-DB touch, or anything the author suspects deserves the
formal template): fill in the official Risk Analysis section *if* it's a
schema/logic change (not a one-off data patch — use `Patch Request.md` for
those per `gitlab-reload-mrs` §6.1), **and** additionally provide, because
these are what reviewers actually check regardless of which template was
used:

- [ ] `Total = N` (or per-database `[N]` counts) so the blast radius is a
      number, not a description.
- [ ] Every script named with an unambiguous environment scope, and every
      production-only file called out by name in Deployment Notes.
- [ ] A paired verification script for every patch/data script.
- [ ] If altering a live/high-traffic table's structure: the swap-table
      pattern (§3 above), not an in-place `ALTER`, and explicit
      before/after confirmation that name/constraints/indexes match.
- [ ] If the change can lock a busy table or needs a maintenance window:
      `DOWNTIME NEEDED` in the title + a `Scheduled Release Date` +
      "do not merge to Production before this date."
- [ ] If a join/query strategy changed for performance reasons: a
      before/after timing comparison, not just an assertion that it's
      faster.

## Related

- [[gitlab-analysis/reload_db-tribal-knowledge]] — the bigint migration (§2) and GIT#441 saga (§3) these review patterns come from
- [[architecture/reload_db/patch-script-conventions]] — the file-naming/numbering conventions behind §2's findings
- [[conventions/sql-conventions]] — `NOLOCK`, stored-procedure naming, and other DB-side conventions referenced throughout
