# Glossary

A fast lookup layer on top of the deeper docs in `architecture/`,
`conventions/`, and `gitlab-analysis/` — not a duplicate of them. Every entry
here links back to the doc(s) it was drawn from; read this when you hit an
unfamiliar term mid-task, read the linked doc when you need the full picture.

Compiled entirely by mining what those three doc sets had *already*
established (component/module docs, convention write-ups, and GitLab
issue/MR history synthesis) — no new research was done to build this layer,
and no definition here goes beyond what those docs support. Where a term's
meaning is genuinely unresolved in the source material, it's marked
unresolved here too, not guessed at.

## Index

- [`business-and-partner-terms.md`](business-and-partner-terms.md) — what
  CEPP, TNG, INCOMM, RESTORIFY, SAP, EINVOICE, PREPAID, BILL_PAYMENT, MLookUp,
  RMS_OFFLINE, and the six newly-discovered `TRANSACTION` provider schemas
  (AnyPay, CelcomDigi, Giftee, MobilityOne, PrepayNation, RazerGold) actually
  are as business/partner concepts — plus the Fiuu/RMS/MOLPay rebrand
  history, RDS, BackOffice, and TerminalServer.
- [`process-and-tooling-jargon.md`](process-and-tooling-jargon.md) — GitLab
  label/category taxonomy, the four-spelling ticket-prefix mess
  (`GIT#`/`GIT-`/`GIT_`/`RMSO-`), the `deepcode_ai` review bot, `khenggek` (the
  fixed human reviewer), and the `MAINT` patch-script conventions (baseline
  vs. patch files, the `00_`/`NN_Verify` step pattern, the swap-table
  pattern, `DOWNTIME NEEDED`, and more).

## Acronym quick-reference

| Acronym / term | Full name or expansion | One-line meaning | Detail |
|---|---|---|---|
| **CEPP** | *(never expanded anywhere in the code)* | Master-data/back-office hub database + shared retail-POS transaction engine | [business terms](business-and-partner-terms.md#cepp) |
| **TNG** | Touch 'n Go | Malaysia e-wallet integration — reload, card, fund transactions | [business terms](business-and-partner-terms.md#tng) |
| **INCOMM** | InComm | US-based gift-card/stored-value processor integration | [business terms](business-and-partner-terms.md#incomm) |
| **INCOMM_TRANS** | (INCOMM transaction-side companion) | Terminal-facing activation/deactivation/reversal ledger for INCOMM | [business terms](business-and-partner-terms.md#incomm_trans) |
| **RESTORIFY** | *(brand name, not an acronym)* | Carbon-offset/sustainability-calculator subscription product — **not** a transaction-recovery module | [business terms](business-and-partner-terms.md#restorify) |
| **SAP** | Systems, Applications & Products (here: SAP Business One / SAP B1) | ERP/accounting integration for financial posting | [business terms](business-and-partner-terms.md#sap) |
| **EINVOICE** | e-Invoice(ing) | Malaysia statutory e-invoicing submission integration (LHDN/MyInvois inferred, unconfirmed) | [business terms](business-and-partner-terms.md#einvoice) |
| **PREPAID** | *(plain word)* | Legacy prepaid-product registration/enrolment tracking, not the sale itself | [business terms](business-and-partner-terms.md#prepaid) |
| **BILL_PAYMENT** | *(plain phrase)* | Bill-payment aggregator, one schema per biller/partner | [business terms](business-and-partner-terms.md#bill_payment) |
| **MLookUp** | Master LookUp | Small shared geography/telco lookup-code store, physically separate from CEPP's | [business terms](business-and-partner-terms.md#mlookup) |
| **RMS_OFFLINE** | Razer Merchant Services — "Reload Offline" | Consumer-facing self-service top-up web app + its database | [business terms](business-and-partner-terms.md#rms_offline) |
| **RMS** | Razer Merchant Services | Fiuu's former corporate name (pre-rebrand) | [business terms](business-and-partner-terms.md#fiuu-vs-rms--razer-merchant-services-vs-molpay) |
| **MOLPay** | *(legacy payment-gateway brand; not confirmed as a literal acronym)* | Fiuu's former payment-gateway brand, now called "Fiuu Cash" internally | [business terms](business-and-partner-terms.md#fiuu-vs-rms--razer-merchant-services-vs-molpay) |
| **Fiuu** | *(current brand name)* | The company's current name — rebrand from RMS/MOLPay, landed Feb–Mar 2024 | [business terms](business-and-partner-terms.md#fiuu-vs-rms--razer-merchant-services-vs-molpay) |
| **RDS** | *(unresolved — not expanded anywhere in the mined docs)* | Appears in `reload_db`'s GitLab project path/description and MR title tags | [business terms](business-and-partner-terms.md#rds) |
| **BackOffice** | *(plain phrase)* | The internal admin portal application (`BackOffice/Web` + `/Api`) | [business terms](business-and-partner-terms.md#backoffice) |
| **TerminalServer** | *(plain phrase)* | Legacy TCP socket server for physical POS terminal hardware | [business terms](business-and-partner-terms.md#terminalserver) |
| **AnyPay / CelcomDigi / Giftee / MobilityOne / PrepayNation / RazerGold** | *(partner/brand names)* | Six `TRANSACTION`-database provider schemas missing from the original schema vault | [business terms](business-and-partner-terms.md#transaction-provider-schemas-newly-discovered--missing-from-the-original-vault) |
| **GRN** | Goods Received Note | Stock-receipt record linking `TRANSACTION`'s stock flow to `INVENTORY_MASTER` | [business terms](business-and-partner-terms.md#shared-transaction-lifecycle-vocabulary) |
| **EOD / EOS** | End of Day / End of Shift | Recurring reconciliation-cycle pattern across nearly every provider database | [business terms](business-and-partner-terms.md#shared-transaction-lifecycle-vocabulary) |
| **ISO 8583** | International message-format standard for card-payment networks | Implemented from scratch for INCOMM's lower-level "stand-in" processing path | [business terms](business-and-partner-terms.md#shared-transaction-lifecycle-vocabulary) |
| **TIN** | Tax Identification Number | Supplier/buyer identity field on e-Invoicing records | [business terms](business-and-partner-terms.md#shared-transaction-lifecycle-vocabulary) |
| **SST** | Sales and Service Tax | Malaysian tax-registration field on e-Invoicing records | [business terms](business-and-partner-terms.md#shared-transaction-lifecycle-vocabulary) |
| **PGW** | Payment Gateway | A parallel controller/client surface in the Terminal API, distinct purpose not fully traced | [process/tooling](process-and-tooling-jargon.md#other-shorthand-seen-in-code-issues-and-patch-scripts) |
| **`Type::bug`** | GitLab label | Used on only ~1% of issues in both repos — most real defects surface elsewhere (see `Patch Request`/`Variance`) | [process/tooling](process-and-tooling-jargon.md#gitlab-label--category-taxonomy) |
| **`GIT#` / `GIT-` / `GIT_` / `GITnnnn`** | Ticket-prefix spelling variants | Four spellings, all referencing `offline-teams/reload` issue numbers | [process/tooling](process-and-tooling-jargon.md#ticket-tracker-prefix-variants) |
| **`RMSO-nnnn`** | Legacy Jira ticket ID | Pre-GitLab ticket system, bulk-migrated into GitLab issues on 2023-12-29 | [process/tooling](process-and-tooling-jargon.md#ticket-tracker-prefix-variants) |
| **`deepcode_ai`** | Automated review bot account name | AI merge-request reviewer, adopted ~13 June 2025, runs alongside the human reviewer | [process/tooling](process-and-tooling-jargon.md#deepcode_ai--the-automated-review-bot) |
| **`khenggek`** | Reviewer account (Kheng Gek Goh) | The fixed human lead reviewer across virtually every MR in both repos | [process/tooling](process-and-tooling-jargon.md#khenggek--the-fixed-human-reviewer) |
| **MAINT** | Maintenance (scripts) | `reload_db`'s root folder of hand-written SQL patch scripts — the only versioning system that exists | [process/tooling](process-and-tooling-jargon.md#maint-patch-script-conventions) |
| **SIT / UAT** | System Integration Testing / User Acceptance Testing | Pre-production environment stages referenced in `reload_db` MR titles | [process/tooling](process-and-tooling-jargon.md#environments-and-release-flow) |
| **PITR** | Point-In-Time Recovery | SQL Server recovery technique used in the Feb 2026 PIN-service data-corruption incident | [process/tooling](process-and-tooling-jargon.md#environments-and-release-flow) |
| **NOLOCK** | `WITH (NOLOCK)` SQL Server locking hint | Applied unconditionally on nearly every read stored procedure in the estate | [process/tooling](process-and-tooling-jargon.md#other-shorthand-seen-in-code-issues-and-patch-scripts) |

## What's *not* in this glossary

- Anything the source docs themselves flag as unresolved is repeated here as
  unresolved, not resolved by guessing — see the "Unresolved / open
  questions" section at the bottom of
  [`business-and-partner-terms.md`](business-and-partner-terms.md).
- No literal secrets, connection strings, or credentials — none exist in the
  source docs, and none were introduced here.
- Full architectural detail, code citations, and file:line evidence — that
  stays in `architecture/` and `conventions/`. This glossary only pulls the
  one-paragraph "what is this" layer out of those docs for fast lookup.

## Status

Done — first full pass, compiled 2026-09-06 from the completed `architecture/`,
`conventions/`, and `gitlab-analysis/` docs (the `reload/` broad pass, the
`reload_db/` overview + all module docs, all conventions docs, and all five
gitlab-analysis synthesis docs). Revisit if any of those source docs get a
second pass that changes a term's meaning (e.g. if `reload-portal.md`'s open
question is ever resolved).
