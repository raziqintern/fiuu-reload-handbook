---
tags: [reload_db/architecture, module/prepaid, module/pinless]
---

# PREPAID

**Database:** `PREPAID` · **Schema:** `dbo` only · **Tables:** 4 ·
**Stored procedures:** 16

Prepaid product registration/enrolment tracking. Smaller and legacy-leaning —
the vault's own note that "most day-to-day prepaid ('Pinless') sales actually
live in `TRANSACTION.dbo`" matches what's here: this database models
*registration*, not the sale itself.

## Key tables

- **`RegistrationProductGroups → RegistrationProducts`** — a small catalog
  specific to registration-eligible products, separate from `CEPP`'s main
  product catalog.
- **`PrepaidRegistrations → PrepaidRegistrationAuditTrails`** — the
  registration record (`DealerId`/`StoreId`/`TerminalId`,
  `MIdentityTypeId` — likely NRIC/passport-type identity verification,
  consistent with telco prepaid SIM registration regulatory requirements in
  Malaysia) and its audit trail (`MRegStatusId` history).

## Relationships to other modules

References `CEPP` for dealer/store/terminal identity. Not otherwise wired
into the main `TRANSACTION` → provider → `REPORTSUMMARY` flow — this is a
self-contained, smaller-scope database.

## Drift vs. vault

None found — table list and shapes matched the vault exactly.

## Related

- [[architecture/reload/class-library/reloads-pin]] — the `Reloads.Pinless`/`Reloads.Pin` application code; day-to-day Pinless sales live in `TRANSACTION`, not here
- [[architecture/reload_db/transaction]] — where the actual prepaid/Pinless sale transactions are recorded
- [[gitlab-analysis/reload-tribal-knowledge]] — the Pin/Pinless drift pattern (§2.3) this legacy/day-to-day split reflects
