# DataWarehouse — ER diagram

11 tables, one `dbo` schema — a star schema.

```mermaid
erDiagram
    FACT_DAILYSALES {
        int IdFactSales PK
        int DealerId FK
        int ProductId FK
        varchar MerchantId FK
        varchar TransId FK
        int Productgroupid FK
        int ProductServiceId FK
        int StoreId FK
    }
    TEMP_DAILYSALES {
        int IdTempSales PK
        int DealerId FK
        int ProductId FK
        varchar TransId FK
    }
    DIM_DEALERS {
        int dim_id_dealer PK
        int DealerId FK
    }
    DIM_PRODUCTS {
        int dim_id_product PK
        int IncommProductId FK
        int TerminalServiceId FK
    }
    DIM_SERVICEPROVIDER {
        int DimIdTerminalservice PK
        int TerminalServiceId FK
        int ServiceProviderId FK
    }
    DIM_WEEKS {
        int Dim_id_dates
        varchar Year
        int Week
    }
    DIM_WEEKS_ACCUM {
        int Dim_id_dates
        varchar Year
        int Week
    }
    UserPrivAudit {
        int RowID FK
    }

    FACT_DAILYSALES }o--|| DIM_DEALERS : "DealerId"
    FACT_DAILYSALES }o--|| DIM_PRODUCTS : "ProductId"
```

*(`TEMP_DAILYSALES` is the ETL staging copy `DW_SYNC_DATA*` procedures load
before merging into `FACT_DAILYSALES` — see `datawarehouse.md`.
`pinless_storeid_20212021`/`reload_sto_reid2021`/`UserPrivAudit2` are
one-off/ad-hoc tables omitted here; flagged, not modeled, in the module doc.)*
