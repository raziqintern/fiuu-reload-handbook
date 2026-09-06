---
tags: [reload/architecture, module/restorify]
---

# Reloads.Restorify

**Source:** `reload/web/DEV/NET/Applications/Restorify/Core`
(`Fiuu.Reloads.Restorify.csproj`, part of 135 tracked files under `Restorify/`) +
`Applications/Restorify/Api` (`Fiuu.App.Restorify.Api.csproj`) +
`Applications/Restorify/Scheduler`. **Prebuilt artifact:**
`class-library/Fiuu.Reloads.Restorify.dll` — source lives under `Applications/Restorify`,
not in `class-library` (see [`../00-topology.md`](../00-topology.md) §4).

## Correction to the naming assumption: this is not a "restore failed transactions" module

The name "Restorify" reads like it should be about restoring/retrying failed reload
transactions. **The actual code says otherwise.** The models under `Restorify/Core/Models/`
are: `CalculatorCatalogue`, `CalculatorSubscriptionPlan`,
`CalculatorDealerSubscriptionPlan`, `CalculatorDealerSubscriptionBalance`,
`CalculatorDealerSubscriptionPlanCreditBalance`, `CalculatorBulkTransaction`,
`CalculatorTransaction`, `CalculatorSubscriptionPayment`, `CalculatorSubscriptionNotification`,
`CarbonCalculatorInfo`, `CarbonOffsetInfo`, `CarbonOffsetTransaction`,
`PricingPackage`, `DealerVATPackage`, `Project`, `ProjectBatch`, `ProjectBatchBalance`,
`ProjectBatchTransaction`, `ProjectType`, plus a family of `*WorkFlowContext` classes
implying an approval workflow, and report models
(`ReportCarbonCalculatorSubscriptionDetails/Summary`, `ReportCarbonCalculatorTransaction`,
`ReportCarbonCreditMovement`, `ReportCarbonOffsetTransaction`, `ReportDailySAP`,
`ReportPaymentEnquiry`, `ReportPOSAPIManualSubmission`).

**This is a carbon-credit / carbon-offset calculator and subscription-billing product**
("Restorify" appears to be its product/brand name), not a reload-transaction-recovery
engine: dealers subscribe to a carbon-offset pricing plan/package, run carbon
calculations, accrue/consume a credit balance, and get billed, with VAT handling
(`DealerVATPackage`) and SAP export (`ReportDailySAP`) alongside it. The `StatusController`
in `Restorify/Api` does still handle an `Acknowledge` callback for `MOLPayTransactionDetails`
(a MOLPay/Fiuu Cash payment gateway callback, judging by the field names `tranId`,
`orderid`, `status`, `domain`, `skey`, `appcode`) — so subscription payments themselves
likely flow through the main MOLPay/Fiuu Cash payment gateway, consistent with this
being a billing/subscription product rather than a reload-retry mechanism.

**This correction should be treated as reasonably confident** (it's based on directly
reading the actual model class names and one controller), but the business
purpose narrative above (dealer carbon-offset subscription product) is a synthesis, not
something stated explicitly in a comment anywhere — flagged as inference.

## Structure

- `Models/` — see above.
- `Providers/` — `ConfigurationProvider`, `Lookup`, `ReportProvider`, `TransactionProvider`,
  `WorkFlowProvider`, `Providers/SecureApi/` (not enumerated).
- `Services/` — `ApiService`, `AuditService`, `CacheService`, `ConfigurationService`,
  `CountryServiceLocator`, `OnlinePaymentService`, `ReportService`, `ServiceLocator`,
  `TransactionService`, `WorkFlowService`.
- `Exceptions/InvalidWorkFlowSwitchException.cs` — confirms the workflow/state-machine
  design implied by the `*WorkFlowContext` models.
- `Helpers/HttpClientHelper.cs`.

## `Restorify/Api`

- `Controllers/StatusController.cs` — `Version()` (health check) and
  `Acknowledge(...)` (MOLPay/Fiuu Cash payment callback handler, as described above).
  Only one controller was found under this API in this pass — a small, focused
  surface compared to the Terminal API.

## Dependencies

- `Reloads/Terminal/Api` has a `ProjectReference` to
  `Restorify/Core/Fiuu.Reloads.Restorify.csproj` (confirmed) — so the Terminal API can
  call into Restorify's services directly, alongside its own `CarbonCalculatorController`
  and `CarbonOffsetController` (see [`../web-api.md`](../web-api.md)) — those two
  controllers are almost certainly the Terminal API's entry points into this module,
  though the controller bodies themselves weren't read in this pass to confirm.
- **Not** `class-library/AWSCore` directly — a grep for `AWSCore` across all
  `.csproj` files found no reference from `Fiuu.Reloads.Restorify.csproj`. See the
  same open question in [`awscore.md`](awscore.md).

## Consumers

- `Reloads/Terminal/Api` (`CarbonCalculatorController`, `CarbonOffsetController` —
  inferred from controller naming, not confirmed by reading their bodies).
- `Restorify/Scheduler` — background job (see [`../console-app.md`](../console-app.md)).

## Related

- [[architecture/reload_db/restorify]] — the `RESTORIFY` database this product line persists to
- [[architecture/reload/01-overview]] — the naming correction (this is a carbon-offset billing product, not a transaction-recovery module) summarized at the top level
