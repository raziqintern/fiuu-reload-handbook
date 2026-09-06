---
tags: [reload/architecture, module/einvoice]
---

# EInvoice

**Source:** `reload/web/DEV/NET/Applications/EInvoice/Core` (34 tracked files,
`Fiuu.EInvoice.csproj`) — **not** inside `class-library` itself, despite the prebuilt
`Fiuu.EInvoice.dll` living at `class-library`'s repo root (see
[`../00-topology.md`](../00-topology.md) §4 for this source/artifact split, which
applies to several modules, not just this one).

## What it's for

Submits invoice data to an external e-invoicing gateway and checks submission status.
The specific external system was **not confirmed** in code — no literal mention of
"LHDN," "MyInvois," or "IRBM" (Malaysia's national e-invoicing mandate/authority) was
found in `Applications/EInvoice/`. Given Fiuu operates in Malaysia and e-invoicing
became a national compliance mandate there, LHDN/MyInvois is a plausible target, but
this is **inference, not a confirmed fact** — flagged for follow-up. What's confirmed
is the shape of the integration, not its identity.

## Structure

- `Models/` — `Buyer`, `Supplier`, `TaxSummary`, `ReportEInvoice`,
  `EndCustomerEInvoiceRequest`, and `Models/SecureApi/` (`InvoiceRequest`,
  `InvoiceItemRequest`, `SendSubmissionRequest`, `CheckSubmissionRequest`,
  `SubmissionResponse`).
- `Providers/` — `ReportProvider`, `SubmissionProvider`, and
  `Providers/SecureApi/EInvoiceSecureProvider.cs` (the actual outbound HTTP client).
- `Services/` — `ReportService`, `SubmissionService`, `ServiceLocator`.
- `Helpers/HttpClientHelper.cs` — shared HTTP call helper.
- `Templates/Email/EInvoice/Email.html` — an email template, implying some
  notification-on-submission behavior (not traced further).

## Confirmed mechanism

`Providers/SecureApi/EInvoiceSecureProvider.cs`:
- Reads a base URL from `ConfigurationManager.AppSettings["EInvoiceApiUrl"]`.
- `SendSubmision(...)` → HTTP POST to `{EInvoiceApiUrl}/Submission/Send`.
- `CheckSubmission(...)` → HTTP POST to `{EInvoiceApiUrl}/Submission/Check`.
- Both send a JSON body and expect a JSON response containing a `responseCode`; a
  `SubmissionStatusCode.IN_PROGRESS` response code is treated as a successful send.

This is a call to a URL configured per-environment, not a hardcoded partner endpoint —
consistent with either an internal middleware service that itself talks to LHDN/
MyInvois, or a direct partner integration. Not resolved further in this pass.

## Dependencies

- `Fiuu.EInvoice.csproj` does **not** reference `class-library/AWSCore` directly
  (checked via grep — no match). `class-library/AWSCore/Enums/SecretsLabels.cs` does
  define an `EInvoice` label group (`SecretKey`, `IVCode`), so credentials for this
  module are clearly meant to flow through Secrets Manager — but the actual call site
  that uses those labels wasn't found in `EInvoice/Core` itself. Possibly reached
  through a DLL reference not visible to a `ProjectReference` grep, or through a
  project not yet checked. Flagged as unresolved, same open question noted in
  [`awscore.md`](awscore.md).
- `Fiuu.CEPP.Helpers`, `Fiuu.MasterFramework.Utilities` (imported by
  `EInvoiceSecureProvider.cs`).

## Consumers

- `EInvoice/Scheduler` (`Fiuu.App.EInvoice.Console.csproj`) — a scheduled job that
  presumably batches submissions/checks; not read in this pass. See
  [`../console-app.md`](../console-app.md).
- Not confirmed whether `Reloads/Terminal/Api` or `BackOffice/Web` call into this
  module directly for real-time submission versus only the scheduler doing batch
  submission — flagged as follow-up.

## Related

- [[architecture/reload_db/einvoice]] — the `EINVOICE` database this module submits to
- [[architecture/reload/diagrams/einvoice-submission-flow]] — the traced batch-submission sequence diagram
- [[architecture/reload/class-library/awscore]] — the unresolved secrets-mechanism question also flagged here
