---
tags: [reload_db/architecture, module/notification, diagram]
---

# NOTIFICATION — ER diagram

9 tables, one `dbo` schema.

```mermaid
erDiagram
    Channels {
        int Id PK
        tinyint MDeliveryMethodId FK
        tinyint MStatusId FK
    }
    ChannelSettings {
        int Id PK
        int ChannelId FK
    }
    ChannelCallbackIPs {
        int Id PK
        int ChannelId FK
    }
    Subscribers {
        int Id PK
        tinyint MSecurityFlagId FK
    }
    SubscriberChannels {
        int Id PK
        int SubscriberId FK
        int ChannelId FK
    }
    Messages {
        int Id PK
        int ChannelId FK
        varchar SubscriberReferenceId
        tinyint MDeliveryStatusId FK
    }
    MessageDeliveryTracks {
        int Id PK
        int MessageId FK
        varchar ProviderReferenceId
    }
    LookupCodes {
        int LookupType PK
        tinyint Code PK
    }
    DailyTimestampLogs {
        int Id PK
    }

    ChannelSettings }o--|| Channels : "ChannelId"
    ChannelCallbackIPs }o--|| Channels : "ChannelId"
    SubscriberChannels }o--|| Subscribers : "SubscriberId"
    SubscriberChannels }o--|| Channels : "ChannelId"
    Messages }o--|| Channels : "ChannelId"
    MessageDeliveryTracks }o--|| Messages : "MessageId"
```

*(No `StoredProcedure/` folder exists for this module in `MAINT/` even
though real procedures back every table above — see `notification.md` and
`vault-drift-notes.md` §4.)*
