---
tags: [reload_db/architecture, module/einvoice]
---

# EINVOICE

**Database:** `EINVOICE` · **Schemas:** `TRANS` (data), `dbo` (reporting
procs only, no tables) · **Tables:** 3 · **Stored procedures:** 11+

> **Missing from the vault entirely** — see `vault-drift-notes.md` §1. This
> whole module doc is written directly from `reload_db/MAINT/EINVOICE/`
> since no vault note exists to start from or cross-check against.

Malaysia e-Invoicing integration — submission of invoices to the government
e-Invoicing platform (LHDN's MyInvois system; inferred from domain
vocabulary, not stated in the scripts). Oldest object found is dated
2024-08-15 under ticket `GIT#1174`, "[CR] eInvoicing API."

## Tables (`TRANS` schema)

- **`Submissions`** — one row per submission batch: `ReferenceId`, `Code`
  (the platform's own submission code once accepted), `Status` (defaults to
  `'PENDING'`), `ErrorMessage`, `RetryCount`.
- **`Invoices`** — one row per invoice within a submission
  (`SubmissionId` FK), holding the **full bilingual supplier/buyer legal
  identity payload** required for e-Invoicing: `SupplierTIN`/`BuyerTIN` (Tax
  Identification Number), `SupplierIdType`/`BuyerIdType` (1=NRIC,
  2=Passport, 3=BRN, 4=Army — per an extended-property column comment on the
  table itself), SST registration numbers, full postal addresses, plus the
  monetary breakdown (`TotalExcludingTax`/`TotalIncludingTax`/
  `TotalTaxAmount`/`TotalPayableAmount`, all `decimal(20,4)`).
  `InvoiceCategoryId` (1=Consolidated Gross Sales, 2=Consolidated Prepaid
  Dealer Commission, 3=End Customer e-Invoice, 4=Credit Note, 5=Debit Note)
  and `InvoiceType` (per column comment: 1=Invoice, 2=Credit Note,
  3=Debit Note, 11=Self-billed Invoice, 12=Self-billed CN) together drive an
  **`AFTER INSERT` trigger** (`TRG_Insert_Invoices`) that auto-generates
  `InvoiceNumber` from one of six dedicated SQL `SEQUENCE` objects
  (`SQ_Invoices_CGS`/`_CPDC`/`_C`/`_CN`/`_SBCN`/`_DN`), formatted like
  `INV-CGS0000000001`. This is the only trigger-driven numbering scheme found
  in any module sampled — everywhere else, sequence/numbering logic lives in
  a stored procedure, not a table trigger.
- **`InvoiceItems`** — line items per invoice (`InvoiceId` FK),
  `ServiceTypeId`/`SourceTypeId` explicitly commented as referencing
  `CEPP.dbo.LookupCodes.LookupType`, `Classification` per MyInvois's own
  classification codes (004 = Consolidated e-Invoice, 008 = e-Commerce
  e-Invoice), `MinOrderId`/`MaxOrderId` (the underlying sales-order range a
  consolidated line item summarizes).

## Stored procedures

- `TRANS.Invoices_Ins`/`_Sel_By_InvoiceNumber`/`_Sel_By_SubmissionId`/
  `_Upd_By_Id`, `TRANS.Submissions_Ins`/`_Sel_By_Code`/`_Sel_By_Id`,
  `TRANS.InvoiceItems_Ins`/`_Sel_By_InvoiceId` — standard CRUD, same
  `<Table>_<Verb>` convention as every other module.
- **`dbo.Report_*`** — a distinct set of report-generation procedures with no
  backing tables of their own in this database:
  `Report_ConsolidatedGrossSalesDebitNote_InvoiceItems`,
  `Report_ConsolidatedGrossSales_InvoiceItems`,
  `Report_ConsolidatedPrepaidDealerCommission_InvoiceItems`,
  `Report_CreditNoteSelfBilled_InvoiceItem`, `Report_CreditNote_InvoiceItem`,
  `Report_EInvoice_Customer_Monthly_Summary`, `Report_EInvoice_Excel`,
  `Report_EInvoice_Monthly_Summary`, `Report_EInvoice_Search`,
  `Report_EndCustomerInvoice_InvoiceItem`,
  `Report_PrepaidDealerCommission_InvoiceItems` — these names map directly
  onto `Invoices.InvoiceCategoryId`'s five categories, confirming this
  database's stored procedures are the actual reporting/query layer for
  MyInvois compliance reporting, not just a write-side integration log.

## Relationships to other modules

`InvoiceItems.ServiceTypeId`/`SourceTypeId` reference `CEPP.dbo.LookupCodes`
by explicit column comment. The `dbo.Report_*` procedures almost certainly
join across to `TRANSACTION`/`REPORTSUMMARY` sales data and `CEPP` dealer
data to build the consolidated-gross-sales and dealer-commission reports —
this wasn't verified by reading the proc bodies, so treat it as a strong
inference, not a confirmed join. See `00-overview.md` for the (also inferred,
not confirmed) relationship to `SAP`.

## Open questions

- Whether `EINVOICE.TRANS.Submissions`/`Invoices` are populated by
  `RMS_OFFLINE.dbo.EInvoiceRequests` (the consumer-app-side e-invoice
  request table), by `SAP.TRANS.Submissions`, by both, or independently —
  not resolved from the schema alone. The two `Submissions` tables (this one
  and SAP's) look parallel rather than linked by any visible FK-by-convention
  column.

## Related

- [[architecture/reload/class-library/einvoice]] — the `EInvoice/Core` application code that submits to this database
- [[architecture/reload/diagrams/einvoice-submission-flow]] — the traced scheduled-batch submission sequence
- [[architecture/reload_db/sap]] — the parallel `TRANS.Submissions` table this doc's open question compares against
- [[architecture/reload_db/vault-drift-notes]] — this database's complete absence from the original vault (§1)
