---
tags: [reload_db/architecture, module/configuration, diagram]
---

# CONFIGURATION — ER diagram

3 tables, one `dbo` schema.

```mermaid
erDiagram
    Config {
        int ID PK
        int MStatusId FK
    }
    ConfigDetails {
        int ID PK
        int ConfigID FK
        int MStatusId FK
    }
    CountrySettings {
        int Id PK
        int CountryId FK
    }

    ConfigDetails }o--|| Config : "ConfigID"
```

*(`RMS_OFFLINE.dbo` has its own separately-defined `Config`/`ConfigDetails`
pair with a near-identical shape — not the same physical tables. See
`configuration.md`.)*
