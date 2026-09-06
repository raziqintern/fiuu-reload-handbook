---
tags: [reload/architecture, module/einvoice, diagram]
---

# Sequence: EInvoice end-customer submission (scheduled batch job)

Unlike the other two diagrams, this flow is **not** triggered by a live terminal
request — it's a scheduled/batch job. This corrects an initial assumption that
EInvoice submission would be triggered synchronously from a transaction. Sources, all
read directly:
- `reload/web/DEV/NET/Applications/EInvoice/Scheduler/Program.cs` (read in full)
- `reload/web/DEV/NET/Applications/EInvoice/Core/Services/ServiceLocator.cs` (read in
  full)
- `reload/web/DEV/NET/Applications/EInvoice/Core/Services/SubmissionService.cs`
  (`SubmitEndCustomerEInvoice()` read in full)
- `reload/web/DEV/NET/Applications/EInvoice/Core/Providers/SecureApi/EInvoiceSecureProvider.cs`
  (read in full)

## What's confirmed vs. inferred/unknown

- **Confirmed:** the console app is invoked with a numeric `ScheduleType` argument
  (something external — Windows Task Scheduler or equivalent — must supply this; the
  scheduler mechanism itself is outside this repo and wasn't found); it initializes
  the DI container (`EngineContext.Initialize()`), then dispatches to one of several
  `EInvoiceServiceLocator.ApiService`/`ReportService` methods based on that argument.
  `SubmitEndCustomerEInvoice()`'s full body was read: it pulls `QUEUED` requests from
  the database, validates each against a matching transaction/invoice item, builds an
  `InvoiceRequest` (with `CurrencyCode.MalaysiaRinggit` hardcoded — a strong signal
  this is a Malaysia-specific compliance flow), and posts it via
  `EInvoiceSecureProvider.SendSubmision(...)`, updating the request's status in the
  database based on the result (and sending an alert email on failure).
- **Unknown / not confirmed anywhere in code:** the identity of the external gateway
  at `AppSettings["EInvoiceApiUrl"]`. No literal "LHDN"/"MyInvois"/"IRBM" string was
  found anywhere under `Applications/EInvoice/` — see
  [`../class-library/einvoice.md`](../class-library/einvoice.md) for that caveat. This
  diagram labels it generically as "EInvoice gateway (external)" rather than naming a
  specific national authority.
- **Not traced:** what actually enqueues a row with status `QUEUED` in the first
  place (i.e. which part of the system decides an end-customer invoice needs
  generating) — that producer side of the queue wasn't found in this pass.

```mermaid
sequenceDiagram
    participant Scheduler as External scheduler<br/>(Windows Task Scheduler or equivalent —<br/>not found in this repo)
    participant Console as EInvoice/Scheduler<br/>Program.Main(args)
    participant Locator as EInvoiceServiceLocator
    participant Svc as SubmissionService<br/>.SubmitEndCustomerEInvoice()
    participant Provider as SubmissionProvider<br/>(DB reads/writes)
    participant DB as RMS_OFFLINE-family DB<br/>(EInvoiceRequest table — exact DB<br/>alias not reconfirmed here)
    participant Secure as EInvoiceSecureProvider
    participant Gateway as EInvoice gateway (external —<br/>identity not confirmed)

    Scheduler->>Console: run with arg = Hourly_SubmitEndCustomerEInvoice
    Console->>Console: EngineContext.Initialize()
    Console->>Locator: ApiService (= SubmissionService singleton)
    Console->>Svc: SubmitEndCustomerEInvoice()
    Svc->>Provider: GetEndCustomerEInvoice_Request_By_Status(QUEUED)
    Provider->>DB: SELECT queued requests
    DB-->>Provider: rows
    Provider-->>Svc: List<EndCustomerEInvoiceRequest>
    loop for each queued request
        Svc->>Provider: GetEndCustomerEInvoice_InvoiceItem(ReferenceId, TransactionDate)
        Provider->>DB: look up matching transaction / invoice item
        DB-->>Provider: invoiceItem (or none)
        alt invoice item found and amount matches
            Svc->>Svc: build InvoiceRequest (Supplier=Fiuu, Buyer=end customer,<br/>CurrencyCode=MYR, TaxSummary)
            Svc->>Secure: SendSubmision(SendSubmissionRequest)
            Secure->>Gateway: HTTPS POST {EInvoiceApiUrl}/Submission/Send (JSON)
            Gateway-->>Secure: JSON { responseCode, ... }
            Secure-->>Svc: bool ok, SubmissionResponse
            alt submission accepted
                Svc->>Provider: UpdateEInvoiceRequest_Status_By_Id(SUBMITTED)
            else submission rejected
                Svc->>Svc: SendEmail(InvalidInternalSubmission / InvalidSubmission)
                Svc->>Provider: UpdateEInvoiceRequest_Status_By_Id(ERROR)
            end
            Provider->>DB: UPDATE status
        else no matching transaction, or amount mismatch
            Svc->>Provider: UpdateEInvoiceRequest_Status_By_Id(TRANS_NOT_FOUND)
            Svc->>Svc: SendEmail(InvalidTransaction)
            Provider->>DB: UPDATE status
        end
    end
```

A separate scheduled operation, `Hourly_EInvoiceRetry`
(`EInvoiceServiceLocator.ApiService.Retry()`), exists alongside this for retrying
failed submissions — its body was not read in this pass, but its existence confirms
there's a retry mechanism distinct from the initial submission path shown above.

## Related

- [[architecture/reload/class-library/einvoice]] — the `EInvoice/Core` component this flow is built from
- [[architecture/reload_db/einvoice]] — the `EINVOICE` database whose `TRANS.Submissions`/`Invoices` this flow writes to
- [[gitlab-analysis/reload-tribal-knowledge]] — the ongoing monthly resubmission-patch pattern (§5) for this same integration
