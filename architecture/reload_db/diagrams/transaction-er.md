---
tags: [reload_db/architecture, module/transaction, diagram]
---

# TRANSACTION — ER diagrams

144+ tables across 19+ schemas (vault says 144 tables / 14 schemas — both
undercounts, see `vault-drift-notes.md` §3). Split by functional cluster;
`_new_GIT1857`/`_new_GIT1858` wide-key migration siblings are omitted from
the diagrams below for legibility (same columns as their non-suffixed
counterpart, `bigint` instead of `int` identity) — see `transaction.md`.

## `dbo` — API staging (representative subset)

```mermaid
erDiagram
    ApiBillPaymentTransactions {
        int Id PK
        int TerminalId FK
        int StoreId FK
        int DealerId FK
        int TerminalServiceProductId FK
        varchar ReferenceId FK
        varchar PayerId FK
        varchar CashierId FK
        tinyint MstatusId FK
    }
    ApiGiftCardTransactions {
        int Id PK
        int TerminalId FK
        int StoreId FK
        int DealerId FK
        varchar ReferenceId FK
        int ProductId FK
        varchar AuthorizationId FK
    }
    ApiPinlessTransactions {
        bigint Id PK
        varchar ReferenceId FK
        int ServiceProviderId FK
        int DealerId FK
        int StoreId FK
        int TerminalId FK
        int ProductId FK
        bigint PinlessSalesTransactionId FK
    }
    ApiTNGCardTransaction {
        INT Id PK
        INT DealerId FK
        INT StoreId FK
        INT TerminalId FK
        CHAR TNGTerminalId FK
        INT TNGAccountId FK
        VARCHAR ReferenceId FK
    }
    ApiTicketTransactions {
        INT Id PK
        INT TerminalId FK
        INT StoreId FK
        INT DealerId FK
        INT TerminalServiceProductId FK
        VARCHAR ReferenceId FK
    }
    ApiStockOrders {
        int Id PK
        int TerminalId FK
        int StoreId FK
        int DealerId FK
        varchar ReferenceId FK
        int RestockOrderId FK
        int SalesOrderId FK
    }
    ApiStockTransactions {
        int Id PK
        int ProductId FK
        tinyint MStatusId FK
        int ApiStockOrderId FK
    }
    ApiStockTransactions }o--|| ApiStockOrders : "ApiStockOrderId"
```

## `dbo` — sales & orders

```mermaid
erDiagram
    SalesOrders {
        int Id PK
        int DealerId FK
        int StoreId FK
        int TerminalId FK
    }
    SalesTransactions {
        int Id PK
        int SalesOrderId FK
        int ProductId FK
        int SupplierId FK
        int DealerGroupId FK
        int VoidTransactionId FK
        int CommissionTypeId FK
    }
    PinlessSalesTransactions {
        bigint Id PK
        int ServiceProviderId FK
        int DealerId FK
        int StoreId FK
        int TerminalId FK
        int ProductId FK
        varchar ReferenceId FK
    }
    SaleSummaries {
        int Id PK
        int DealerId FK
        tinyint ServiceTypeId FK
        int ProductGroupId FK
    }
    SalesDiscrepancies {
        int Id PK
        int DealerId FK
        int ProductGroupId FK
    }
    SalesDiscrepanciesDetails {
        int Id PK
        int SalesDiscrepanciesId FK
        int StoreId FK
        int ProductId FK
    }
    SalesTransactions }o--|| SalesOrders : "SalesOrderId"
    SalesDiscrepanciesDetails }o--|| SalesDiscrepancies : "SalesDiscrepanciesId"
```

## `dbo` — void & return

```mermaid
erDiagram
    VoidOrders {
        int Id PK
        int DealerId FK
        int StoreId FK
        int TerminalId FK
    }
    VoidTransactions {
        int Id PK
        int VoidOrderId FK
        int ProductId FK
        tinyint MVoidTypeId FK
    }
    ReturnRequests {
        int Id PK
        tinyint MWorkFlowStatusId FK
    }
    ReturnOrders {
        int Id PK
        int DealerId FK
        int StoreId FK
        int TerminalId FK
    }
    ReturnRequestItems {
        int Id PK
        int ReturnRequestId FK
        int ProductId FK
        int TerminalId FK
        int ReturnOrderId FK
    }
    ReturnTransactions {
        int Id PK
        int ReturnOrderId FK
        int ProductId FK
    }
    VoidTransactions }o--|| VoidOrders : "VoidOrderId"
    ReturnRequestItems }o--|| ReturnRequests : "ReturnRequestId"
    ReturnRequestItems }o--|| ReturnOrders : "ReturnOrderId"
    ReturnTransactions }o--|| ReturnOrders : "ReturnOrderId"
```

## `dbo` — EOD/reconciliation (Bill Payment shown; Gift Card/Stock/MOLPay follow the identical shape)

```mermaid
erDiagram
    EndOfDays {
        int Id PK
        int TerminalId FK
        int StoreId FK
        int DealerId FK
    }
    EodBillPaymentTransactions {
        INT Id PK
        INT EodSubmissionId FK
        INT ApiBillPaymentTransactionId FK
        TINYINT MReconStatusId FK
    }
    EodBillPaymentTransactionReconciliation {
        INT Id PK
        TINYINT MVarianceTypeId FK
        INT EodSubmissionId FK
        INT t_ApiBillPaymentTransactionId FK
        INT s_ApiBillPaymentTransactionId FK
    }
    EodBillPaymentSummary {
        INT Id PK
    }
    EODBillPaymentSummaryReconciliation {
        INT Id PK
        INT EodSubmissionId FK
    }
```

*(`t_*` = terminal-reported value, `s_*` = system-recorded value — a
mismatch between the two is what `MVarianceTypeId` classifies.)*

## `dbo` — stock & purchasing

```mermaid
erDiagram
    PurchaseOrders {
        int Id PK
        int SupplierId FK
        int DealerGroupId FK
    }
    PurchaseOrderItems {
        int Id PK
        int POId FK
        int ProductId FK
    }
    GoodReceivedNotes {
        int Id PK
        int POId FK
        int SupplierId FK
    }
    RestockOrders {
        int Id PK
        int DealerId FK
        int StoreId FK
        int TerminalId FK
    }
    ReStockTransactions {
        int Id PK
        int ReStockOrderId FK
        int ProductId FK
        int SupplierId FK
    }
    AllocationOrders {
        int Id PK
        tinyint MAllocateActionId FK
    }
    AllocationOrderItems {
        int Id PK
        int AllocationOrderId FK
        int ProductId FK
        int SupplierId FK
    }
    DailyStockBalance {
        int Id PK
        int ProductId FK
        int DealerGroupId FK
    }
    PurchaseOrderItems }o--|| PurchaseOrders : "POId"
    GoodReceivedNotes }o--|| PurchaseOrders : "POId"
    ReStockTransactions }o--|| RestockOrders : "ReStockOrderId"
    AllocationOrderItems }o--|| AllocationOrders : "AllocationOrderId"
```

## `dbo` — TNG & MOLPay

```mermaid
erDiagram
    TNGCardTransactions {
        INT Id PK
        INT DealerId FK
        INT TerminalId FK
        CHAR TNGTerminalId FK
        INT TNGAccountId FK
    }
    TNGFundRequests {
        INT Id PK
        INT DealerId FK
        INT TNGAccountId FK
    }
    TNGFundAssignments {
        INT Id PK
        INT DealerId FK
        INT TNGAccountId FK
        INT TNGBankId FK
    }
    MOLPayOrders {
        int Id PK
        int DealerId FK
        int StoreId FK
        int TerminalId FK
    }
    MOLPayTransactions {
        int Id PK
        int MOLPayOrderId FK
        varchar TransactionId FK
    }
    ApiMOLPayTransactions {
        bigint Id PK
        int TerminalId FK
        varchar MolpayTransactionId FK
    }
    MOLPayTransactions }o--|| MOLPayOrders : "MOLPayOrderId"
    ApiMOLPayTransactions }o--|| MOLPayTransactions : "MolpayTransactionId"
```

## Provider schemas (established + missing-from-vault)

Every provider schema follows one of two shapes: a lone `Transactions` table,
or `AccountVerification` → `Transactions`. Shown here: two schemas already in
the vault (`IIMMPACT`, `PayLink`) alongside all 6 confirmed **missing from
the vault** (`vault-drift-notes.md` §3) — real columns, taken directly from
`reload_db/MAINT/TRANSACTION/Table/*.sql`.

Entity names below are prefixed `Schema_Table` purely because Mermaid's
`erDiagram` doesn't allow dots in entity names — the schema is the prefix up
to the first underscore, matching the section's file/column evidence
(`reload_db/MAINT/TRANSACTION/Table/<Schema>.<Table>.sql`).

```mermaid
erDiagram
    IIMMPACT_Transactions {
        BIGINT Id PK
        VARCHAR ReferenceId FK
        INT ProductId FK
    }
    IIMMPACT_AccountVerification {
        BIGINT Id PK
    }
    IIMMPACT_AccountVerification }o--|| IIMMPACT_Transactions : "TransactionId"

    AnyPay_Transactions {
        bigint Id PK
        varchar ReferenceId
        varchar UniqueId
        tinyint ServiceTypeId FK
        int ProductId FK
        varchar Operator
        decimal Amount
        varchar Status
    }
    CelcomDigi_RequestTopUp {
        bigint Id PK
        varchar ReferenceId
        varchar ApiPinlessTransactionId FK
        varchar Msisdn
        decimal Amount
        int ServiceProviderProductId FK
        varchar TransactionStatus
    }
    Giftee_Transactions {
        bigint Id PK
        varchar RequestCode
        int ProductId FK
        int EGiftItemId FK
        decimal Amount
        varchar Status
    }
    MobilityOne_Transactions {
        bigint Id PK
        varchar ReferenceId
        varchar AccountNo
        varchar ProdCode
        decimal Amount
        int Result
    }
    PrepayNation_Transactions {
        bigint Id PK
        int SkuId FK
        decimal Amount
        varchar Mobile
        varchar CorrelationId
        bigint TransactionId
    }
    RazerGold_Transactions {
        bigint Id PK
        tinyint CredentialsType
        varchar ReferenceId
        int ServiceProviderId FK
        int ProductId FK
        varchar SKU
        decimal Amount
        varchar OrderStatus
    }
```

Dates confirmed from script headers: `AnyPay` 2024-05-14 (`GIT-1067`),
`MobilityOne` 2024-09-21 (`GIT#1338`), `PrepayNation` 2024-12-05 (`GIT#1009`),
`CelcomDigi` 2025-06-18, `RazerGold` 2025-07-09 — all real, established
integrations, not recent/experimental additions.
