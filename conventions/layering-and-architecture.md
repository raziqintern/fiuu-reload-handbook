---
tags: [conventions]
---

# Layering / Architecture

Note: `web_api`, `web_app`, `reload_portal`, `terminal_application`, and
`console_app` are present as empty directories in this checkout (no files
under them at all) — this doc is based entirely on `class-library`, which is
the only module with actual source. How the consuming apps wire into these
services could not be observed directly and would need a populated checkout.

## The dominant pattern: Model / Provider / Service, per feature module

Each business module under `Reloads/<Module>` and `Secure/<Module>` repeats
the same three-layer shape:

- **Models** — plain DTOs/POCOs, no behavior (`Reloads/TNG/Models/Account.cs`).
- **Providers** — data access only, one class roughly per aggregate/table,
  talks to SQL via stored procedures (`Reloads/TNG/Providers/TerminalProvider.cs`).
- **Services** — business logic, implements an `I<Name>Service` interface,
  orchestrates one or more Providers plus other Services
  (`Reloads/TNG/Services/TerminalService.cs`).

```csharp
// reload/class-library/Reloads/TNG/Services/TerminalService.cs:8-26
public class TerminalService : ITerminalService
{
    private TerminalProvider _provider;
    private TerminalProvider Provider
    {
        get { return _provider ?? (_provider = new TerminalProvider()); }
    }

    private IAccountService _accountCompo;
    private IAccountService AccountCompo
    {
        get { return _accountCompo ?? (_accountCompo = EngineContext.Current.Resolve<IAccountService>()); }
    }
```

Two things worth noting in that one snippet:
- The Provider is `new`'d up directly by the Service (no DI for the
  Provider layer — only Services are resolved through the container).
  This is the norm, not an exception; every Service sampled does this.
- Cross-Service dependencies go through a **service locator**
  (`EngineContext.Current.Resolve<T>`), lazily, via a backing-field/property
  pair — not constructor injection. This exact `_field ?? (_field = ...)`
  lazy-resolve idiom recurs in every Service that depends on another Service
  (19 files reference `EngineContext.Current.Resolve` across class-library).

## Dependency registration is per-module, container-based, but hand-maintained

Each module ships its own `DependencyRegistrar : IDependencyRegistrar`
registering its Service interfaces into a shared container abstraction
(`Fiuu.MasterFramework.Dependency`, compiled dependency — no source in this
repo):

```csharp
// reload/class-library/Reloads/TNG/DependencyRegistrar.cs:6-30
public class DependencyRegistrar : IDependencyRegistrar
{
    public void Register(IContainerManager container, ITypeFinder typeFinder)
    {
        container.Register<IAccountService, AccountService>();
        container.Register<IBankService, BankService>();
        ...
```

This is consistent across modules (TNG, Astro, Game all have one), but it's a
manual list someone must remember to update — nothing here auto-discovers
implementations of `IXxxService` by convention.

## `ServiceBase` exists per-module and isn't shared

`AWSCore.Services.ServiceBase`, `Fiuu.Astro.Secure.Core.Services.ServiceBase`,
and `Fiuu.InComm.Secure.Core.Services.ServiceBase` are three unrelated classes
with the same name and a similar purpose (give Services a shortcut to
config/logging/shared plumbing), each hand-written for its own module rather
than shared from a common base. E.g. AWSCore's version:

```csharp
// reload/class-library/AWSCore/Services/ServiceBase.cs:11-23
public class ServiceBase
{
    private ConfigurationProvider _configurationProvider { get; set; }
    ...
    protected List<ConfigDetails> GetConfigDetails(string sConfigName)
    {
        return _configurationProvider.GetConfigDetails(sConfigName);
    }
```

Astro's `BillPaymentService : ServiceBase, IBillPaymentService` uses its own
module's `ServiceBase` for `GetSystemConfig()`, `CreateBillPayment(...)`, etc.
— same idea, independently implemented per module. See
`known-patterns-and-pitfalls.md` for the duplication angle.

## Template-method style base classes for protocol-heavy modules

The InComm module (ISO 8583 card-network messaging) goes one step further and
uses an abstract base (`InCommServiceBase`) with overridable hook methods
(`ValidateParameters`, `FormatContractToModel`, `RetrieveExistingGiftCardResend`)
that concrete Services override — a genuine Template Method pattern, not just
composition:

```csharp
// reload/class-library/Secure/Incomm/Services/FastPinSaleService.cs:70-90
protected override ContractResponse RetrieveExistingGiftCardResend(ContractRequest request, int actionType) { ... }
protected override InCommTransaction FormatContractToModel(ContractRequest appReq, string processingCode, string messageTypeIdentifier) { ... }
protected override int ValidateParameters(ContractRequest appReq) { ... }
```

This is notably more structured than the TNG/Game modules, which don't use
inheritance for variability at all — evidence that architecture rigor tracks
the module/author, not a house standard.

## No repository/unit-of-work abstraction, no ORM entities

There is no `IRepository<T>`, no `DbContext`-as-ORM (the one class literally
named `Context`, in `Database/Notification/Context.cs`, is a thin Dapper
wrapper singleton, not an EF context), and no transaction/unit-of-work
abstraction spanning multiple Provider calls. Each Provider method opens (or
is handed) a connection, executes one stored procedure, and returns. Composing
multiple writes into one transaction is not a pattern seen anywhere sampled —
see `data-access.md`.

## Summary of the pattern's consistency

| Aspect | Consistency |
|---|---|
| Model/Provider/Service split | Very consistent across all modules sampled |
| Interface-per-Service | Consistent |
| Provider access modifier (internal vs public) | Inconsistent (see `naming.md`) |
| Cross-service wiring (service locator vs DI) | Consistent use of service locator, but per-property boilerplate is hand-copied each time |
| Base-class reuse | Not shared across modules — duplicated per module |
| Inheritance/template-method for variability | Only in InComm; other modules use flat Services |

## Related

- [[conventions/known-patterns-and-pitfalls]] — the per-module `ServiceBase` duplication (§1) expanded on above
- [[conventions/naming]] — the `*Provider`/`*Service`/`*Model` suffix convention this layering relies on
- [[conventions/data-access]] — how Providers actually talk to the database within this layering
- [[architecture/reload/class-library/masterframework]] — the `Fiuu.MasterFramework.Dependency` container this DI pattern is built on
