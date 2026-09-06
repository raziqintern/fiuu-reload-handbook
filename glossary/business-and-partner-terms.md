# Business & Partner Terms

One paragraph per term: what it actually is as a business/partner concept (not
just "a database" or "a folder"), which app/module implements it, and which
doc has the full detail. See [`process-and-tooling-jargon.md`](process-and-tooling-jargon.md)
for internal GitLab/patch-script jargon instead.

---

## Core integration terms

### CEPP

The central master-data and back-office administration hub — org hierarchy
(`Company → Dealers → Stores → Terminals`), users/roles, product/service
catalog, commission and margin-rate calculation, settlement rules, and shared
reference data (`LookupCodes`, `Country`, `Currency`, `Regions`, `States`).
It's the single most cross-referenced database in the whole estate (84 tables,
538+ stored procedures). It's *also* the name of the largest shared
class-library source component (`Components/CEPP`, 1,551 tracked files) — the
core retail/POS transaction engine (terminal/store/dealer lookup, commission
calculation, per-partner payment sub-modules for BillPayment/INCOMM/MOLPay/
OfflinePayment/Ticket) consumed by the Terminal REST API, the legacy terminal
socket server, and the BackOffice web portal alike. The acronym itself is
**never expanded anywhere** in the code or scripts read — treat "CEPP" as an
opaque legacy project codename, not a literal abbreviation.
Detail: [`architecture/reload_db/cepp.md`](../architecture/reload_db/cepp.md),
[`architecture/reload/class-library/cepp.md`](../architecture/reload/class-library/cepp.md).

### TNG

Touch 'n Go — Malaysia's dominant e-wallet/prepaid-card brand. As a business
integration, this covers e-wallet reload and card transactions initiated at
terminals. The integration is split across two layers: hardware/account
*provisioning* (TNG terminals, card readers, SAM serial numbers) lives inside
the `CEPP` database, while the transactional/reconciliation *ledger* (accounts,
wallets, card/fund transactions, host authentications, blacklists) lives in
the standalone `TNG` database and the `class-library/Reloads/TNG` source
module (merchant-key crypto, fund requests, card-transaction recording, and
"7-Eleven" settlement reporting — 7-Eleven is treated as a flagship TNG
dealer/channel throughout the codebase). Implemented by
`Reloads/Terminal/Api`'s `TNGController` → `MOLReloads/Core`'s `TNGService` →
`class-library/Reloads/TNG`, and also called directly from the legacy terminal
socket server's `TNGProfileHandler`.
Detail: [`architecture/reload_db/tng.md`](../architecture/reload_db/tng.md),
[`architecture/reload/class-library/reloads-tng-game.md`](../architecture/reload/class-library/reloads-tng-game.md),
[`architecture/reload/diagrams/tng-reload-flow.md`](../architecture/reload/diagrams/tng-reload-flow.md).

### INCOMM

InComm — a US-based prepaid/gift-card processor. The Fiuu-side integration
mirrors InComm's own formal, staged request/response API lifecycle
(`ApplicationRequests` → `MRequestStageId`/`MRequestStatusId`) for gift-card
activation, deactivation, and transfer-value operations, plus a separate
"RTG" request/transaction pattern (not expanded in the scripts — plausibly
"Real-Time Gift," unconfirmed). Two Fiuu-side databases split the role: this
one (`INCOMM`) holds the partner-API request/response envelope; `INCOMM_TRANS`
(below) holds the terminal-facing activation/deactivation/reversal ledger.
Implemented in code by `Components/CEPP/Payment/INCOMM`
(`Fiuu.Reloads.GiftCard`, exposed via `GiftCardController`/`GiftCardService`)
for the live plain-HTTPS-JSON path, and by `class-library/Secure/Incomm` for a
from-scratch ISO 8583 card-message framework used for lower-level "stand-in"
processing when the live host is unreachable — exactly when each path is used
was not confirmed in the source docs.
Detail: [`architecture/reload_db/incomm.md`](../architecture/reload_db/incomm.md),
[`architecture/reload/class-library/secure.md`](../architecture/reload/class-library/secure.md),
[`architecture/reload/diagrams/giftcard-incomm-flow.md`](../architecture/reload/diagrams/giftcard-incomm-flow.md).

### INCOMM_TRANS

The transaction-side companion database to `INCOMM` (above): activation/
deactivation transactions, a "stand-in" fallback activation path for when the
primary path is unavailable, reversal operations, and end-of-day/end-of-shift
processing. Where `INCOMM` models the partner-API envelope, `INCOMM_TRANS`
models what actually happens at a store when a gift card gets activated.
Tightly coupled to `INCOMM` (same `ProductId`/`DealerId`/`StoreId`/`TerminalId`
shape) and receives from `TRANSACTION.dbo.ApiGiftCardTransactions`.
Detail: [`architecture/reload_db/incomm-trans.md`](../architecture/reload_db/incomm-trans.md).

### RESTORIFY

Despite the name, RESTORIFY is **not** a transaction-recovery/retry
mechanism — that's a naming trap the source docs explicitly correct. It's the
brand name for Fiuu's carbon-offset / sustainability-calculator product line:
dealers subscribe to a plan, run carbon-offset purchase calculations against a
project's carbon credits, and optionally check out through STACS (a
third-party carbon-registry/exchange integration) to have a carbon certificate
issued, with VAT handling and SAP export built in. Implemented by
`Applications/Restorify/Core` + `/Api` + `/Scheduler` (prebuilt as
`Fiuu.Reloads.Restorify.dll`) and the `RESTORIFY` database (`dbo`/`STACS`/
`TRANS` schemas). Subscription payments themselves appear to route through the
main MOLPay/Fiuu Cash payment gateway (see the Fiuu/RMS/MOLPay entry below),
not a bespoke payment path.
Detail: [`architecture/reload/class-library/reloads-restorify.md`](../architecture/reload/class-library/reloads-restorify.md),
[`architecture/reload_db/restorify.md`](../architecture/reload_db/restorify.md).

### SAP

SAP — the German enterprise-software vendor; here specifically **SAP Business
One (SAP B1)**, Fiuu's back-office accounting/ERP system. The `SAP` database
(added 2025, missing from the original schema vault) is a staging area for
documents (`Submissions`/`SubmissionItems`, using SAP B1's own field
vocabulary — `CardCode`, `DocEntry`, `DocType`, `U_EIV_*` user-defined fields)
destined to be posted into SAP B1 for financial reconciliation. The `U_EIV_`
field prefix almost certainly stands for "E-Invoice," tying this database to
`EINVOICE`'s domain even though no confirmed cross-database join exists
between the two — they're a strong naming/domain inference of two parallel
downstream systems fed from the same sales data, not a proven one-feeds-the-
other relationship. Also see `CEPP.dbo.DealerGroupSAPItemCode` (a second,
CEPP-side SAP item-code mapping) and `Applications/SAP` (a standalone console
export tool).
Detail: [`architecture/reload_db/sap.md`](../architecture/reload_db/sap.md),
[`architecture/reload_db/00-overview.md`](../architecture/reload_db/00-overview.md).

### EINVOICE

Malaysia's national e-Invoicing compliance mandate — submitting invoice data
to a government e-invoicing platform. The `EINVOICE` database (also missing
from the original vault) holds `Submissions`/`Invoices`/`InvoiceItems` (with
an `AFTER INSERT` trigger auto-generating formatted invoice numbers from six
dedicated SQL sequences) plus a set of `Report_*` stored procedures for
MyInvois-style compliance reporting (Consolidated Gross Sales, Prepaid Dealer
Commission, Credit/Debit Notes, End-Customer invoices). **The specific
external gateway (LHDN/MyInvois/IRBM) is an unconfirmed inference** — no
literal mention of any of those names was found anywhere in the
`EInvoice/Core` source that submits to it (only a generically-configured
`EInvoiceApiUrl` app setting). Implemented by `Applications/EInvoice/Core` +
`/Scheduler` — a recurring, still-active *monthly* resubmission patch pattern
("EInvoice Consolidated Gross Sales Invoice Resubmissions") has run every
month since Feb 2025 with no sign of becoming a one-time integration cost.
Whether `RMS_OFFLINE.dbo.EInvoiceRequests` (the consumer-app-side request)
feeds `EINVOICE.TRANS.Submissions` directly is unresolved.
Detail: [`architecture/reload/class-library/einvoice.md`](../architecture/reload/class-library/einvoice.md),
[`architecture/reload_db/einvoice.md`](../architecture/reload_db/einvoice.md),
[`architecture/reload/diagrams/einvoice-submission-flow.md`](../architecture/reload/diagrams/einvoice-submission-flow.md).

### PREPAID

A smaller, legacy-leaning database modeling prepaid-product
*registration/enrolment* — a dedicated registration-eligible product catalog
plus a registration record carrying an identity-verification field
(`MIdentityTypeId`, consistent with Malaysia's telco prepaid-SIM registration
requirements) and its audit trail. This is **not** the day-to-day prepaid
("Pinless") sale itself — that lives in `TRANSACTION.dbo`. Self-contained;
not wired into the main `TRANSACTION` → provider → `REPORTSUMMARY` settlement
flow.
Detail: [`architecture/reload_db/prepaid.md`](../architecture/reload_db/prepaid.md).

### BILL_PAYMENT

The bill-payment aggregator database: one small integration schema per
biller/partner (`ASTRO`, `ATX`, `AnyPay`, `Digi`, `EPay`, `IIMMPACT`, `IWK`,
`MBMB`, `MobilityOne`, `Panda`, `PayLink`, `RazerPay`, `REDONE`, `Syabas`,
`TELEKOM`, `TNB`, `UMOBILE`, `YTL` — 18 in total) plus a shared `TRANS` schema
for the biller-agnostic payment-order/void/EOD workflow. That `TRANS` shape
(`PaymentOrders → PaymentTransactions`) is a cross-module *convention*, not a
shared physical table — `TICKET` has an independently-defined `TRANS` schema
with identical column names for the same purpose.
Detail: [`architecture/reload_db/bill-payment.md`](../architecture/reload_db/bill-payment.md).

### MLookUp

A small, separate shared lookup-code database. Despite the superficial
similarity to `CEPP.dbo.LookupCodes`, `MLookUp.dbo.LookupCodes` is a
**physically different table** — modules that reference "MLookUp" in the
top-level architecture diagram are reading *this* table, not CEPP's. It's more
geography/telco-flavored than CEPP's: a currency-scoped `Regions` table (keyed
`MRegionId`+`MCurrencyId`, distinct from CEPP's simple `Regions`),
`PhoneBooks` dialing-profile lookups, and `IPAddressToCountries` geolocation
(presumably for fraud/compliance checks). The "M" follows the same
Master-lookup FK-naming convention used throughout the codebase (see
`MStatusId`, `MWorkFlowStatusId`, etc.).
Detail: [`architecture/reload_db/mlookup.md`](../architecture/reload_db/mlookup.md),
[`conventions/naming.md`](../conventions/naming.md).

### RMS_OFFLINE

Powers the consumer-facing "Reload Offline" self-service web app: its own
separate consumer identity system (GUID-keyed `Users`, not CEPP's int-keyed
back-office `Users`), a simpler/flatter product catalog, a full reward-
campaign/cashback engine, payment transactions, CMS content (FAQ/Footer/
HomePage), and e-invoice requests. Architecturally the "odd one out" in the
estate — only loosely coupled to `CEPP` (`Partners.MOLPayMerchantId`,
`Products.CountryId`), and not part of the main `TRANSACTION` → provider →
`REPORTSUMMARY` flow the rest of the platform follows. Also the connection-
string alias (`RMS_Offline`) used by `Fiuu.Database`'s Dapper data-access
layer, and the database the standalone `Notification/Api/Core` project reads/
writes directly. The "RMS" in the name is a fossil of the company's former
brand — see the Fiuu/RMS/MOLPay entry below.
Detail: [`architecture/reload_db/rms-offline.md`](../architecture/reload_db/rms-offline.md),
[`architecture/reload/class-library/database.md`](../architecture/reload/class-library/database.md).

---

## TRANSACTION provider schemas (newly discovered — missing from the original vault)

`TRANSACTION` gives one SQL schema per external reload/payment provider (see
[`architecture/reload_db/transaction.md`](../architecture/reload_db/transaction.md)
and [`architecture/reload_db/vault-drift-notes.md`](../architecture/reload_db/vault-drift-notes.md)
§3). Six of these schemas exist live but were absent from the original
Obsidian schema vault entirely:

| Schema | What it is |
|---|---|
| **AnyPay** | A reload/pinless provider (same table shape as `Panda`/`LoadCentral`). Broadly integrated — also has its own `BILL_PAYMENT.AnyPay` schema, a `Pin/Core` `AnyPaySecureProvider`, a `Pinless/Core` secure provider, and its own AWS Secrets Manager label group — not a one-off. |
| **CelcomDigi** | The post-merger combined telco integration for Celcom + Digi (Malaysia's Celcom and Digi telcos merged in 2022). Likely supersedes or runs alongside the pre-existing standalone `Celcom` schema. |
| **Giftee** | A gift-card/e-voucher provider integration; also has a dedicated `GifteeSecureProvider` and response-code enum in `Pin/Core`. |
| **MobilityOne** | Has a schema in both `BILL_PAYMENT` (already in the vault) and `TRANSACTION` (missing from it) — the `TRANSACTION`-side schema is this integration's transaction-side counterpart to the bill-payment side. |
| **PrepayNation** | An international prepaid/airtime aggregator; also a `Pinless/Core` secure provider. |
| **RazerGold** | Razer's own gaming-credit/gift-card brand. Notable because Fiuu was formerly **Razer Merchant Services** — this is a direct-to-former-parent-brand integration, not an arm's-length third party (also present as a `Pin/Core` `RazerGoldSecureProvider` with its own credentials-type enum). |

---

## Other partner/provider names you'll encounter

These aren't individually called out in the task brief but recur constantly
across `TRANSACTION`, `BILL_PAYMENT`, `Pin`/`Pinless`, and `class-library/Secure` —
worth a one-line translation so they don't read as noise:

| Name | One-line meaning | Where it shows up |
|---|---|---|
| **ATX** | A pinless/reload and bill-payment provider | `TRANSACTION`, `BILL_PAYMENT`, `Pin/Core` |
| **Astro** | Malaysian satellite TV / digital services provider (bill-payment/reload) | `BILL_PAYMENT`, `class-library/Secure/Astro` |
| **DTOne** | An international telco/airtime aggregator | `TRANSACTION`, `Pinless/Core` |
| **Digi** | A Malaysian telco (see also CelcomDigi post-merger) | `BILL_PAYMENT`, `Pinless/Core` |
| **IIMMPACT** | A bill-payment/pinless service provider; a recurring source of failed-transaction reprocessing patch requests per the GitLab history | `TRANSACTION`, `BILL_PAYMENT`, `Pin/Core` |
| **JomPay** | A Malaysian bill-payment/e-payment rail | `TRANSACTION`, AWS secret labels |
| **PayLink** | A bill-payment provider | `TRANSACTION`, `BILL_PAYMENT` |
| **Panda** | A pinless/reload provider | `TRANSACTION`, `BILL_PAYMENT` |
| **Richtech**, **UMobile**, **YTL** | Telco/reload providers | `TRANSACTION`, `Pinless/Core` |
| **LoadCentral**, **NPN** | Reload/pinless aggregators | `TRANSACTION`, `Pin/Core` |
| **EPay**, **REDONE**, **Syabas**, **TNB**, **TELEKOM**, **MBMB**, **IWK** | Malaysian billers (utilities, telco, municipal) | `BILL_PAYMENT` |
| **RazerPay** | A biller schema with its own runtime `Configurations` table (unusual — most partner config lives in the shared `CONFIGURATION` database instead) | `BILL_PAYMENT` |
| **Ticket2U** | A Malaysian e-ticketing/voucher platform | `TICKET` database |
| **STACS** | Third-party carbon-registry/exchange infrastructure where a carbon certificate is actually issued | `RESTORIFY.STACS` schema |
| **7-Eleven / "SevenE"** | Treated as a first-class distribution channel with its own dedicated commission tables (`SevenEProduct`, `SevenECommissionRate`, etc.) and its own report-generation parameter (`@DealerId=1`), not just another dealer | `CEPP`, `REPORTSUMMARY`, `class-library/Reloads/TNG` |
| **PGW** | "Payment gateway" — a parallel controller surface (`Pgw_*Controller`) in the Terminal API alongside the main controllers; exact difference from the non-`Pgw_` equivalents wasn't traced | `Reloads/Terminal/Api` |

---

## Shared transaction-lifecycle vocabulary

- **EOD / EOS** — End of Day / End of Shift. A recurring reconciliation-cycle
  pattern (`EndOfDays`/`EndOfDayDetails`, or provider-specific variants like
  `PaymentEndOfDays`/`PaymentEndOfShifts`) that appears in nearly every
  provider database (`TRANSACTION`, `BILL_PAYMENT`, `INCOMM_TRANS`) — it's how
  a terminal's reported totals get reconciled against the system's own
  records at the end of a business day/shift, with `MVarianceTypeId`
  classifying any mismatch found.
- **GRN (Goods Received Note)** — the record of physical/virtual stock
  arriving from a supplier; `INVENTORY_MASTER.dbo.Stocks.GRNId` links back to
  `TRANSACTION.dbo.GoodReceivedNotes`.
- **ISO 8583** — the international standard message format for card-payment-
  network transactions. Implemented from scratch in `class-library/Secure/Incomm`
  for INCOMM's lower-level "stand-in" processing path (see the INCOMM entry
  above); not used by the plain-HTTP path other integrations use.
- **TIN / SST** — Tax Identification Number and Sales and Service Tax:
  identity/registration fields required on every e-Invoicing record
  (`EINVOICE.TRANS.Invoices.SupplierTIN`/`BuyerTIN`, SST registration
  numbers).
- **Order/transaction pair pattern** — a recurring shape across the whole
  estate: a commercial "order" row (`SalesOrders`, `PaymentOrders`,
  `MOLPayOrders`, `AllocationOrders`, ...) paired with a "transaction"/"item"
  child (`SalesTransactions`, `PaymentTransactions`, ...). See
  [`architecture/reload_db/transaction.md`](../architecture/reload_db/transaction.md).

---

## Company & product terms

### Fiuu vs. RMS / Razer Merchant Services vs. MOLPay

The company operating this platform has rebranded twice, and all three names
persist as fossils throughout the codebase, database, and ticket history:

- **RMS (Razer Merchant Services)** — the company's identity before the
  current rebrand. Visible today in `RMS_OFFLINE` (the database/connection
  alias), `RMSAuthController` (the Terminal API's auth base class), the
  `RMSO-nnnn` legacy ticket-prefix (see
  [`process-and-tooling-jargon.md`](process-and-tooling-jargon.md)), and the
  `RazerGold`/`RazerPay` partner integrations (a direct-to-former-parent-brand
  relationship, not arm's-length).
- **MOLPay** — an earlier payment-gateway brand name (predating even "RMS" as
  the everyday name used in code): `MOLPayOrders`/`MOLPayTransactions` tables,
  the `MOLPayMerchantId` column on `RMS_OFFLINE.dbo.Partners`, the
  `MOLReloads/Core` application folder, and the `MOL.Notification.Client.dll`/
  `MOL.Reload.Sdk` artifacts (the "MOL" prefix predates the `Fiuu.App.*`
  naming convention used everywhere else). The `Restorify/Api`
  `StatusController.Acknowledge` callback still handles a "MOLPay/Fiuu Cash"
  payment-gateway callback — i.e. MOLPay is now referred to internally as
  **Fiuu Cash**.
- **Fiuu** — the current brand. The [rebrand timeline](../gitlab-analysis/reload-timeline.md)
  shows it landing across the codebase and tooling in **Feb–Mar 2024**: "RMS
  Offline Portal" → "Fiuu Offline Portal" (#1000), "RMS BackOffice" → "Fiuu
  BackOffice" (#1007), terminal receipt logo change (#1008), Razer → Fiuu
  email addresses (#1023) — with cleanup tickets renaming remaining "MOL"/
  "RMS" references continuing as late as **Aug 2025** (#1978). Current
  prebuilt-artifact naming (`Fiuu.CEPP.dll`, `Fiuu.Logging.dll`, etc.) and the
  `git2u.fiuu.com` GitLab host reflect this final name.

**Rule of thumb:** if you see "RMS" or "MOL" anywhere in code, config, a
database name, or a ticket prefix, it's a pre-rebrand fossil referring to the
same company now called Fiuu — not a different, separate entity.
Detail: [`gitlab-analysis/reload-timeline.md`](../gitlab-analysis/reload-timeline.md)
("2024 — Rebrand" section).

### RDS

Appears in the `reload_db` repo's actual GitLab project path
(`server/offline/rds/reload`) and project description ("reload under RDS
(for database script)"), and as a `{RDS}` tag in `reload_db` MR titles (e.g.
`[main] {RDS} GIT#1857, GIT#1858`). **What "RDS" itself stands for is not
expanded anywhere in the mined docs** — it plausibly refers to Amazon RDS
(the databases are AWS-adjacent, per the AWS Secrets Manager integration
documented in `awscore.md`) or is simply the DB team's internal grouping name
for "the database repo/estate." Flagged as unresolved rather than guessed
further.
Detail: [`gitlab-analysis/reload_db-tribal-knowledge.md`](../gitlab-analysis/reload_db-tribal-knowledge.md).

### BackOffice

The internal admin portal application — `BackOffice/Web` (a large ASP.NET
WebForms VB.NET app, 1,346 tracked files, the biggest single application in
the repo) for dealer/store/terminal/product/commission/wallet administration,
plus a smaller `BackOffice/Api` serving its AJAX/JSON calls. This is the
application this handbook maps the brief's requested "web_app" name onto —
see the open question about whether a separate "reload_portal" exists in
[`architecture/reload/reload-portal.md`](../architecture/reload/reload-portal.md).
Detail: [`architecture/reload/web-app.md`](../architecture/reload/web-app.md),
[`architecture/reload/web-api.md`](../architecture/reload/web-api.md).

### TerminalServer

`Reloads/TerminalServer/Console` — a VB.NET Windows console/service hosting a
custom raw **TCP socket server** that physical POS terminal hardware connects
to directly, as the older/legacy alternative to the modern REST Terminal API.
Roughly 60 `MessageHandlers` classes route inbound socket messages by type
(TNG, InComm, OfflinePayment, BillPayment, Pinless, Restock, Sales, etc.). Its
companion `TerminalServer/ControlPanel` is a WinForms operator console for
monitoring/controlling the socket-server service. A confirmed cause of at
least one incident (#1892 — TNG sales silently stopped overnight with no
alert firing).
Detail: [`architecture/reload/terminal-application.md`](../architecture/reload/terminal-application.md).

---

## Unresolved / open questions carried over from the source docs

Per handbook policy, these are flagged here rather than guessed at:

- **`reload_portal`** — no separate codebase distinct from `BackOffice/Web`
  was found; genuinely unresolved pending a human answer. See
  [`architecture/reload/reload-portal.md`](../architecture/reload/reload-portal.md).
- **CEPP** — the acronym is never expanded anywhere in code or scripts.
- **RDS** — see above; not expanded in the mined docs.
- **EINVOICE's external gateway identity** — LHDN/MyInvois/IRBM is a strong
  but *unconfirmed* inference; no such string appears in the submitting code.
- **RTG** (an INCOMM request/transaction pattern) — plausibly "Real-Time
  Gift," not confirmed.
- **`MOL.Notification.Client.dll`'s source** — not conclusively located; may
  be a genuinely separate, older assembly with no source in this checkout.
- **SAP ↔ EINVOICE relationship direction** — parallel-not-linked is the
  working assumption, not a confirmed fact.
