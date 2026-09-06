---
tags: [gitlab-analysis, repo/reload]
aliases: ["Reload Timeline"]
---

# Reload — Timeline

Chronological reconstruction from the full issue/MR history of
`offline-teams/reload` (2,604 issues, 1,963 merge requests, 2022-07-15 through
2026-09-05). Dates are the GitLab `created_at` of the cited issue/MR unless
otherwise noted. Release cadence and headline dates are from the `[Release]`
category (252 issues) and `main`-branch merge requests (218 MRs); everything
else is reconstructed from `[CR]`/`Enhancement`/`Incident` issue titles and
descriptions.

---

## 2022 — Project genesis

- **15 Jul 2022** — **#6**, "Push Reload Team DEV Source Codes to Git", is the
  earliest-dated issue in the dataset — predates the project's own recorded
  creation date (7 Nov 2022) and the first merge request, suggesting an
  administrative/backdated entry tracking the initial code push.
- **7–8 Nov 2022** — The `offline-teams/reload` GitLab project is created;
  **!1** ("Draft: Add source code") through **!5** land the initial codebase
  on `main` the same day. This is the effective start of Reload's life as a
  GitLab-tracked project.
- **15 Dec 2022** — **#68**, the first `[Release] Deploy to production` issue
  in the dataset — production releases begin on a roughly weekly-to-biweekly
  cadence from here on (252 `[Release]` issues total through Sep 2026).

## 2023 — Steady operations, first CI/CD investment, first incident

- **Throughout 2023** — Heavy `[CR]`/`Patch Request`/`Variance` volume
  (792 issues created in 2023 alone, the single busiest year in the dataset)
  as the team works through partner reconciliation reports, commission-package
  patches, and reporting change requests for `7-Eleven`, `TNG`, `IIMMPACT`, and
  POSA/Gift Card partners.
- **12 Jan 2023** — **#97**, the first incident report in the dataset (an
  eWallet-partner API-contract mismatch, ~336 transactions affected).
- **11 Jul 2023** — **#433**/**#434**, `[CI/CD]` — GitLab Runner setup and a
  formal CI/CD architecture review for Reload, the project's first dedicated
  DevOps/pipeline investment.
- **2 Aug 2023** — **#491**, `[CI/CD] Blackduck` — security/dependency
  scanning tooling added to the pipeline.
- **29 Dec 2023** — A large batch of ~30 issues (`#842`–`#872`) is created the
  same day, each tagged "Jira ticket migration - RMSO-xxxx" — this is the
  point where the team's pre-existing Jira backlog (tracked under an `RMSO-`
  prefix) was consolidated into git2u GitLab issues. The batch itself is a
  significant tech-debt backlog, including:
  - Move file uploads to S3 directly (#842); move DB connection strings and
    later other credentials to AWS Secret Manager (#843 — the start of a
    pattern that continues through at least #2609 in 2026)
  - Standardize on NLog for logging (#845); consolidate per-server log
    streams (#840, and later #1091–1093, #1354)
  - Adopt Dapper ORM (#846)
  - Upgrade to .NET Framework 4.8 (#849)
  - Replace 3DES with AES on terminal encryption, per terminal model
    (#852–854) — a security-driven crypto upgrade across the terminal fleet

## 2024 — Rebrand, first major security incident, feature expansion

- **Feb–Mar 2024** — The RMS → Fiuu rebrand lands across the codebase and
  tooling: RMS Offline Portal → Fiuu Offline Portal (#1000), RMS BackOffice →
  Fiuu BackOffice (#1007), terminal receipt logo change (#1008), Razer → Fiuu
  email addresses (#1023), Power Automate sender/recipient rename (#1027) —
  continuing as late as **Aug 2025** with #1978 ("change 'MOL' and 'RMS' to
  Fiuu").
- **20 Jun 2024** — **#1221**, a man-in-the-middle attack against the Offline
  Portal — the project's first (and only, to date) fraud/security incident
  formally logged with the full Incident Response Report template, discovered
  incidentally while checking an unrelated exception email and contained
  within roughly two hours.
- **2024** — Multiple partner-integration CRs land as standalone efforts:
  AnyPay (#1067), Digi Pinless Direct (#873), Prepay Nation (#1009), Giftee
  (#991), RGDH Webshop API (#1128), Umobile SFTP Migration (#1217) —
  reinforcing the per-partner, per-product-shape integration pattern noted in
  the tribal-knowledge doc.
- **21 May 2024** (issue filed) / **May 2024 onward** — eInvoicing API
  integration begins in earnest: `#1129` (new BackOffice fields for
  e-invoicing), `#1174` (eInvoicing API), `#1358` (Phase 1.1, Aug 2024) — the
  start of what becomes a long-running, still-active compliance integration
  (see the monthly resubmission-patch pattern in 2025–2026 below).
- **8 Nov 2024** — **#1483**, Online TopUp duplicate-transaction incident —
  root-caused to a Notification-URL/browser-redirect double-update race;
  fixed by disabling the Notification URL path.

## 2025 — Scale limits hit, AI code review adopted, first major stock-discrepancy incident

- **14 Apr 2025** — **#1736**, SAP-Warehouse stock discrepancy incident —
  traced to a dealer-model migration (Prepaid → Consignment) executed without
  a matching balance-reset control.
- **9 Jun 2025** — **#1857**/**#1858**, filed the same day: several
  Pin-service transaction tables found approaching the 32-bit integer primary
  -key limit (some at 60%+ of max), triggering a `bigint` migration across
  both Pin-service and non-Pin-service transaction tables (and their
  `REPORTSUMMARY` snapshots) — the project's first hit of a genuine scale
  ceiling. Corresponding MRs `!1727`/`!1762` are among the most heavily
  reviewed in the dataset (402 and 522+ comments respectively).
- **13 Jun 2025** — First appearance of the `deepcode_ai` automated code
  -review bot, commenting on `!1304` — from this point on, MRs in this dataset
  are reviewed by both the long-standing human lead reviewer and an automated
  AI reviewer running on every diff. This is the most significant *process*
  change visible in the review data (see `reload-mr-review-checklist.md`).
- **25 Jun 2025** — **#1892**, TNG sales-reduction incident over a weekend —
  a Terminal Server exception silently reduced then stopped incoming sales
  with no alert firing; an alert mechanism was added and verified working the
  following week.
- **28 Aug 2025** — **#2018**, "Refactoring Codebase for Functional Clarity
  and Separation of Concerns" — removal of several unused/legacy applications
  and projects (`MOLPayTransactionGenerator`, `CodeGenerator`, `PinImporter`,
  `TestPOC`, `IncommFramework`) and retirement of the `MOL.Reload.Sdk`
  project.
- **13 Oct 2025** / **29 Oct 2025** — **#2103**/**#2123**, SAP B1 Auto Posting
  integration for BackOffice — a new accounting-system integration effort.
- **10 Dec 2025** — **#2214**, Shopee/Umobile Pinless transaction-variance
  incident (covering a Jun–Jul 2025 period, only surfaced when the partner
  asked about it in September) — a reconciliation-detection-lag incident.
- **8 Jan 2026** — **#2257**, a second 7-Eleven Middleware error-rate incident
  (covering a Dec 2025 period) — same alert class as #1525 (Dec 2024), over a
  year apart.

## 2026 — Continued consolidation, a major performance fix, ongoing compliance patching

- **Throughout 2025–2026** — A steady stream of "Consolidate X for easier
  maintenance" enhancement tickets: similar scheduler applications (#1770,
  #2373), BackOffice reports (#1779), Power BI reports (#1825), Terminal
  Server handler versions (#2504), stored procedures (#2513) — an ongoing,
  multi-year effort to reduce duplication across near-identical components
  built incrementally over the project's life.
- **Monthly, ongoing from Feb 2025** — A recurring `[Patch Request]`
  "EInvoice Consolidated Gross Sales Invoice Resubmissions" ticket appears
  essentially every month (#1624, #1701, #2396, #2402, #2442, #2462, #2465,
  #2482, #2539) — the eInvoicing integration (started 2024) still requires
  manual monthly resubmission handling as of mid-2026, not a one-time
  integration cost.
- **23 May 2026** — **#2468**, "Move Core Modules to Class Library Repository
  Aligned with Functional Boundaries" — a significant structural move,
  relocating `Provider`, `Logging`, `Lookup`, `MasterFramework`, `CEPP`,
  `Patching`, `EInvoice`, and the `Reloads` product-module tree out of the
  application repo's `Components` folder and into the separate Class Library
  repository.
- **24 Aug 2026** — **#2592**, "Cache decrypted session keys to fix PFX/RSA
  handle leak causing TNG transaction latency" — a significant performance
  fix for a crypto-resource leak that had been causing TNG reload
  transactions to take up to two hours to complete under sustained load (see
  tribal-knowledge §2.6 for the full root-cause writeup).
- **5 Sep 2026 (today)** — **#2609**, most recent issue in the dataset,
  continuing the AWS Secret Manager credential-migration pattern started in
  Dec 2023 (#843) — now applied to a newer partner integration (XOX).

---

## Release cadence, at a glance

| Year | Issues created | MRs created | `main`-branch (production) MRs |
|---|---|---|---|
| 2022 (from Jul) | 80 | 42 | 20 |
| 2023 | 792 | 531 | 46 |
| 2024 | 701 | 522 | 70 |
| 2025 | 667 | 501 | 53 |
| 2026 (through Sep) | 364 | 367 | 29 |

2024 saw both the highest `main`-branch (production release) MR count and
heavy feature-expansion activity (rebrand + eInvoicing + multiple partner
integrations) — the busiest single year for shipped production changes in the
dataset, even though 2023 had more total issues filed.

---

## Coverage note

This timeline is built from full metadata across all 2,604 issues and 1,963
MRs (title/date/category scan), plus full-description reads of every issue
cited by number above. It is a curated selection of what looked, from that
full scan, like the most significant recurring themes and one-off shifts —
not a claim that these are the *only* notable events in the project's
history. Milestone/label data beyond category-bracket and a handful of
targeted keyword searches (architecture/migration/consolidation-related
terms) was not exhaustively mined for additional timeline entries.

## Related

- [[gitlab-analysis/reload-tribal-knowledge]] — the recurring bug classes and incidents behind these milestones
- [[gitlab-analysis/reload_db-timeline]] — the parallel database-side timeline (bigint migration, GIT#441 saga)
