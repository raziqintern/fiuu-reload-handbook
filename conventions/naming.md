# Naming Conventions

Reverse-engineered from `class-library` (AWSCore, Database, Reloads, Secure) and
`reload_db/MAINT`. No naming guide exists anywhere in the repo, so this is what's
actually there — including where it contradicts itself.

## Classes, interfaces, methods, properties

Standard .NET PascalCase for types, public methods, and properties is followed
consistently everywhere sampled:

```csharp
// reload/class-library/Reloads/TNG/Services/TerminalService.cs:8
public class TerminalService : ITerminalService
{
    private TerminalProvider _provider;
    public bool Login(Auth auth) { ... }
```

Interfaces are consistently `I`-prefixed (`ITerminalService`, `IAccountService`,
`IGameProvider`, `IBillPaymentService`) — no exceptions found.

Layer suffixes are consistent and used as a de facto architecture signal:
`*Provider` (data access), `*Service` (business logic), `*Model`/plain noun
(DTOs), `*Helper` (static utility bag), `*Validator` (input validation),
`*Exception` (custom exceptions). See `layering-and-architecture.md`.

## Local variables and parameters — Hungarian notation is inconsistent across modules

This is the single biggest naming inconsistency in the codebase. Some modules
(AWSCore, Game, InComm/Secure) use old-school Hungarian-style prefixes
(`s` = string, `i`/`l` = int/long, `dt` = DateTime, `lst` = List, `b` = bool)
on locals and parameters:

```csharp
// reload/class-library/AWSCore/Helpers/LogHelper.cs:39
string sLogFilePath = GetAvailableFileName(string.Format("{0}_{1}", sAppName, DateTime.Now.ToString("yyyyMMdd")));

// reload/class-library/Reloads/Game/Providers/GameProvider.cs:48
public bool UpdateGameSalesTransactionStatus(string sReferenceId, string sStatus, string sReceiptNo, DateTime? dtTransactionDateTime)
```

Other modules (TNG, Astro) use plain idiomatic C# naming with no prefixes for
the same kind of code:

```csharp
// reload/class-library/Reloads/TNG/Providers/TerminalProvider.cs:60
public TerminalSummary GetTerminalSummaryByTransNo(string transNo)

// reload/class-library/Secure/Astro/Providers/RpnProvider.cs:31
public AccountVerificationResponse CheckAccountExists(RpnConfig config, string accountNo)
```

This tracks by module/author, not by age or layer — TNG and InComm/Secure are
both "Secure"/`Reloads` peers, one uses Hungarian notation heavily, the other
doesn't at all. Treat this as author-driven, not a deliberate architectural
distinction.

## Filename vs. class name casing mismatches

Acronym casing drifts between the file name and the class it contains:

```
reload/class-library/Reloads/TNG/Helpers/FTPHelper.cs:13
    internal class FtpHelper   // file says FTP, class says Ftp
```

## Database-lookup foreign keys: the `M` prefix

Any column that's a foreign key into a lookup/master/status table is prefixed
`M` (for "Master") in both C# models and SQL, regardless of module:

```csharp
// reload/class-library/Reloads/TNG/Models/TerminalActivity.cs:14
public TransType TransType { get; set; }
public TransStatus TransStatus { get; set; }
...
// but the raw DB-facing param name in the Provider is the M-prefixed form:
// reload/class-library/Reloads/TNG/Providers/TerminalProvider.cs:20-21
param.Add("@MTransTypeId", DbType.Int32, activity.TransType);
param.Add("@MTransStatusId", DbType.Int32, activity.TransStatus);
```

```csharp
// reload/class-library/Reloads/TNG/Models/CommissionRate.cs:29
public EnumStatus MStatusId { get; set; }
```

Seen across unrelated modules (`MServiceTypeId`, `MSourceTypeId`,
`MDeliveryStatusId`, `MRequestStageId`), so this is a genuine cross-cutting
convention, not module-local. Note the model property itself sometimes drops
the `M` and exposes a friendly enum name (`TransStatus`) while the DB
parameter/column keeps `MTransStatusId` — the mapping is manual, done by hand
in the `Get*Model(DataRow dr)` methods (see `data-access.md`).

## Stored procedure naming (see `sql-conventions.md` for full detail)

C# code references stored procedures through generated/constant name holders
like `Fiuu.Provider.Database.TNG.StoredProcedures.TerminalActivities_Ins`,
mirroring the actual SQL object name `<Schema>.<Table>_<Verb>[_By_<Columns>]`,
e.g. `Celcom.Transactions_Sel_By_ServiceTypeId_ReferenceId`
(`reload_db/MAINT/TRANSACTION/StoredProcedure/Celcom.Transactions_Sel_By_ServiceTypeId_ReferenceId.sql`).
Verbs are always abbreviated: `Ins`, `Sel`, `Upd`, `Del`.

## Access modifiers on Provider classes are inconsistent

Some `*Provider` classes are `internal` (`AccountProvider`, `RpnProvider`,
`TransactionProvider`), others are `public` (`TerminalProvider`,
`GameProvider`) for what is architecturally the same role (a data-access class
never meant to be consumed outside its owning Service). No pattern by module
or by age was found — appears to be per-author habit.

```csharp
// reload/class-library/Reloads/TNG/Providers/AccountProvider.cs:8
internal class AccountProvider
// reload/class-library/Reloads/TNG/Providers/TerminalProvider.cs:10
public class TerminalProvider
```

## Ticket-reference suffixes on SQL filenames (see `sql-conventions.md`)

`RMSO-nnn`, `GIT#nnnn`, `GITnnnn`, `GIT_nnnn` all appear as the ticket-tag
suffix convention on patch script filenames, with no single format winning out.
