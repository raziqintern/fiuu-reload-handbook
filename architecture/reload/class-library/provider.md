# Provider

**Source:** `reload/web/DEV/NET/Components/Provider` (only 6 files —
`Database.cs`, `ProviderBase.cs`, `Fiuu.Provider.csproj`/`.sln`/`.msbuild`,
`Properties/AssemblyInfo.cs`). **Prebuilt artifact:** `class-library/Fiuu.Provider.dll`
— again, source lives in `Components/`, not in `class-library` (see
[`../00-topology.md`](../00-topology.md) §4).

## What it's for

A small, generic base class (`Fiuu.Provider.ProviderBase`, abstract) for data-access
provider classes: `Create`, `CreateWithReturnId`, `Update`, `ExecuteNonQuery`, `Get<T>`,
`GetList<T>` — all implemented in terms of a `dbAlias` string + stored-procedure name +
`ParameterCollection`, delegating to `SqlAccessor.ExecuteProcedure(...)` from
`Fiuu.MasterFramework.Database` (see [`masterframework.md`](masterframework.md)).

## Relationship to `class-library/Database` — unresolved ambiguity

This module and `class-library/Database` (`Fiuu.Database`, see
[`database.md`](database.md)) both provide a "base class for DB providers," but they
are **not the same thing** and don't obviously build on each other:

| | `Fiuu.Provider` (this module) | `Fiuu.Database` |
|---|---|---|
| Underlying data access | `SqlAccessor`/`SqlResult` (`Fiuu.MasterFramework.Database`) | Dapper (`SqlConnection` + `Dapper.Query<T>`) |
| DB alias mechanism | Passed in as a `dbAlias` string parameter per call | Baked into the class hierarchy (`RMSOffineProvider<T>` hardcodes `RMS_Offline`) |
| Where it lives | `Components/Provider` (inside `reload` repo) | `class-library/Database` (submodule) |

Which callers use `Fiuu.Provider` vs. `Fiuu.Database` was **not traced** in this pass —
this needs a follow-up pass (likely: older code uses `Fiuu.Provider` +
`SqlAccessor`, newer code uses `Fiuu.Database` + Dapper, as part of the same kind of
incremental migration seen elsewhere in this codebase — see
[`../00-topology.md`](../00-topology.md) §4 — but that is **inference, not
confirmed**).

## Consumers

Not directly traced to specific callers in this pass beyond its inclusion in the
overview dependency diagram as a `class-library`-adjacent module referenced by the
general application layer.
