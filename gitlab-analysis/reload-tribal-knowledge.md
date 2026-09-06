---
tags: [gitlab-analysis, repo/reload]
aliases: ["Reload Tribal Knowledge"]
---

# Reload — Tribal Knowledge

Synthesized from the full issue history of `offline-teams/reload` on git2u.fiuu.com
(project id 747): **2,604 issues**, created 2022-07-15 through 2026-09-05 (today).
Every issue's full metadata (title, description, labels, milestone, author, dates)
was pulled and scanned. Deep-dive (full discussion threads) was done for: all 8
`Incident`-labeled issues, all issues carrying `Type::bug` with notable discussion,
and a keyword-clustered sample of the `Patch Request`/`Variance` categories (the
two largest categories by volume). The `Patch Request`/`Variance` root-cause claims
below are pattern-level (grounded in dozens of title-level citations each), not a
line-by-line read of all 650 of those tickets — treat the specific issue numbers
cited as representative examples, not an exhaustive list.

No customer PII, credentials, card/PIN serials, or literal transaction/phone
numbers from ticket bodies are reproduced here — patterns are described, with
issue numbers as the pointer back to the original (internal-only) detail.

---

## 1. The single most useful thing to know: where bugs actually live

Only **27 of 2,604 issues (about 1%)** carry the `Type::bug` label. If you go
looking for "what breaks in this system" by filtering on that label, you will
find almost nothing — and conclude, wrongly, that this is a very stable system.

In reality, defects in Reload overwhelmingly surface as one of:

- A plain `[Issue]`-titled ticket with no `Type::bug` label at all (many of the
  `Type::bug` tickets that *do* exist are also titled `[Issue] ...` — the bracket
  category and the label are applied inconsistently by whoever files it).
- A **`Patch Request`** — a one-off data-fix ticket asking IT to run a script
  against production data to correct the *symptom* of a bug (a stuck transaction,
  a missing record, a wrong status) without necessarily following up with a code
  fix. This is the single largest category in the whole project: **445 of 2,604
  issues (17%)**.
- A **`Variance`** ticket — a reconciliation mismatch between Reload's own records
  and a partner/service-provider's records, discovered during monthly settlement.
  **205 of 2,604 issues (8%)**.

Together, `Patch Request` + `Variance` + un-labeled `[Issue]` tickets vastly
outnumber formally-labeled bugs. **A new engineer should search by category
bracket and by keyword, not by `Type::bug` label, when trying to understand what
actually goes wrong in this system.**

---

## 2. Recurring bug classes, by root cause

### 2.1 Validators fire on fields the current user can't even see

WebForms mandatory-field validation is wired per-page, not per-visible-tab/role,
so a validator on a field in a tab a given role never opens still blocks Save:

- **#2454** — Finance-only users (who only see the "SAP Settings" tab on Edit
  Dealer) were blocked from saving because mandatory-field validators for fields
  on *other, hidden* tabs still fired. Fix: check the user's role and only run
  the validators relevant to what they can see.
- **#2168** — Creating a Consignment Dealer threw a false "please fill up
  mandatory fields" popup (the save still succeeded after dismissing it) because
  a Wallet Type validator meant only for Prepaid Dealers was also being applied
  to Consignment Dealers.

Same underlying shape both times: **a validator's scope (which fields/roles/dealer
types it should apply to) drifts from what the page actually shows.** When adding
a new tab, role, or dealer type to an existing multi-purpose form, check every
validator on that page, not just the fields you're adding.

### 2.2 Dropdown reset to its placeholder value isn't guarded before use

- **#2190 ("Exception 43")** — `PurchaseOrderCreate.aspx.vb`: selecting a
  supplier then changing the dropdown back to `-Please Select-` and saving
  throws `Conversion from string "" to type 'Integer' is not valid` — the
  placeholder's empty string flows straight into an `Integer` conversion with no
  guard.

This is the same general anti-pattern the codebase has elsewhere (unguarded
`TextBox`/dropdown value flowing into a strictly-typed property) — see
`StockAllocationEdit.aspx`/`StockEnquiryList.aspx.vb` for other known instances.
**Any new dropdown-driven page should be checked for a guard against the
placeholder/default option, not just against blank text input.**

### 2.3 Pin-service and Pinless-service features/fixes ship independently and drift apart

Reload treats "Pin" (physical/downloadable pin) and "Pinless" (direct API credit)
as separate implementations of conceptually the same product line, and fixes to
one routinely don't get mirrored to the other:

- **#2108** — Refund transactions for both Pin and Pinless share the same
  `EnumTopUpType.Refund` enum value internally, but the Monthly Statement
  Report's Pinless dropdown never included that refund type — Pinless refunds
  were invisible in reporting while Pin refunds worked fine.
- **#1857** / **#1858** — The int→bigint primary-key migration (see §4) was
  filed and executed as **two separate tickets**, "PIN Service" and "Non-Pin
  Service", specifically because Pinless tables had *already* been migrated to
  `bigint` independently while Pin tables hadn't (#1858 notes
  `ApiPinlessTransactions`/`PinlessSalesTransactions` were already bigint).
- Numerous CRs integrate a partner's Pinless product as a standalone effort
  separate from that partner's existing Pin integration (e.g. Umobile Pinless
  Direct #1102, Umobile Pinless migrating to a new eRecharge platform #1684,
  Digi Pinless Direct #873, CelcomDigi Pinless #1511) — each is its own
  multi-week integration, not a shared code path extension.

**When touching a Pin-service feature or fixing a Pin-service bug, check whether
the Pinless equivalent has (or needs) the same treatment, and vice versa** — the
two are close enough in concept that reviewers and reporters routinely assume
parity that the code doesn't actually have.

### 2.4 Partner date/time and unit-format contracts are a recurring integration trap

- **#2551** — 7-Eleven's staging UAT rejected an otherwise-successful topup
  response because Reload's expiry-date field included a time component; Fiuu's
  own POS API spec says expiry should be date-only. Fix was purely
  format-truncation, not logic.
- **#2346** — JomPay topup confirmation emails showed amounts 100x too large
  (e.g. an intended "MYR 30000.00" render as "MYR 3000000.00") because the
  amount arrives from the API in cents (integer) and wasn't divided by 100
  before formatting as decimal. The same ticket also found the email is sent
  *before* the balance is updated, so the "new balance" shown is actually the
  pre-topup balance.
- **CR #2328** ("Transaction datetime from Merchant different with Server
  datetime") and reviewer khenggek's recurring comment on merge requests (e.g.
  `!613`: *"You should always use the transactiondatetime from merchant. Not
  current datetime."*) — using `DateTime.Now` instead of the merchant/partner
  -supplied transaction timestamp is a repeat mistake serious enough to be both
  a standing review comment and its own CR to fix after the fact.

**Whenever a change touches a value that crosses a partner boundary (amount,
date, timestamp), check the unit/format the *partner* expects, not just what's
convenient internally** — cents vs. ringgit and date-only vs. datetime are both
real, previously-shipped bugs here.

### 2.5 Notification-URL / redirect double-update races cause duplicate transactions

- **#1483** — Online TopUp had duplicate transaction records because both the
  webhook-style Notification URL callback *and* the browser's redirect-back both
  independently updated payment status, racing each other. Root-cause fix:
  disable the Notification URL update path and rely solely on the browser
  redirect. (683 affected records had to be identified and manually reversed by
  Finance/Procurement.)

This is a classic payment-integration idempotency gap: **any flow with two
independent "payment completed" signals (webhook + redirect, or two different
partner callbacks) needs one of them to be authoritative, or a
dedupe/idempotency key**, not "whichever arrives" logic.

### 2.6 Crypto/session-resource leaks show up as "gets slow over hours, a restart fixes it — for a while"

- **#2592** — TNG reload transactions crept up from normal to as long as two
  hours to complete. Root cause: every transaction opened a `.pfx` certificate
  file from disk and RSA-decrypted a session key *from scratch*, twice per
  reload, and never released the handle. Windows serializes access to crypto key
  material, so as unreleased handles piled up, each lookup got slower — and
  because this happened inside a per-account lock, the slowdown queued behind
  itself. A restart cleared the in-memory handles, which is why the symptom
  would disappear and then slowly return.

**If a fix for a "things get slow over time, restart fixes it" report is being
scoped, check for exactly this shape** — a per-request open-and-never-release of
an OS-level or crypto resource inside a hot path, especially anything gated by a
per-account/per-resource lock (the lock is what turns "slightly slower" into
"multi-hour queue").

### 2.7 ID column capacity is a real, tracked risk — not theoretical

- **#1857** — As of June 2025, several Pin-service transaction tables
  (`ApiStockTransactions`, `ReStockTransactions`, `SalesTransactions`, etc.) had
  `int` primary keys already at roughly 30–65% of the 32-bit signed max
  (2,147,483,647) — `ReStockOrderItems` alone was at ~947 million (~44%).
  Resolved by migrating all Pin-service tables (plus their `REPORTSUMMARY`
  snapshot counterparts) to `bigint`.
- **#1858** — the matching migration for non-Pin-service tables, done as a
  second, separate effort.

**Before adding a new high-write-volume feature on an existing `int` identity
column, check current max(id) against int32 max** — this system has genuinely
hit that ceiling before, twice, on different table families.

### 2.8 The double exception-logging anti-pattern is a recurring, explicitly-named review complaint

Reviewer khenggek flags this same shape repeatedly across otherwise-unrelated
MRs (`!844`, `!470`, `!334`): a method catches an exception, writes it to the
event viewer/log, and **rethrows** — but the *caller* also has its own
catch-log-rethrow, so the same error gets logged twice under different
call-stack framing, which is actively misleading during incident triage ("There
is no point in writing to viewer and throw the same exception again... This
will cause it to write to event viewer twice for the same error and will be
misleading."). See §3 in the review checklist for the concrete rule.

---

## 3. Incidents (all 8 in the dataset)

| # | Date | Component | Root cause (nature, not amount) |
|---|---|---|---|
| #97 | Jan 2023 | eWallet payment API | Wrong enum value (`authorizationcodeType`) sent to a service provider vs. what their API expected — a partner API-contract mismatch, ~336 transactions affected |
| #1221 | Jun 2024 | Offline Portal | Man-in-the-middle attack detected via an unrelated exception email; portal services were disabled within ~2 hours of discovery |
| #1525 | Dec 2024 | 7-Eleven Middleware (PGW) | Elevated error-rate alert; traced to the payment gateway/partner side, not Reload's own API — first of two similar alerts (see #2257) |
| #1736 | Apr 2025 | SAP B1 ↔ BackOffice sync | A dealer-group migration request (moving a merchant between Prepaid and Consignment models) wasn't executed with a matching balance-zeroing control, producing a large stock/balance discrepancy discovered during monthly reconciliation |
| #1772 | Apr 2025 | BackOffice (dealer config) | Same class as #1736 on a smaller scale — a prepaid-to-consignment model switch requested by email/GIT approval without a financial-loss event |
| #1892 | Jun 2025 | Terminal Server (Windows app) | Unhandled exception silently reduced then stopped incoming TNG sales overnight over a weekend with no alert firing; alerting gap was found and closed afterward |
| #2214 | Dec 2025 (reported; period was Jun–Jul 2025) | Terminal API (Shopee/Umobile Pinless) | Transaction-count/amount variance against a partner's own records, only surfaced when the partner asked about it — a reconciliation-detection lag, not a live incident |
| #2257 | Jan 2026 (reported; period was Dec 2025) | Terminal API / 7-Eleven Middleware | Same alert class as #1525, over a year apart — see note below |

**Pattern worth flagging on its own:** the 7-Eleven middleware integration
(#1525, #2257) has triggered the same class of "error statistic" alert twice,
over a year apart, both requiring the same triage playbook (CloudWatch,
DB-record cross-check against the partner). If working on this integration,
check whether the earlier incident's remediation (a Telegram/T-gateway alert
mechanism was requested after #1525) actually caught #2257 sooner, or whether
the monitoring gap reopened.

Also note: two of the eight incidents (#1736, #1772) are not system defects at
all — both stem from **a business-side dealer-model change (Prepaid ↔
Consignment) being actioned without the matching balance-reset step**. If you
handle one of these change requests, treat "zero out / reconcile the balance"
as a mandatory paired step, not an optional cleanup.

---

## 4. Ongoing architecture/tech-debt cleanup (2023–2026)

A cluster of `Enhancement`-category tickets, all filed the same day (2023-12-29,
part of a bulk Jira-to-GitLab ticket migration, original Jira ids `RMSO-xxxx`),
recorded a tech-debt backlog that has been worked down gradually since:

- Move file uploads from local-disk-then-sync to direct S3 (#842)
- Move DB connection strings and later service-provider credentials and
  encryption keys into AWS Secret Manager (#843, #1279, #2298, #2080) — this is
  a recurring, still-active migration pattern; the most recent instance in the
  dataset is #2609 (Sep 2026, XOX credentials)
- Standardize logging onto NLog (#845), consolidate per-server log streams
  (#840, #1091–1093, #1354)
- Adopt Dapper ORM (#846); move inline SQL to stored procedures (#1423)
- Upgrade to .NET Framework 4.8 (#849)
- Replace 3DES with AES on terminal encryption, per terminal model (#852–854)

More recent structural moves:

- **#2018** (Aug 2025) — removed several unused applications/projects
  (`Reload`, `MOLPayTransactionGenerator`, `CodeGenerator`, `PinImporter`,
  `TestPOC`, `IncommFramework`) and began retiring the `MOL.Reload.Sdk` project.
- **#2468** (May 2026) — moving core modules (`Provider`, `Logging`, `Lookup`,
  `MasterFramework`, `CEPP`, `Patching`, `EInvoice`, `Reloads` and its
  sub-modules) out of the application repo's `Components` folder and into the
  separate Class Library repository, aligned to functional boundaries.
- A steady stream of 2025–2026 "Consolidate X for easier maintenance" tickets
  (schedulers #1770/#2373, BackOffice reports #1779, Power BI reports #1825,
  Terminal Server handler versions #2504, stored procedures #2513) — the team is
  actively working down duplication across similar-but-separately-built
  components.

**If you're extending a Scheduler, a report, or a Terminal Server handler,
check the relevant consolidation ticket first** — there's a good chance the
"canonical" version is meant to absorb the one you're about to copy-paste from.

---

## 5. Module/domain glossary anchors seen in this data

(Cross-reference with `glossary/README.md` and `architecture/README.md` once
populated — these are the terms that showed up constantly across issues.)

- **CEPP** — the core BackOffice application namespace (`MOL.Apps.CEPP.BackOffice`,
  `Fiuu.CEPP`) — most `[Issue]`-titled bugs are CEPP BackOffice pages.
- **TNG** — Touch 'n Go eWallet integration; also its own fund-pool, missing
  -transaction, and reconciliation-report ecosystem (154+ issues reference it).
- **IIMMPACT** — a bill-payment/pinless service-provider integration; recurring
  source of failed-transaction reprocessing patch requests.
- **Restorify** — a carbon-offset/certificate-issuance product line, built out
  in phases from 2023 through at least mid-2025 (#178, #197, #700, #906, #1113,
  #1280, #1281, #1872).
- **PINLESS / SOFTPIN / POSA** — the three broad reload-product shapes; each
  partner (Digi, Celcom, Umobile, 7-Eleven, 99Speedmart, etc.) tends to need its
  own integration/report/patch pattern per product shape.
- **SAP (B1)** — merchant finance/accounting system now integrated for
  auto-posting (#2103, #2123, #2428) — a 2025-era integration, still maturing
  (see #1736 incident above).
- **eInvoice / eInvoicing** — Malaysian e-invoicing compliance integration,
  rolled out in phases from mid-2024 (#1129, #1174, #1358) with an ongoing
  monthly "Consolidated Gross Sales Invoice Resubmissions" patch pattern still
  running as of mid-2026 (#1624, #1701, #2396, #2402, #2442, #2462, #2465,
  #2482, #2539) — expect this integration to keep needing manual resubmission
  patches for the foreseeable future rather than treating any one fix as final.

---

## Coverage note

Full metadata: all 2,604 issues. Deep content (discussion threads): all 8
incidents, ~15 `Type::bug`/high-severity issues. `Patch Request` (445) and
`Variance` (205) analysis is keyword/title-pattern-based across the full set,
not a full read of every ticket body — the citations above are representative
examples pulled from those patterns, not the complete list of every occurrence.

## Related

- [[architecture/reload/class-library/reloads-pin]] — the Pin/Pinless split behind §2.3
- [[architecture/reload/class-library/reloads-tng-game]] — the TNG crypto/session-leak incident, §2.6
- [[architecture/reload/class-library/reloads-restorify]] — the carbon-offset product line named in §5
- [[gitlab-analysis/reload-mr-review-checklist]] — the double-exception-logging complaint (§2.8) traced to specific MRs
- [[gitlab-analysis/reload-timeline]] — chronological view of the same incidents and migrations
