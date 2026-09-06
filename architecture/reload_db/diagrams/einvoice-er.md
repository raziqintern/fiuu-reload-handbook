# EINVOICE — ER diagram

3 tables, `TRANS` schema. **Entirely missing from the vault** — this diagram
is built directly from `reload_db/MAINT/EINVOICE/Table/*.sql`, not adapted
from any existing vault diagram. See `einvoice.md` and `vault-drift-notes.md` §1.

```mermaid
erDiagram
    Submissions {
        int Id PK
        varchar ReferenceId
        varchar Code
        varchar Status
        int RetryCount
    }
    Invoices {
        int Id PK
        int SubmissionId FK
        tinyint InvoiceCategoryId
        varchar InvoiceType
        varchar InvoiceNumber
        varchar SupplierTIN
        varchar BuyerTIN
        decimal TotalExcludingTax
        decimal TotalIncludingTax
        datetime IssueDate
    }
    InvoiceItems {
        bigint Id PK
        varchar LineNo
        int InvoiceId FK
        tinyint ServiceTypeId FK
        tinyint SourceTypeId FK
        varchar Classification
        int MinOrderId
        int MaxOrderId
        decimal Subtotal
    }

    Invoices }o--|| Submissions : "SubmissionId"
    InvoiceItems }o--|| Invoices : "InvoiceId"
```

`InvoiceItems.ServiceTypeId`/`SourceTypeId` reference `CEPP.dbo.LookupCodes`
by explicit column-level comment in the source script — the one confirmed
cross-database link out of this database. `Invoices.InvoiceNumber` is
computed by an `AFTER INSERT` trigger from `InvoiceCategoryId`+`InvoiceType`
via 6 dedicated SQL `SEQUENCE` objects, not by application code — see
`einvoice.md` for the full numbering scheme.
