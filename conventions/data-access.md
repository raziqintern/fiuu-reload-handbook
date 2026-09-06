---
tags: [conventions]
---

# Data Access

Three distinct data-access patterns coexist in `class-library`, all stored-procedure-only
(no inline ad hoc SQL text, no LINQ-to-SQL/EF entity mapping, no query builder)
— but the plumbing to call those procedures differs by module/era.

## Pattern 1 (most common in `Reloads/*` and `Secure/*`): `SqlAccessor` + `ParameterCollection`

A custom framework wrapper (`Fiuu.MasterFramework.Database`, compiled
dependency, no source in this repo) around ADO.NET. Callers build a
`ParameterCollection`, call `SqlAccessor.ExecuteProcedure(returnType, dbAlias,
procName, param)`, and get back a `SqlResult` with helpers
(`.IsEmptyRecord`, `.TableAdapter.DataTable`, `.GetParameterValue<T>()`,
`.ScalarResult`, `.AffectedRecords`).

```csharp
// reload/class-library/Reloads/TNG/Providers/TerminalProvider.cs:12-33
public bool Insert(TerminalActivity activity)
{
    var param = new ParameterCollection();
    param.Add("@TerminalId", DbType.AnsiStringFixedLength, 8, activity.TerminalId);
    ...
    SqlAccessor.ExecuteProcedure(ReturnType.NonQuery, Fiuu.Provider.Database.TNG.Alias,
                                 Fiuu.Provider.Database.TNG.StoredProcedures.TerminalActivities_Ins, param);
    return true;
}
```

Output parameters are pulled back the same way:

```csharp
// reload/class-library/Reloads/TNG/Providers/TerminalProvider.cs:50-56
param.AddOutput("@Id", DbType.Int64, 8);
var result = SqlAccessor.ExecuteProcedure(ReturnType.NonQuery, ..., param);
summary.Id = result.GetParameterValue<long>("@Id");
```

Mapping a `DataRow` back to a model is always done by hand, field by field,
via a shared `Conversion.DBNullTo*` helper family (`DBNullToInt32`,
`DBNullToString`, `DBNullToDateTime`, `DBNullToDecimal`,
`DBNullToNullableDecimal`, ...) — never a generic/reflection-based mapper:

```csharp
// reload/class-library/Reloads/TNG/Providers/AccountProvider.cs:67-81
private static Account GetAccountModel(DataRow dr)
{
    return new Account
    {
        Id = Conversion.DBNullToInt32(dr["Id"]),
        Name = Conversion.DBNullToString(dr["Name"]),
        Status = (Status)Conversion.DBNullToInt32(dr["MStatusId"]),
        ...
    };
}
```

Databases and stored procedures are referenced through generated-looking
constant holders (`Fiuu.Provider.Database.TNG.Alias`,
`Fiuu.Provider.Database.TNG.StoredProcedures.Accounts_Sel_By_Id`) rather than
magic strings — this part is consistently typed across modules.

## Pattern 2 (the `Database` project): generic `BaseProvider<T>` over raw Dapper

`Fiuu.Database`'s own base classes skip `SqlAccessor` entirely and use Dapper
directly against a `SqlConnection` opened per call:

```csharp
// reload/class-library/Database/Base/BaseProvider.cs:10-29
public class BaseProvider<T>
{
    private string ConnectionString { get; set; }
    public BaseProvider(string _connectionString) { ConnectionString = _connectionString; }

    public T GetSingle(string spName, DynamicParameters parameters)
    {
        using (var connection = new SqlConnection(ConnectionString))
        {
            connection.Open();
            return connection.Query<T>(spName, param: parameters, commandType: CommandType.StoredProcedure).FirstOrDefault();
        }
    }
```

Database-specific subclasses just fix the connection string:

```csharp
// reload/class-library/Database/Base/LoggingProvider.cs:10-16
public class LoggingProvider<T> : BaseProvider<T>
{
    public LoggingProvider() : base(DBConnectionHelper.GetLOGGINGConnectionString()) { }
}
// reload/class-library/Database/Base/RMSOffineProvider.cs:9-15
public class RMSOffineProvider<T> : BaseProvider<T>
{
    public RMSOffineProvider() : base(DBConnectionHelper.GetRMSOFFLINEConnectionString()) { }
}
```

## Pattern 3 (Notification module): a Dapper singleton with one method per stored procedure

`Database/Notification/Context.cs` is a `sealed` `Lazy<Context>` singleton
where every stored procedure gets its own named method, each opening its own
`SqlConnection`:

```csharp
// reload/class-library/Database/Notification/Context.cs:39-50
public int MessageDeliveryTracks_Ins(int messageId, string providerReferenceId, string statusCode)
{
    using (var connection = GetConnection())
    {
        var param = new DynamicParameters();
        param.Add("MessageId", messageId, dbType: DbType.Int32, direction: ParameterDirection.Input);
        ...
        return connection.Query<int>(MessageDeliveryTracksIns, param, commandType: CommandType.StoredProcedure).Single();
    }
}
```

Note this uses Dapper's typed `Query<Messages>`/`Query<ChannelSettings>`
directly against the domain model class — a lighter-weight mapping than
Pattern 1's hand-written `Conversion.DBNullTo*` mapping, and closer to how a
modern Dapper repository would normally be written.

## Connections and transactions

- Every sampled call is a single stored-procedure call; there is no example
  anywhere in `class-library` of composing multiple writes into one ADO.NET
  transaction (`SqlTransaction`) or a unit-of-work spanning Provider calls.
  Multi-step consistency (e.g. "insert transaction row, then update balance")
  appears to rely on the stored procedure itself doing everything atomically
  server-side, or on the caller not needing atomicity across calls.
- Pattern 2 and 3 both open a brand-new `SqlConnection` per call inside a
  `using` block (correctly disposed, but no ambient connection pooling
  abstraction beyond ADO.NET's own pooling) — this is a couple of
  connection-open round trips per logical operation rather than one shared
  connection per request/unit-of-work.
- Connection strings themselves are not read from `web.config`
  `connectionStrings` — see the mechanism described in
  `configuration-and-secrets.md`.

## Everything is stored-procedure-only

No inline dynamic SQL, no string-built `SELECT`/`UPDATE` statements, and no
ORM entity graph anywhere sampled. This is consistent across all three
patterns and across every module (TNG, Game, InComm, Astro, Notification,
RMS_OFFLINE) — the one truly universal data-access rule in this codebase.

## Related

- [[architecture/reload/class-library/database]] — the `Fiuu.Database` project implementing Patterns 2 and 3 above
- [[conventions/configuration-and-secrets]] — how the connection strings these patterns consume are actually resolved
- [[conventions/naming]] — the `M`-prefix/DTO mapping convention used in Pattern 1's hand-written `Conversion.DBNullTo*` calls
- [[conventions/sql-conventions]] — the stored-procedure naming these Provider classes reference by constant
