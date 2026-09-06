# Known Patterns & Pitfalls

Recurring smells and tech-debt shapes worth knowing about before you go
digging in this codebase. Framed descriptively — these are things to watch
for, not indictments; a lot of this is exactly what you'd expect from a
production fintech codebase that's been extended by many hands over many
years without a documented standard.

## 1. Per-module reinvention of the same plumbing

`LogHelper`, `ServiceBase`, and the Model/Provider/Service triad are each
reimplemented independently per module (TNG, Game, AWSCore, Astro, InComm)
rather than shared from one place. Three unrelated `LogHelper` classes
(`Reloads/TNG/Helpers/LogHelper.cs`, `AWSCore/Helpers/LogHelper.cs`,
`Reloads/Game/Helpers/LogHelper.cs`) have different method signatures for
conceptually the same job — see `logging.md`. Three unrelated `ServiceBase`
classes exist for the same reason — see `layering-and-architecture.md`. If
you're extending one module, don't assume a helper's behavior generalizes to
another module; check the module-local copy.

## 2. Errors swallowed into sentinel values, not surfaced

The default error-handling shape (`error-handling.md`) is catch-log-return a
safe default. This means a `-1` id, a `false`, or a `null` can mean either
"legitimately nothing found" or "an exception was thrown and swallowed" —
the two are indistinguishable to the caller without checking the log. When
debugging a "why did this silently not work" report, checking the relevant
`LogHelper`/event log output first is usually the fastest path, since the
return value alone won't tell you.

## 3. Broken/dead code that shipped anyway

`TNGEODException`'s parameterless constructor doesn't actually chain to the
parameterized one (it builds and discards a throwaway instance instead of
`this(...)`), and its `Message` override is a no-op that never surfaces the
three fields it stores (`Reloads/TNG/Exceptions/TNGEODException.cs`). Nothing
appears to construct this exception anywhere sampled, which is probably why
the bug was never noticed — worth treating as a signal that custom exception
types in this codebase are not uniformly battle-tested just because they
exist.

## 4. Hungarian notation and idiomatic C# coexist, by author/module, not by era

`sMessage`/`iId`/`dtDate`/`lstXxx`-style naming shows up in AWSCore, Game, and
InComm; TNG and Astro use plain idiomatic naming for the same kind of code
written around the same time. This isn't a legacy-vs-modern split — it's
purely who wrote which module. See `naming.md`.

## 5. Connection strings on local disk, not in config

`Fiuu.Database.Helpers.DBConnectionHelper` resolves connection strings by
reading a plaintext file named `{alias}.txt` from a hardcoded list of local
paths (`d:\db`, `c:\db`) rather than through `web.config`/`app.config`
`<connectionStrings>` or a secrets manager. This is a real operational
dependency: a machine missing that file/drive throws
`FileNotFoundException` at first use, and the string sits unencrypted on
local disk. See `configuration-and-secrets.md`.

## 6. Three parallel data-access styles, all valid, none deprecated

`SqlAccessor`+`ParameterCollection` (framework wrapper), `BaseProvider<T>`
(generic Dapper), and `Context` (Dapper singleton, one method per proc) all
coexist in `class-library` with no comment anywhere marking one as
old/replaced. If you're adding a new Provider, there's no single template to
copy — pick based on which sibling Provider in the same module/database you're
extending. See `data-access.md`.

## 7. Ticket-reference formatting on SQL filenames has at least five spellings

`RMSO-nnn`, `GIT-nnn`, `GIT_nnn`, `GITnnnn`, `GIT#nnnn` — sometimes multiple
spellings for the *same* ticket across sibling files in the same patch (e.g.
`TRANSACTION/Data/GIT#1857/...` next to `TRANSACTION/Table/GIT1857/...`).
Don't assume you can `grep` for one format and find every patch related to a
ticket — search for the bare number too. See `sql-conventions.md`.

## 8. Column/verb spelling drift in patch filenames

`ADDColumn`, `AddColumn`, `Add_Column`, `ALTERColumn`, `AlterColumn`,
`ALTER_Column` all appear for the same two operations within one database's
`Table/` folder. Same caveat as above for searching — don't rely on one
spelling when auditing what's already been patched on a table.

## 9. `internal` vs `public` on architecturally-identical Provider classes

No discernible rule decides whether a given `*Provider` class is `internal`
or `public` — it appears to be per-author habit rather than an intentional
encapsulation boundary. Don't infer "this Provider is meant to be used
outside its Service" from its access modifier alone; check who actually
references it.

## 10. `NOLOCK` on every read query

Every sampled `Sel`/read stored procedure uses `WITH (NOLOCK)` unconditionally.
This is a deliberate, consistent choice (not an inconsistency), but it's a
real trade-off — dirty reads are possible by design throughout this system.
Worth knowing before you rely on read-after-write consistency from a
different connection/procedure than the one that wrote the row.

## 11. Mid-migration off classic .NET Framework, visible as runtime version-sniffing

`AWSCore.Services.ServiceBase.GetAppSetting` branches on
`Environment.Version.Major >= 8` to decide between `ConfigurationManager`
and hand-parsing `appsettings.json`, rather than using a configuration
abstraction that would hide the difference
(`AWSCore/Services/ServiceBase.cs:25-41`). If you're touching code that reads
config, check whether it's already been "ported" this way or still assumes
classic `.config` files only — the two styles currently coexist in the same
class.

## 12. `@@IDENTITY` used instead of `SCOPE_IDENTITY()`

`Celcom.Transactions_Ins.sql` (and likely other similarly-templated insert
procedures) returns the new row's id via `SELECT @@IDENTITY`, which can
return an id from a trigger-fired insert rather than the statement's own
insert if a trigger exists on the table. Worth checking for triggers before
trusting `@@IDENTITY`-returning procedures blindly if you ever add one to a
table that didn't have it before.

## 13. Dense, under-commented business logic in validators

`CardNumberValidator.IsValid` (`Reloads/TNG/Validators/CardNumberValidator.cs`)
encodes a blacklist bitmap lookup scheme with several magic numbers
(`60146400`, `2000000`, fixed 250000-byte reads) and only sparse inline
comments explaining *why*, no overview of the file format as a whole, and no
visible unit tests. Treat changes to this class as high-risk without first
reconstructing the file-format contract from wherever the blacklist files
themselves are documented (not in this repo).

## 14. Empty consuming-application directories in this checkout

`web_api`, `web_app`, `reload_portal`, `terminal_application`, and
`console_app` are present as directories but contain no files in this
checkout. Everything in this handbook's `conventions/` set is derived from
`class-library` and `reload_db/MAINT` only — how the shared library's
Service layer actually gets consumed (controller conventions, DI wiring at
the host level, API response shaping, HTTP-level error handling) could not be
verified and should be treated as an open question until a populated
checkout of those repos is available.
