---
name: reload-coding-conventions
description: Condensed reference for the actual (reverse-engineered, not idealized) coding conventions in the reload/reload_db codebase — naming, layering, error handling, logging, data access, and configuration/secrets patterns — with explicitly flagged inconsistencies and known pitfalls, evidenced with real file:line citations rather than guidelines. Use before writing or reviewing code in reload/class-library or reload_db/MAINT, when deciding which of several coexisting patterns (data-access style, LogHelper, ServiceBase) to follow for a given module, or when you need a specific gotcha (the plaintext connection-string file mechanism, the broken TNGEODException, Hungarian-notation drift, three coexisting data-access styles) before it bites you.
---

# Reload coding conventions (condensed)

Read `fiuu-reload-handbook` (master skill) first. Fiuu has **no documented
coding standard** for this codebase (`CONTRIBUTING.md` in class-library is
generic GitLab boilerplate) — everything below is reverse-engineered from
`reload/class-library` (AWSCore, Database, Reloads/TNG, Reloads/Game,
Secure/Astro, Secure/Incomm) and `reload_db/MAINT` (mainly `TRANSACTION`,
`CEPP`), with real file:line evidence. `web_api`/`web_app`/`reload_portal`/
`terminal_application`/`console_app` were empty in the checkout this was
sampled from (see `fiuu-reload-handbook` correction #1) — claims about how
consuming apps use `class-library` are flagged as speculative where they
occur. Full docs: [`../../conventions/`](../../conventions/), first pass
complete.

## Naming (full: [`naming.md`](../../conventions/naming.md))

- PascalCase types/methods/properties, `I`-prefixed interfaces — consistent,
  no exceptions found.
- Layer suffixes as an architecture signal: `*Provider` (data access),
  `*Service` (business logic), `*Model`/plain noun (DTO), `*Helper` (static
  utility), `*Validator`, `*Exception`.
- **Hungarian notation is inconsistent by module/author, not by era.**
  AWSCore, Game, InComm/Secure use `s`/`i`/`l`/`dt`/`lst`/`b` prefixes on
  locals; TNG and Astro use plain idiomatic C# for the same kind of code
  written around the same time. **Reviewer `khenggek` enforces the prefixed
  style as a hard rule on new code regardless of the surrounding file** (see
  `reload-tribal-knowledge`'s MR checklist A1) — match that expectation for
  new code even in a module that doesn't currently do it.
- DB-lookup foreign keys get an `M` prefix everywhere (`MStatusId`,
  `MTransTypeId`, `MSourceTypeId`) — cross-cutting, not module-local. The
  C# model property sometimes exposes a friendly enum name instead
  (`TransStatus` for `MTransStatusId`); the mapping is manual.
- `*Provider` access modifier (`internal` vs `public`) is inconsistent with
  no discernible rule — don't infer intended visibility from it.
- SQL stored-proc naming: `<Schema>.<Table>_<Verb>[_By_<Columns>]`, verbs
  always `Ins`/`Sel`/`Upd`/`Del` — see SQL conventions below.

## Layering (full: [`layering-and-architecture.md`](../../conventions/layering-and-architecture.md))

Dominant pattern per feature module (`Reloads/<Module>`, `Secure/<Module>`):
**Model / Provider / Service**, three layers, very consistently applied.

- Provider is `new`'d directly by its Service (no DI at that layer).
  Cross-**Service** dependencies go through a service locator
  (`EngineContext.Current.Resolve<T>()`), lazily, via a
  `_field ?? (_field = ...)` idiom repeated by hand in every Service — not
  constructor injection.
- `DependencyRegistrar : IDependencyRegistrar` per module, hand-maintained
  (no convention-based auto-discovery).
- `ServiceBase` exists **three separate times** (AWSCore, Astro, InComm) —
  same name/purpose, independently implemented, not shared.
- InComm alone uses a genuine Template Method pattern
  (`InCommServiceBase` + overridable hooks) — more structured than TNG/Game,
  which use flat Services. Architecture rigor tracks module/author, not a
  house standard.
- No repository/unit-of-work abstraction, no ORM entities anywhere. Each
  Provider method opens a connection, runs one stored procedure, returns.

## Error handling (full: [`error-handling.md`](../../conventions/error-handling.md))

- **Dominant pattern: catch `Exception`, log, return a sentinel/error-code —
  don't rethrow.** Caller sees `-1`/`false`/`null`/an error-code DTO, never
  the exception; it's indistinguishable from "legitimately nothing found"
  without checking the log first.
- **Narrower pattern**: catch `SqlException`, check `.Number` against known
  constraint-violation codes (2601/2627), translate to a business status,
  rethrow everything else. A named enum for these numbers exists
  (`SqlExceptionNumber.cs`) but isn't always used — raw magic numbers are
  sometimes re-inlined in the same module.
- Custom exception types exist but are thin and rarely propagated;
  `APIRequestException` (InComm) is the one genuine example used the way an
  exception should be, carrying a status code through a catch.
- **`TNGEODException` is broken**: its parameterless constructor builds and
  discards a throwaway instance instead of chaining to `this(...)` (a no-op
  bug), and its `Message` override adds nothing over the base. Nothing
  appears to construct it — evidence that custom exception types here
  aren't uniformly battle-tested just because they exist.
- Logging code itself is always wrapped in a silent catch-all — "logging
  must never take down a transaction" — the one place a blanket empty catch
  is clearly deliberate.
- Because the consuming apps' source wasn't present in the sampled
  checkout, how a Service's error-code DTO becomes an HTTP response
  couldn't be traced end-to-end — flagged as open, not assumed.

## Logging (full: [`logging.md`](../../conventions/logging.md))

- Two underlying compiled frameworks (`Fiuu.MasterFramework.Utilities.Logger`
  — rolling file + Windows Event Log; `Fiuu.Logging.LogManager` — structured
  `Log` objects), wrapped by **at least three independently-implemented
  `LogHelper` classes** (TNG, AWSCore, Game) with different method surfaces
  — code that logs in one module can't be lifted into another without
  adapting calls.
- Genuine house convention (recurs across unrelated authors): bracketed
  `[Key: ref] >>>` (outgoing) / `<<<` (incoming) request/response logging
  around outbound HTTP calls, full JSON body via `.ToJson()`, correlated by
  a business reference id. **Nothing redacts fields before logging** — be
  mindful these payloads can carry account numbers/amounts.
- Errors sometimes logged twice on the same path (file log + Windows Event
  Log) — deliberate redundancy, not a bug, but worth knowing when
  triaging.

## Data access (full: [`data-access.md`](../../conventions/data-access.md))

**Everything is stored-procedure-only** — no inline dynamic SQL, no ORM
entity graph, consistent across every module. But **three coexisting
calling patterns**, none deprecated, no comment marking one as
old/replaced:

| Pattern | Where | Mechanism |
|---|---|---|
| 1 (most common) | `Reloads/*`, `Secure/*` | `SqlAccessor.ExecuteProcedure(...)` + `ParameterCollection` (framework wrapper); `DataRow`→model mapping always hand-written via `Conversion.DBNullTo*` helpers |
| 2 | `Fiuu.Database` (`Database/Base/BaseProvider<T>`) | Raw Dapper against a fresh `SqlConnection` per call; subclasses (`RMSOffineProvider<T>`, `LoggingProvider<T>`) just fix the connection string |
| 3 | `Database/Notification/Context.cs` | `Lazy<Context>` singleton, one named method per stored procedure, typed `Query<T>` directly against the domain model |

If adding a new Provider, there's no single template — match whichever
sibling Provider in the same module/database you're extending. No example
anywhere composes multiple writes into one ADO.NET transaction — multi-step
consistency relies on the stored procedure itself being atomic.

## Configuration & secrets (full: [`configuration-and-secrets.md`](../../conventions/configuration-and-secrets.md))

Four coexisting mechanisms, no literal values reproduced anywhere in this
handbook:

1. **`ConfigurationManager.AppSettings`** — oldest, for non-secret settings
   (log paths, app names). `class-library` projects' own `app.config` files
   carry no `<appSettings>` — the real values live in the consuming app.
2. **A `CONFIGURATION` database table** (`ConfigDetails`, `KeyName`/
   `KeyValue`) for business/environment config, fetched via stored
   procedure. Reimplemented per-module rather than shared (a near-identical
   model exists separately under `Database/Models/RMS_OFFLINE/`).
3. **AWS Secrets Manager** for partner credentials — gated by an
   `EventAppName` switch (`SecretsHelper.SecretLabelMapper()`) that decides
   which partner's secret labels the current host process needs, cached
   in-process after first fetch. The AWS access key/secret used to
   *authenticate to* Secrets Manager itself comes from mechanism #2 —
   #2 bootstraps #3.
4. **Plain-text connection-string files on local disk** — `Fiuu.Database`'s
   `DBConnectionHelper` reads `{alias}.txt` (e.g. `RMS_Offline.txt`,
   `LOGGING.txt`) from a hardcoded `d:\db\`/`c:\db\` search path, as raw
   unencrypted text, cached in a static field. **This is the single
   riskiest convention in the codebase to know about**: no fallback beyond
   `FileNotFoundException`, connection string (possibly embedding a SQL
   login) sits unencrypted on local disk, and it assumes a specific
   drive/folder exists on whatever machine the app runs on.

Also visible: a live migration off classic .NET Framework, with
`ServiceBase.GetAppSetting` branching on `Environment.Version.Major >= 8` to
choose between `ConfigurationManager` and hand-parsed `appsettings.json`,
rather than a configuration abstraction hiding the difference.

## Comment style (full: [`comment-style.md`](../../conventions/comment-style.md))

- XML doc comments (`///`) on roughly 1 in 10 `.cs` files — public APIs are
  overwhelmingly undocumented at the member level; names are expected to
  carry meaning.
- SQL stored procedures open with a consistent but shallow SSMS-template
  header (`Author`/`Create date`/`Description`/`Used by`) — the
  `Description:` line is frequently just the table name restated.
- Multi-step/risk-bearing patch scripts get real explanatory comments
  (sequencing, pre/post-conditions); quick one-off patches often don't.
- Inline comments are sparse but load-bearing when present — they explain
  **domain magic numbers and business rules**, not mechanical "what the code
  does." `CardNumberValidator.cs` is the canonical dense example (magic
  numbers like `2000000`, `60146400`, no file-format overview comment even
  with the inline notes it has).

## SQL-side conventions (full: [`sql-conventions.md`](../../conventions/sql-conventions.md))

- One folder per database under `MAINT/`, one subfolder per **object type**
  (`Table/`, `StoredProcedure/`, `Function/`, `Index/`, `Type/`, `Schema/`,
  `Data/`, `DataReference/`, `Trigger/`, `View/`) — consistent across every
  database.
- Partner integrations get their **own SQL schema** (`Celcom`, `ATX`,
  `AnyPay`, ...), not a `dbo`-only design with prefixed table names; generic
  tables stay in `dbo`.
- Proc body style is consistent: `CREATE OR ALTER PROCEDURE` (never
  drop-guarded `CREATE`), leading-comma parameter lists, `SET NOCOUNT ON;`
  first, and **`WITH (NOLOCK)` on every read** — a deliberate
  throughput-over-consistency choice, not an inconsistency; dirty reads are
  possible by design throughout.
- `@@IDENTITY` (not `SCOPE_IDENTITY()`) is used in at least one sampled
  insert proc — can return a trigger-inserted row's id instead of the
  statement's own row if a trigger exists on the table.
- Index naming: `IXU_` (unique) / `IX_` (non-unique) + `<Table>_<Column(s)>`.
- Patch-filename ticket tags and add/alter-column verb spelling both drift
  wildly (`GIT#nnnn`/`GIT-nnnn`/`GIT_nnnn`/`RMSO-nnnn`;
  `AddColumn`/`Add_Column`/`ADDColumn`) — never assume one spelling/format
  covers every patch for a ticket or table; search by bare ticket number
  too. See `reload-db-architecture` for the folder-level patch conventions.

## Known pitfalls checklist (full: [`known-patterns-and-pitfalls.md`](../../conventions/known-patterns-and-pitfalls.md))

Quick-reference before extending this codebase:

- [ ] Don't assume a helper's behavior generalizes across modules —
      `LogHelper`/`ServiceBase` are reimplemented per module.
- [ ] A sentinel return value (`-1`/`false`/`null`) can mean "nothing found"
      **or** "exception swallowed" — check the log first when debugging a
      silent failure.
- [ ] `TNGEODException` is broken (see above) — don't copy its shape.
- [ ] Don't infer a `*Provider`'s intended encapsulation from
      `internal`/`public` — it's per-author habit.
- [ ] Connection strings live in a plaintext local file, not config — see
      configuration/secrets above.
- [ ] Three data-access styles coexist; pick based on the sibling Provider
      you're extending, not "the newest one."
- [ ] Ticket-tag and verb spelling drift in SQL filenames — search broadly.
- [ ] `NOLOCK` is universal and deliberate on reads — don't rely on
      read-after-write consistency across connections/procedures.
- [ ] Check for `Environment.Version.Major >= 8` branching before assuming a
      class only supports classic `.config`.
- [ ] Check for triggers before trusting an `@@IDENTITY`-returning proc.
- [ ] `CardNumberValidator`-style dense validators are high-risk to touch
      without reconstructing the underlying file-format contract first.
- [ ] `web_api`/`web_app`/`reload_portal`/`terminal_application`/
      `console_app` were empty in the checkout these conventions were
      sampled from — claims about how the consuming apps use `class-library`
      are inference, not verified, until a populated checkout confirms them
      (partially superseded by `reload-architecture`'s topology pass, which
      did find real content under `reload/web/DEV/NET/Applications/` — but
      the *conventions* docs themselves weren't re-sampled against that
      newer finding).

## Staleness

First sampling pass complete, dated against the same 2026-09-05 checkout as
the architecture docs. Naming/error-handling/logging/data-access examples
are drawn from `class-library`; SQL conventions from `reload_db/MAINT`
(`TRANSACTION`, `CEPP`). Re-sample a module directly before asserting a
convention holds somewhere not explicitly cited above.
