---
tags: [reload_db/architecture, module/notification]
---

# NOTIFICATION

**Database:** `NOTIFICATION` · **Schema:** `dbo` only · **Tables:** 9 ·
**Stored procedures:** real, but not tracked in `MAINT/` (see below)

Outbound messaging service: channels, subscribers/subscriber-channels,
message delivery tracking. Small and single-purpose — this database exists
to record what was sent, to whom, over which channel, and whether it was
delivered.

## Key tables

- **`Channels → ChannelSettings`/`ChannelCallbackIPs`** — a channel is a
  delivery method (`MDeliveryMethodId` — SMS/email/push, not enumerated in
  the schema itself), with per-channel settings and an allow-list of
  callback IPs (presumably for delivery-status webhooks).
- **`Subscribers → SubscriberChannels`** — a subscriber (identified how,
  exactly, isn't in the schema — `MSecurityFlagId` is the only distinguishing
  column) opts into one or more channels, each subscription independently
  status-gated (`MStatusId` on the junction table, not just the parent).
- **`Messages → MessageDeliveryTracks`** — the actual message
  (`SubscriberReferenceId`, `MDeliveryStatusId`) and its delivery-attempt
  history (`ProviderReferenceId` — the upstream SMS/email gateway's own
  tracking ID).
- **`LookupCodes`** — local copy of the shared enum pattern, same as several
  other modules.
- **`DailyTimestampLogs`** — minimal, likely a batch/job watermark table.

## Stored procedures — a real gap in the tracked source, not in the vault

`reload_db/MAINT/NOTIFICATION/` has **no `StoredProcedure/` folder at all** —
only `Data/`. Yet the application code genuinely calls real stored procedures
here: `class-library/Database/Notification/Context.cs` (the Dapper data-
access layer the vault's code-architecture note already flagged as
"Dapper layer for Notification") calls, by name, with
`CommandType.StoredProcedure`:

`dbo.Messages_Ins`, `dbo.Messages_Sel`, `dbo.Messages_Sel_ByRefId`,
`dbo.Messages_Upd`, `dbo.MessageDeliveryTracks_Ins`,
`dbo.MessageDeliveryTracks_Sel_ChannelRefId`, `dbo.Subscribers_Sel`,
`dbo.SubscriberChannels_SelDyn`, `dbo.Channels_Sel`,
`dbo.ChannelSettings_Sel`, `dbo.ChannelCallbackIPs_Sel`.

So the vault's claim that NOTIFICATION is "driven by stored procedures" is
correct, but for a different reason than a reader would assume: these
procedures are real and actively called, but their `CREATE PROCEDURE`
definitions are not present anywhere under `MAINT/`. Either they were
created directly against the database outside this script tree, or they
live somewhere this pass didn't find. **Don't expect to `grep MAINT` for a
NOTIFICATION stored procedure's actual T-SQL body — it isn't there.** This is
flagged in `vault-drift-notes.md` §4 as a gap in the repository's own
tracking, not a vault inaccuracy to fix.

## Relationships to other modules

Receives message-send calls from `TRANSACTION` and `CEPP` per the top-level architecture
diagram (both shown as "sends" rather than "references" in the vault's
original diagram, consistent with NOTIFICATION being a write-mostly sink for
outbound messages rather than a database other modules query for their own
data).

## Related

- [[architecture/reload/class-library/notification]] — the `Notification/Api/Core` service that owns this database
- [[architecture/reload/class-library/database]] — the `Fiuu.Database`/Dapper layer confirmed calling these stored procedures
- [[architecture/reload_db/vault-drift-notes]] — the missing-`StoredProcedure/`-folder finding (§4)
