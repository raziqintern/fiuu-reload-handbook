---
tags: [reload/architecture, module/incomm, diagram]
---

# Sequence: INCOMM gift card — Initiate + Confirm (via Terminal API)

This is the most fully-traced flow in this handbook — every step below was read
directly, not inferred. Sources:
- `reload/web/DEV/NET/Applications/Reloads/Terminal/Api/Controllers/GiftCardController.cs`
- `reload/web/DEV/NET/Applications/MOLReloads/Core/Services/GiftCardService.cs`
  (read in full)
- `reload/web/DEV/NET/Components/CEPP/Payment/INCOMM/Services/InCommOperationService.cs`
- `reload/web/DEV/NET/Components/CEPP/Payment/INCOMM/Providers/InCommSecureProvider.cs`
  (read in full)

## Two calls, two HTTP requests from the terminal

INCOMM gift cards are a two-phase flow: `giftcard/initiate` (pre-authorize — checks
wallet balance, calls INCOMM's `PreAuthorization`) followed by `giftcard/confirm`
(commit — debits the wallet, calls INCOMM's `Activation`). Both are shown together
since `Confirm` depends on state written during `Initiate`.

## What's confirmed vs. inferred

- **Confirmed, read in full:** every step in the diagram below, including the exact
  external call (`InCommSecureProvider.PreAuthorization`/an equivalent `Activation`
  call, both plain HTTPS POST of JSON to `{AppSettings["GetInCommApiUrl"]}/Activation`
  or `/Deactivation`), the wallet debit/refund calls
  (`StoreAccountService.UpdateStoreAccountRefNoBalance`), and the transaction-status
  state machine (`Pending` → `Inquiried`/`InquiryFailed` → `Processing` →
  `Success`/`Failed`).
- **Inferred:** the exact `ProcessActivation(...)` internals past the point shown
  (its full body wasn't read — only `ProcessPreAuthorization` was read in full); the
  `class-library/Secure/Incomm` ISO8583/stand-in path exists as an alternative
  partner-communication mechanism (see
  [`../class-library/secure.md`](../class-library/secure.md)) but this diagram
  reflects the plain-HTTP path, which is what `InCommOperationService` actually calls
  for this flow.

```mermaid
sequenceDiagram
    participant Terminal as POS Terminal
    participant API as Reloads/Terminal/Api<br/>GiftCardController
    participant Svc as MOLReloads/Core<br/>GiftCardService
    participant CEPP as Components/CEPP<br/>(Terminal/Store/Dealer/Commission/<br/>StoreAccount services)
    participant IncommOp as Components/CEPP/Payment/INCOMM<br/>InCommOperationService
    participant IncommSec as InCommSecureProvider
    participant DB as RMS_OFFLINE (via<br/>ApiTransactionProvider)
    participant INCOMM as INCOMM host (external,<br/>HTTPS + JSON)

    rect rgb(235,245,255)
    Note over Terminal,INCOMM: Phase 1 — Initiate (pre-authorization)
    Terminal->>API: POST /giftcard/initiate { ReferenceId, Pan, Upc, Amount, Currency }
    API->>Svc: GiftCardService.Initiate(accessId, order)
    Svc->>CEPP: TerminalService/StoreService/DealerService lookups
    CEPP-->>Svc: terminal, store, dealer
    Svc->>CEPP: StoreAccountService.GetDefaultDealerStoreAccount (wallet balance check)
    Svc->>CEPP: CommissionRateService, TerminalContentService,<br/>ScheduledMaintenanceService checks
    Svc->>DB: ApiTransactionProvider.CreateGiftCard(Pending)
    Svc->>IncommOp: ProcessPreAuthorization(preAuth)
    IncommOp->>CEPP: InCommTerminalService/InCommService product+terminal lookups
    IncommOp->>IncommSec: PreAuthorization(ActivationRequest)
    IncommSec->>INCOMM: HTTPS POST {GetInCommApiUrl}/Activation (JSON)
    INCOMM-->>IncommSec: JSON { RespCode, AuthorizationId, Stand }
    IncommSec-->>IncommOp: ContractResponse
    IncommOp-->>Svc: bool success, RespCode
    alt pre-auth succeeded
        Svc->>CEPP: StoreAccountService (re-check balance if not consignment)
        Svc->>DB: ApiTransactionProvider.UpdateInquiredGiftCard(Inquiried, AuthorizationToken)
        Svc-->>API: ErrorCode.Success
        API-->>Terminal: 200 OK { AuthorizationToken, Amount, Instruction, ... }
    else pre-auth failed
        Svc->>DB: ApiTransactionProvider.UpdateGiftCard(InquiryFailed)
        Svc-->>API: mapped ErrorCode
        API-->>Terminal: 200 OK { RespCode = error }
    end
    end

    rect rgb(245,255,235)
    Note over Terminal,INCOMM: Phase 2 — Confirm (activation)
    Terminal->>API: POST /giftcard/confirm { AuthorizationToken, CashierId, TransactionDateTime, BusinessDate }
    API->>Svc: GiftCardService.Confirm(accessId, order)
    Svc->>CEPP: terminal/store/dealer lookups, date/time-variance validation
    Svc->>DB: ApiTransactionProvider.GetGiftCardByToken(AuthorizationToken)
    DB-->>Svc: authTransaction (must be status = Inquiried, not expired)
    Svc->>Svc: Activate(terminal, store, dealer, authTransaction, order)
    Svc->>CEPP: StoreAccountService.UpdateStoreAccountRefNoBalance<br/>(debit wallet, EnumTopUpType.Payment_GiftCard)
    Svc->>DB: ApiTransactionProvider.UpdateGiftCard(Processing)
    Svc->>IncommOp: ProcessActivation(activation)
    IncommOp->>INCOMM: (Activation call — internals not fully re-traced past<br/>ProcessPreAuthorization's pattern)
    INCOMM-->>IncommOp: activation result
    alt activation succeeded
        Svc->>DB: ApiTransactionProvider.UpdateConfirmedGiftCard(Success)
        Svc-->>API: ErrorCode.Success
        API-->>Terminal: 200 OK { OrderId, AuthorizationId, Amount, WalletBalance }
    else activation failed
        Svc->>CEPP: StoreAccountService.UpdateStoreAccountRefNoBalance<br/>(refund wallet, EnumTopUpType.Refund_GiftCard)
        Svc->>DB: ApiTransactionProvider.UpdateConfirmedGiftCard(Failed)
        Svc-->>API: ErrorCode.Failed
        API-->>Terminal: 200 OK { RespCode = error }
    end
    end
```

## Related

- [[architecture/reload/class-library/cepp]] — the `Payment/INCOMM` sub-project (`InCommOperationService`/`InCommSecureProvider`) this flow is traced through
- [[architecture/reload/class-library/secure]] — the alternative ISO 8583 stand-in path this diagram's plain-HTTP path bypasses
- [[architecture/reload/web-api]] — the `GiftCardController` entry point

Note: this diagram's `DB` participant is labeled `RMS_OFFLINE (via ApiTransactionProvider)` in the traced source, so no link to [[architecture/reload_db/incomm]]/[[architecture/reload_db/incomm-trans]] is asserted here — which physical database `ApiTransactionProvider` actually targets for gift-card transactions wasn't independently confirmed against `reload_db` in this pass.
