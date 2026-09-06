---
tags: [reload_db/architecture, module/configuration]
---

# CONFIGURATION

**Database:** `CONFIGURATION` · **Schema:** `dbo` only · **Tables:** 3 ·
**Stored procedures:** 6

Small shared runtime-configuration key/value store used across the platform.

## Key tables

- **`Config → ConfigDetails`** — `Config` is the key/category
  (`MStatusId`-gated), `ConfigDetails` the actual value row(s) under it
  (`ConfigID` FK). A live patch inspected while researching patch
  conventions (`00-PatchScript/GIT_1770/01_Config_ConfigDetails_Update.sql`
  and `03_Config_ConfigDetails_Update_Exclude_Scheduler.sql`, both dated
  2026-08) shows this table being used to toggle behavior for a specific
  scheduler/job context — i.e. it's actively used as an operational feature-
  flag/toggle store, not just static settings.
- **`CountrySettings`** — per-`CountryId` configuration, separate from the
  generic `Config`/`ConfigDetails` pair.

Note: `RMS_OFFLINE.dbo` has its own, separately-defined `Config`/
`ConfigDetails` tables with the same names and a near-identical shape
(`ConfigId`/`bigint` PK there vs. `ID`/`int` PK here) — a second instance of
the "same table name, different physical table per database" pattern already
seen with `LookupCodes`, `Regions`, and `AutoNumbers`.

## Relationships to other modules

Read cross-database by other modules for shared runtime config (per the
top-level architecture diagram's `CONFIG -. references .-> CEPP` edge — the
direction there is `CONFIGURATION` referencing `CEPP`, e.g. `CountryId`
FK-by-convention into `CEPP.dbo.Country`, rather than being read from CEPP).

## Drift vs. vault

None found — table list and shapes matched the vault exactly.

## Related

- [[conventions/configuration-and-secrets]] — mechanism #2, the `AWSCore.Providers.ConfigurationProvider` that reads this database by config-group name
- [[architecture/reload/class-library/awscore]] — the module confirmed calling `CONFIGURATION.dbo.ConfigDetails_Sel_ByConfigName`
- [[architecture/reload_db/rms-offline]] — the separate, near-identical `Config`/`ConfigDetails` pair duplicated in that database
