# Notification (bonus doc — not in the original module list, but named as a
prebuilt `class-library` DLL)

**Prebuilt artifact:** `class-library/MOL.Notification.Client.dll` (root of the
submodule). Also present as a separate, older vendored copy at
`reload/web/Libraries/NET/MOL.Notification.Client.1.0.0/`.

## Source location: not conclusively found

Unlike CEPP/Logging/Lookup/MasterFramework/Provider (whose source was found in
`Components/*`) or Pin/Restorify/EInvoice (found in `Applications/*/Core`), the
source for `MOL.Notification.Client.dll` specifically was **not conclusively
identified** in this pass. There is a real, live `Applications/Notification/Client`
project, but its assembly name is confirmed (via its `.csproj`) to be
`Fiuu.App.Notification.Client` — **not** `MOL.Notification.Client`. So either:
- the `MOL.Notification.Client.dll` in `class-library` is a genuinely separate,
  older assembly (consistent with the "MOL" brand prefix — Fiuu was formerly MOLPay/
  Razer Merchant Services — predating a rename to the `Fiuu.App.*` convention used
  everywhere else), whose source may not exist anywhere in this checkout at all, or
- there's a rename/rebuild relationship between the two that wasn't traced.

Flagged as an open question rather than guessed at further.

## What the live `Applications/Notification/*` projects do

This part **was** traced directly and is solid:

- **`Notification/Api/Core`** (`Fiuu.App.Notification.Core.csproj`) — the
  notification service's domain layer: `Models/Channel.cs`, `ChannelSetting.cs`,
  `Subscriber.cs`, `SubscriberChannel.cs`, `MessageRequest.cs`, `MessageResponse.cs`,
  `MessageAcknowledgement.cs`, `WhitelistedIp.cs`, `CallbackResponse.cs`; services
  `MessageService`, `EmailNotificationService`, `EtrackerSmsService`,
  `ApplicationService`, `CacheService`; providers `MessageProvider`,
  `ChannelProvider`, `ChannelCallbackIpProvider`, `SubscriberProvider`,
  `EtrackerSmsProvider`. This confirms the service sends notifications over multiple
  **channels** (at least email and SMS via an "Etracker" SMS gateway) to registered
  **subscribers**, with IP whitelisting for inbound callbacks. This is the only
  project in this doc with a confirmed `ProjectReference` to
  `class-library/Database/Fiuu.Database.csproj` (see
  [`database.md`](database.md)) — i.e. it owns/reads the `NOTIFICATION` database
  directly (matching the `NOTIFICATION` connection-string alias and `reload_db`'s
  `MAINT/NOTIFICATION` folder).
- **`Notification/Api`** — the REST API wrapping the above (`Controllers/`,
  `Handlers/`, `Attributes/`, `App_Start/`) — not individually read in this pass.
- **`Notification/Client`** (`Fiuu.App.Notification.Client.csproj`) — a client library
  for *other* applications to call the Notification API:
  `NotificationProcessor.cs`, `Models/MessageRequest.cs`/`MessageResponse.cs`/
  `MessageStatus.cs`/`BulkMessageResponse.cs`, `Enums/StatusCode.cs`. Has a `Cmd/`
  sub-tool (a command-line wrapper — see [`../console-app.md`](../console-app.md)).

## Consumers

Not traced in this pass — which applications actually call
`Notification/Client`/`NotificationProcessor` to send notifications wasn't confirmed
by grep. Reasonable candidates based on other docs' content: the "fail to refund"
email alert seen inline in `GiftCardService.SendEmailReport(...)`
(`Applications/MOLReloads/Core/Services/GiftCardService.cs`) uses a **different,
simpler** ad-hoc `Mail` class directly rather than this Notification module —
suggesting the Notification service is not universally used even where an email alert
is needed. Flagged as inconsistent usage, not confirmed as a rule.
