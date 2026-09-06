# Sequence: TNG e-wallet card transaction (via Terminal API)

Traced from real code, not assumed. Primary sources:
- `reload/web/DEV/NET/Applications/Reloads/Terminal/Api/Controllers/TNGController.cs`
- `reload/web/DEV/NET/Applications/Reloads/Terminal/Api/Controllers/RMSAuthController.cs`
- `reload/web/DEV/NET/Applications/Reloads/Terminal/Api/Infrastructure/Security/AuthenticationAttribute.cs`
- `reload/web/DEV/NET/Applications/MOLReloads/Core/Services/TNGService.cs`
- `reload/class-library/Reloads/TNG/*` (referenced, not individually read beyond
  confirming its existence and structure — see
  [`../class-library/reloads-tng-game.md`](../class-library/reloads-tng-game.md))

Chosen because `TNGController.TNGCardTransaction` is a fully-readable, representative
example of the controller → service pattern used by every TNG endpoint
(`TNGProfile`, `TNGHostAuthentication`, `TNGOnlineCardValidation`,
`TNGBlacklistedCard`, `TNGFundRequest` all follow the identical shape).

## What's confirmed vs. inferred

- **Confirmed:** the HTTP entry point, the custom auth scheme shape, the controller
  → `TNGService` call, the `ErrorCode` → HTTP response mapping, and that
  `TNGService` resolves its dependencies (`ITerminalService`, `ITNGTerminalService`,
  etc.) through the Autofac-based `EngineContext` DI container.
- **Inferred / not opened in this pass:** the exact internals of `TNGService.
  TNGCardTransaction(...)` (only `TNGProfile`'s first ~10 lines were read in full;
  the pattern shown for `TNGCardTransaction` in this diagram is extrapolated from
  that pattern plus the confirmed `ApiTransactionProvider`/`CommissionRatesService`/
  `WalletService` dependencies present in `TNGService`'s field list) — and the exact
  wire protocol `class-library/Reloads/TNG`'s providers use to talk to the TNG host
  (not read in this pass; drawn here as a generic "TNG host" call).

```mermaid
sequenceDiagram
    participant Terminal as POS Terminal / PGW client
    participant API as Reloads/Terminal/Api<br/>TNGController
    participant Auth as AuthenticationAttribute<br/>(custom scheme)
    participant Svc as MOLReloads/Core<br/>TNGService
    participant CEPP as Components/CEPP<br/>(Terminal/Store/Dealer/Commission services)
    participant TNGLib as class-library/Reloads/TNG<br/>(WalletProvider, TNGCardTransactionsService)
    participant DB as RMS_OFFLINE (SQL Server,<br/>via Fiuu.Database / Dapper)
    participant TNGHost as TNG host (external)

    Terminal->>API: POST /tngreload/cardtransaction<br/>Authorization: <scheme> base64(accessId):base64(signature)
    API->>Auth: AuthenticateAsync(request)
    Auth->>Auth: decode accessId + signature,<br/>look up scheme via AuthenticationSchemeFactory
    Auth-->>API: IPrincipal (AccessId claim) or 401
    API->>API: map request model -> TNGCardTransactionReq
    API->>Svc: TNGService.TNGCardTransaction(AccessId, req, resp)
    Svc->>CEPP: TerminalService.GetTerminal(accessId)
    CEPP-->>Svc: terminal
    Svc->>CEPP: StoreService.GetStore / DealerService.GetDealer
    CEPP-->>Svc: store, dealer
    Svc->>CEPP: CommissionRatesService / ScheduledMaintenanceService checks
    CEPP-->>Svc: OK / ErrorCode
    Svc->>TNGLib: TNGCardTransactionsService / WalletService<br/>(record transaction, adjust wallet)
    TNGLib->>DB: persist via RMS_OFFLINE providers (Dapper + stored procs)
    DB-->>TNGLib: OK
    Note over TNGLib,TNGHost: Exact TNG host wire call not traced in this pass —<br/>class-library/Reloads/TNG owns the partner protocol.
    TNGLib-->>Svc: result / response code
    Svc-->>API: ErrorCode
    API->>API: map ErrorCode -> RespCode via ToResponseCode(...)
    API-->>Terminal: 200 OK { TNGCardTransactionResponse }
```
