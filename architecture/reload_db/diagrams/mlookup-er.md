# MLookUp — ER diagram

5 tables, one `dbo` schema. No relationships between the tables — each is an
independent lookup keyed on its own composite key.

```mermaid
erDiagram
    LookupCodes {
        int LookupType PK
        int Code PK
        int MStatusId FK
    }
    Regions {
        int MRegionId PK
        int MCurrencyId PK
    }
    PhoneBooks {
        int MRegionId PK
        int MProfileId PK
        int MCountryId FK
    }
    IPAddressToCountries {
        bigint ID PK
    }
    AutoNumbers {
        int Id PK
        bigint LastId FK
    }
```

*(This `LookupCodes`/`Regions` are physically separate tables from
`CEPP.dbo.LookupCodes`/`CEPP.dbo.Regions` — same names, different databases.
See `diagrams/cross-module-relationships.md`.)*
