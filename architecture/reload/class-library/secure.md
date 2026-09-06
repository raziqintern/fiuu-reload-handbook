# Secure (Astro, Incomm, Telekom)

**Source:** `reload/class-library/Secure/{Astro,Incomm,Telekom}` — three independent
sub-projects (`Fiuu.Astro.Secure.Core.csproj`, `Fiuu.InComm.Secure.Core.csproj`,
`Fiuu.Telekom.Secure.Core.csproj`), each a genuine `class-library` submodule module.
All three reference `AWSCore` (confirmed — see [`awscore.md`](awscore.md)) — this is
the "Secure" naming pattern: partner-integration modules that need credentials.

## Astro

- **Path:** `class-library/Secure/Astro`
- **Structure:** `Configuration/`, `Enums/`, `Helpers/`, `Models/`, `Providers/`,
  `Services/`, plus `Caching.cs` and `DependencyRegistrar.cs`.
- **Partner:** Astro (Malaysian satellite TV / digital services provider — inferred
  from the name and the `AWSCore.Enums.SecretsLabels.Astro` label group
  (`PartnerId`, `PartnerPassword`)). Purpose beyond that wasn't traced — likely a
  reload/bill-payment product for Astro subscriptions, consistent with the reload
  business generally, but not confirmed by reading Astro-specific service code in this
  pass.

## Incomm (ISO 8583)

- **Path:** `class-library/Secure/Incomm`
- **Structure:** `Configuration/`, `Contracts/`, `CustomException/`, `Helpers/`,
  `Models/`, `Providers/`, `Services/`, plus a full **`ISO8583/`** subfolder:
  `AMessage`, `Bitmap`, `Field`/`FieldDescriptor`/`IField`/`IFieldDescriptor`,
  `IMessage`, `Iso8583InComm`, `IsoConvert`, `ProcessingCode`, `Template`, `Utils`,
  `Validators`, `Adjuster`/`LambdaAdjuster`, `PanMaskDecorator`.
- **What it's for:** a from-scratch **ISO 8583** message building/parsing framework
  (the standard financial-transaction-card-originated message format used in card
  payment networks) for talking to INCOMM at a lower level than the plain-HTTP-JSON
  path used by the live gift-card preauth/activation flow (see
  [`../diagrams/giftcard-incomm-flow.md`](../diagrams/giftcard-incomm-flow.md)).
  `Services/ActivationStandInService.cs` (confirmed to exist here) name suggests this
  handles **stand-in processing** — authorizing/queuing transactions when the live
  INCOMM host is unreachable, a common card-network resilience pattern. The exact
  trigger for when the ISO8583/stand-in path is used instead of the HTTP path in
  `Components/CEPP/Payment/INCOMM` was **not confirmed** in this pass.

## Telekom

- **Path:** `class-library/Secure/Telekom`
- **Structure:** just `SoapProxy.cs` alongside the usual `.csproj`/`app.config`/
  `packages.config` — much smaller than Astro/Incomm.
- **Partner:** Telekom (Malaysia — TM/Unifi, inferred from the name; no
  `AWSCore.Enums.SecretsLabels.Telekom` label group was directly confirmed in this
  pass, unlike Astro/InComm). `SoapProxy.cs` confirms this integration uses **SOAP**,
  not REST/JSON — notably different from every other partner integration traced in
  this handbook (INCOMM uses HTTP+JSON, EInvoice uses HTTP+JSON). Likely a bill-payment
  integration (Telekom/Unifi bill inquiry and payment), consistent with the
  `BillPaymentAccountInquiryHandler`/`BillPaymentSubmissionHandler` family seen in
  `Reloads/TerminalServer/Console/MessageHandlers` (see
  [`../terminal-application.md`](../terminal-application.md)) — but that link was
  **not confirmed** by tracing an actual call from a `BillPayment*Handler` into
  `Fiuu.Telekom.Secure.Core`.

## Consumers

Not confirmed by a targeted grep in this pass for which application-layer code calls
into these three modules (as opposed to `AWSCore`, where the reverse direction —
these three depending on `AWSCore` — was confirmed). Given the naming, the most
likely direct consumer is `Components/CEPP/Payment/*` (the per-partner payment
sub-projects) and/or the terminal socket server's `MessageHandlers`, but this is
inference, not a traced call chain.
