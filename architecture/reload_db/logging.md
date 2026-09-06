---
tags: [reload_db/architecture, module/logging]
---

# LOGGING

**Database:** `LOGGING` · **Schema:** `dbo` only · **Tables:** 1 ·
**Stored procedures:** 4

The smallest database in the estate: cross-application device/login audit
trail.

## Key table

**`DevicesLoginTrail`** — `DeviceId` + `UserId` (`uniqueidentifier` — matches
`CEPP.dbo.Users.UserUId`'s type, not `CEPP.dbo.Users.Id`'s `int`, so this
table's `UserId` most plausibly ties to the `UserUId` GUID rather than the
primary `int` identity — worth confirming against the calling code before
relying on it, since it wasn't verified against a stored procedure body).

## Relationships to other modules

References `CEPP` (user identity) per the top-level architecture diagram.
Otherwise fully standalone — a single audit-log table with no other tables
to relate to within its own database.

## Drift vs. vault

None found — matches the vault exactly (trivially, given there's only one
table).

## Related

- [[architecture/reload_db/cepp]] — the `Users.UserUId` identity this table's `UserId` most plausibly ties back to

Note: this database is unrelated to the `Fiuu.Logging` application-logging component ([[architecture/reload/class-library/logging]]) despite the shared name — this one is a SQL Server audit-trail table, not the app's error/event logging framework. No link is drawn between the two here to avoid implying a connection that isn't real.
