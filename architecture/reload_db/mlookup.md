---
tags: [reload_db/architecture, module/mlookup]
---

# MLookUp

**Database:** `MLookUp` · **Schema:** `dbo` only · **Tables:** 5 ·
**Stored procedures:** 7

Small shared lookup-code store, queried cross-database like `CEPP` for
shared reference values — but a distinctly different, more geography/telco-
flavored set of lookups than `CEPP.dbo.LookupCodes`.

## Key tables

- **`LookupCodes`** — the same composite `LookupType`+`Code` shape used
  everywhere else, but a physically separate table from `CEPP.dbo.LookupCodes`
  — modules that reference "`MLookUp`" in the top-level architecture diagram
  are reading *this* table, not CEPP's.
- **`Regions`** — a different `Regions` from `CEPP.dbo.Regions`: this one is
  keyed `MRegionId`+`MCurrencyId` (a composite, currency-scoped region), vs.
  CEPP's simple `Id`-keyed `Regions`. Don't conflate the two when tracing a
  `RegionId` column back to a source table — check which database the
  calling code actually targets.
- **`PhoneBooks`** — composite `MRegionId`+`MProfileId` key, `MCountryId` FK
  — looks like a country/region-scoped phone-number-format or dialing-profile
  lookup.
- **`IPAddressToCountries`** — IP-to-country geolocation mapping, presumably
  used for fraud/compliance checks elsewhere in the platform.
- **`AutoNumbers`** — a generic next-sequence-value table, same pattern as
  `CEPP.dbo.AutoNumbers`, again a separate physical table.

## Relationships to other modules

Read cross-database by `TRANSACTION` and others for shared lookups (per the
top-level diagram's `TRANSACTION -. lookups .-> MLookUp` edge) — smaller and
more specialized than `CEPP`'s reference-data role, not a competing copy of
it.

## Drift vs. vault

None found — table list and shapes matched the vault exactly.

## Related

- [[architecture/reload_db/cepp]] — the physically separate `LookupCodes`/`Regions` tables this database's own copies are explicitly not the same as
- [[architecture/reload_db/transaction]] — the main cross-database consumer of this database's shared lookups
