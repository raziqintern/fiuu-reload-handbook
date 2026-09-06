---
tags: [reload_db/architecture, module/bill-payment, diagram]
---

# BILL_PAYMENT — ER diagram

54 tables across 19 schemas. Per-biller schemas are structurally repetitive
(`AccountVerification` → `BillPayment`, occasionally + `BillPaymentRetries`/
`BillPaymentReturnCode`) so three representative billers plus the shared
`TRANS` workflow are shown; see `bill-payment.md` for the full schema list.

```mermaid
erDiagram
    TNB_AccountEnquiry {
        bigint Id PK
    }
    TNB_BillPayment {
        bigint Id PK
        varchar ReferenceId
    }
    TNB_BillPaymentReturnCode {
        bigint Id PK
        bigint BillPaymentId FK
    }
    TNB_BillPaymentReturnCode }o--|| TNB_BillPayment : "BillPaymentId"

    ASTRO_AccountVerification {
        bigint Id PK
    }
    ASTRO_BillPayment {
        bigint Id PK
        varchar BankClientRefId
        tinyint MSourceTypeId FK
    }
    ASTRO_BillPaymentRetries {
        bigint Id PK
        bigint BillPaymentId FK
    }
    ASTRO_BillPaymentRetries }o--|| ASTRO_BillPayment : "BillPaymentId"

    RazerPay_AccountEnquiry {
        bigint Id PK
        varchar ReferenceId
    }
    RazerPay_BillPayments {
        bigint Id PK
    }
    RazerPay_BillPaymentReturnCode {
        bigint Id PK
        bigint BillPaymentId FK
    }
    RazerPay_Configurations {
        int Id PK
        tinyint MStatusId FK
    }
    RazerPay_BillPaymentReturnCode }o--|| RazerPay_BillPayments : "BillPaymentId"

    TRANS_PaymentOrders {
        int Id PK
        int DealerId FK
        int StoreId FK
        int TerminalId FK
        tinyint MSourceTypeId FK
    }
    TRANS_PaymentTransactions {
        int Id PK
        int PaymentOrderId FK
        int TerminalServiceProductId FK
        tinyint BPMTransStatusId FK
    }
    TRANS_PaymentVoidRequests {
        int Id PK
        int PaymentTransactionId FK
        tinyint MWorkFlowStatusId FK
    }
    TRANS_PaymentVoidRepostRequests {
        int Id PK
        int PaymentVoidRequestId FK
    }
    TRANS_PaymentVoidRepostTransactions {
        int Id PK
        int PaymentVoidRepostRequestId FK
    }
    TRANS_PaymentVoidTransactions {
        int Id PK
        int PaymentVoidRequestId FK
    }
    TRANS_PaymentTransactions }o--|| TRANS_PaymentOrders : "PaymentOrderId"
    TRANS_PaymentVoidRequests }o--|| TRANS_PaymentTransactions : "PaymentTransactionId"
    TRANS_PaymentVoidRepostRequests }o--|| TRANS_PaymentVoidRequests : "PaymentVoidRequestId"
    TRANS_PaymentVoidRepostTransactions }o--|| TRANS_PaymentVoidRepostRequests : "PaymentVoidRepostRequestId"
    TRANS_PaymentVoidTransactions }o--|| TRANS_PaymentVoidRequests : "PaymentVoidRequestId"
```

*(Entity names are prefixed `Schema_Table` — Mermaid `erDiagram` doesn't
allow dots in identifiers.)*
