# TICKET — ER diagram

3 tables across `Ticket2U` and `TRANS` schemas.

```mermaid
erDiagram
    Ticket2U_Transactions {
        bigint Id PK
        varchar PartnerUserId
        varchar PaymentId
    }
    TRANS_PaymentOrders {
        int Id PK
        int DealerId FK
        int StoreId FK
        int TerminalId FK
    }
    TRANS_PaymentTransactions {
        int Id PK
        int PaymentOrderId FK
        int TerminalServiceProductId FK
    }

    TRANS_PaymentTransactions }o--|| TRANS_PaymentOrders : "PaymentOrderId"
```

*(Entity names prefixed `Schema_Table` — Mermaid `erDiagram` doesn't allow
dots in identifiers. `TRANS.PaymentOrders`/`PaymentTransactions` here is the
same reusable shape as `BILL_PAYMENT.TRANS` — independently defined, not a
shared physical table.)*
