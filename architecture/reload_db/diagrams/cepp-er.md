---
tags: [reload_db/architecture, module/cepp, diagram]
---

# CEPP — ER diagrams

CEPP has 84 tables (83 + `PublicHolidays`, missing from the vault — see
`vault-drift-notes.md`) — too many for one legible diagram, so it's split
into the same functional clusters used in `cepp.md`. All PK/FK annotations
below were spot-checked against `reload_db/MAINT/CEPP/Table/*.sql`.

## Org hierarchy

```mermaid
erDiagram
    Company {
        int Id PK
        tinyint MStatusId FK
        int MStateId FK
        int MCountryId FK
    }
    CompanyContactPersons {
        int Id PK
        int CompanyId FK
        tinyint MStatusId FK
    }
    Contacts {
        int Id PK
        int OwnerId FK
        tinyint MOwnerTypeId FK
        tinyint MStateId FK
        smallint MCountryId FK
    }
    DealerGroups {
        int Id PK
        tinyint MStatusId FK
    }
    Dealers {
        int Id PK
        int DealerGroupId FK
        int WalletId FK
        tinyint MStatusId FK
        tinyint MWorkFlowStatusId FK
        int AppId FK
        varchar RetailerId FK
        int MWalletTypeId FK
        int CompanyId FK
        int SalesManagerUserId FK
        tinyint MAgencyTypeId FK
    }
    Departments {
        INT Id FK
    }
    Stores {
        int Id PK
        int DealerId FK
        int StateId FK
        tinyint MStatusId FK
        tinyint MWorkFlowStatusId FK
        bit IsSupportHybrid FK
    }
    Terminals {
        int Id PK
        int StoreId FK
        tinyint MStatusId FK
        tinyint MWorkFlowStatusId FK
    }
    CompanyContactPersons }o--|| Company : "CompanyId"
    Dealers }o--|| DealerGroups : "DealerGroupId"
    Dealers }o--|| Company : "CompanyId"
    Stores }o--|| Dealers : "DealerId"
    Terminals }o--|| Stores : "StoreId"
```

## Users & access

```mermaid
erDiagram
    Functions {
        int Id PK
        int FunctionId FK
        tinyint MStatusId FK
    }
    RoleFunctions {
        int Id PK
        int RoleId FK
        int FunctionId FK
    }
    Roles {
        int Id PK
        tinyint MStatusId FK
    }
    UserBillers {
        int Id PK
        int UserId FK
        int TerminalServiceProductId FK
        tinyint MStatusId FK
    }
    UserCompany {
        INT Id PK
        INT UserId FK
        INT CompanyId FK
    }
    UserDealers {
        int Id PK
        int UserId FK
        int DealerId FK
    }
    Users {
        int Id PK
        uniqueidentifier UserUId FK
        varchar LoginUserId FK
        int RoleId FK
        tinyint MStatusId FK
        tinyint MUserTypeId FK
    }
    UserStores {
        int Id FK
        int UserId FK
        int StoreId FK
    }
    UserSuppliers {
        int Id PK
        int UserId FK
        int SupplierId FK
    }
    RoleFunctions }o--|| Roles : "RoleId"
    RoleFunctions }o--|| Functions : "FunctionId"
    UserBillers }o--|| Users : "UserId"
    UserCompany }o--|| Users : "UserId"
    UserDealers }o--|| Users : "UserId"
    Users }o--|| Roles : "RoleId"
    UserStores }o--|| Users : "UserId"
    UserSuppliers }o--|| Users : "UserId"
```

## Product & service catalog

```mermaid
erDiagram
    InCommProductGroups {
        int Id PK
        int TerminalServiceId FK
        tinyint MStatusId FK
    }
    InCommProducts {
        int Id PK
        int ProductGroupId FK
        tinyint MStatusId FK
        tinyint MWorkFlowStatusId FK
    }
    MasterServiceProducts {
        INT Id PK
        INT MasterServiceId FK
        INT ServiceProviderId FK
        TINYINT MStatusId FK
        TINYINT MWorkFlowStatusId FK
        INT RestorifyProjectId FK
    }
    MasterServices {
        INT Id PK
        INT CountryId FK
        TINYINT MStatusId FK
    }
    OfflinePaymentProducts {
        int Id PK
        int ChannelId FK
    }
    ProductGroups {
        int Id PK
        tinyint MStatusId FK
        int ServiceProviderId FK
        smallint MCountryId FK
    }
    Products {
        int Id PK
        int ProductGroupId FK
        tinyint MStatusId FK
        tinyint MWorkFlowStatusId FK
        varchar MLoginPID FK
    }
    ServiceProductCommission {
        int Id PK
        int TerminalServiceProductId FK
        int CommissionRateId FK
    }
    ServiceProviderCountry {
        int Id PK
        int ServiceProviderId FK
        int CountryId FK
    }
    ServiceProviders {
        int Id PK
        tinyint MServiceTypeId FK
        tinyint MStatusId FK
    }
    SupplierProducts {
        int Id PK
        int SupplierId FK
        int ProductId FK
    }
    Suppliers {
        int Id PK
        tinyint MStatusId FK
        tinyint MWorkFlowStatusId FK
    }
    TerminalServiceProducts {
        int Id PK
        int TerminalServiceId FK
        tinyint MStatusId FK
        tinyint MWorkFlowStatusId FK
        int ServiceProviderId FK
    }
    TerminalServiceProductSettings {
        BIGINT Id PK
        INT ServiceProviderId FK
        VARCHAR BillerId FK
        BIT MStatusId FK
    }
    TerminalServices {
        int Id PK
        int DealerId FK
        tinyint MStatusId FK
        tinyint MWorkFlowStatusId FK
    }
    InCommProductGroups }o--|| TerminalServices : "TerminalServiceId"
    InCommProducts }o--|| ProductGroups : "ProductGroupId"
    MasterServiceProducts }o--|| MasterServices : "MasterServiceId"
    MasterServiceProducts }o--|| ServiceProviders : "ServiceProviderId"
    ProductGroups }o--|| ServiceProviders : "ServiceProviderId"
    Products }o--|| ProductGroups : "ProductGroupId"
    ServiceProductCommission }o--|| TerminalServiceProducts : "TerminalServiceProductId"
    ServiceProviderCountry }o--|| ServiceProviders : "ServiceProviderId"
    SupplierProducts }o--|| Suppliers : "SupplierId"
    SupplierProducts }o--|| Products : "ProductId"
    TerminalServiceProducts }o--|| TerminalServices : "TerminalServiceId"
    TerminalServiceProducts }o--|| ServiceProviders : "ServiceProviderId"
    TerminalServiceProductSettings }o--|| ServiceProviders : "ServiceProviderId"
```

*(`MasterServiceProducts.RestorifyProjectId` is the cross-database link into
`RESTORIFY.dbo.Projects` — see `diagrams/cross-module-relationships.md`.)*

## Commission & settlement

```mermaid
erDiagram
    CommissionRate {
        int Id PK
        tinyint MStatusId FK
        tinyint MWorkFlowStatusId FK
    }
    DealerCommissionPackages {
        bigint Id PK
        int DealerId FK
        bigint SaleCommissionId FK
    }
    DealerGroupSAPItemCode {
        INT Id PK
        INT DealerGroupId FK
        INT ProductId FK
    }
    DealerMaterials {
        int Id PK
        int ProductGroupId FK
        int DealerId FK
        int TerminalServiceProductId FK
    }
    SaleCommissionMarginRates {
        bigint Id PK
        bigint SaleCommissionId FK
        int ServiceTypeId FK
        int ProductGroupId FK
        int ProductItemId FK
        int MarginTypeId FK
        int CommissionTypeId FK
        tinyint MStatusId FK
    }
    SaleCommissionMargins {
        int Id PK
        int ServiceTypeId FK
    }
    SaleCommissionRates {
        int Id PK
        int SaleCommissionMarginsId FK
        int DealerId FK
    }
    SaleCommissions {
        bigint Id PK
        tinyint MStatusId FK
        tinyint MWorkFlowStatusId FK
    }
    Settlement {
        INT Id PK
        INT DealerId FK
        TINYINT MServiceTypeId FK
        INT ProductGroupTypeId FK
        TINYINT MFrequencyTypeId FK
        TINYINT MSettlementReportTypeId FK
    }
    SevenEChannelCommissionRate {
        INT Id PK
        INT ProductId FK
        TINYINT MTypeId FK
    }
    SevenECommissionRate {
        INT Id PK
        INT SevenEProductID FK
        TINYINT MTypeId FK
    }
    SevenEMaterial {
        INT Id PK
        INT SevenEProductId FK
        INT TerminalServiceProductId FK
    }
    SevenEProduct {
        INT Id PK
    }
    SevenESAPAccount {
        INT Id PK
        INT SevenEProductID FK
    }
    DealerCommissionPackages }o--|| SaleCommissions : "SaleCommissionId"
    SaleCommissionMarginRates }o--|| SaleCommissions : "SaleCommissionId"
    SaleCommissionRates }o--|| SaleCommissionMargins : "SaleCommissionMarginsId"
    SevenECommissionRate }o--|| SevenEProduct : "SevenEProductID"
    SevenEMaterial }o--|| SevenEProduct : "SevenEProductId"
    SevenESAPAccount }o--|| SevenEProduct : "SevenEProductID"
```

## Geography & reference (includes `PublicHolidays`, missing from vault)

```mermaid
erDiagram
    Country {
        int Id FK
        tinyint MStatusId FK
    }
    Currency {
        int Id FK
        int CountryId FK
        tinyint MStatusId FK
    }
    LookupCodes {
        int LookupType PK
        int Code PK
        int MStatusId FK
    }
    Regions {
        int Id PK
        tinyint MStatusId FK
    }
    States {
        int Id PK
        int RegionId FK
        tinyint MStatusId FK
    }
    PublicHolidays {
        date HolidayDate PK
        nvarchar HolidayDescription
        datetime CreatedDateTime
    }
    Currency }o--|| Country : "CountryId"
    States }o--|| Regions : "RegionId"
```

## Banking, wallets & TNG/InComm hardware

```mermaid
erDiagram
    BankAccounts {
        int Id PK
        tinyint MStatusId FK
    }
    Banks {
        int Id PK
        tinyint MStatusId FK
    }
    StoreAccounts {
        int Id PK
        int StoreId FK
        tinyint MStatusId FK
        int DealerId FK
    }
    Wallets {
        int Id PK
    }
    TNGAccounts {
        int DealerId FK
        int TNGAccountId PK
        int DealerGroupId PK
    }
    TNGTerminals {
        int TerminalId PK
        char TNGTerminalId FK
    }
    InCommTerminals {
        int TerminalId PK
        varchar IncommTerminalId FK
    }
    M2MServiceProvider {
        int Id PK
    }
    M2MSIMCardSerialNo {
        int Id PK
        int M2MServiceProviderId FK
    }
    M2MSIMCardSerialNo }o--|| M2MServiceProvider : "M2MServiceProviderId"
```

## Sales & reporting ops

```mermaid
erDiagram
    AutoNumbers {
        int Id PK
        int LastId FK
    }
    BulkUploadFiles {
        INT Id PK
        TINYINT MStatusId FK
        INT DealerId FK
    }
    DealerReportProfiles {
        int Id PK
        int DealerId FK
        int TNGAccountId FK
        int ReportProfileId FK
    }
    ReportProfile {
        int Id PK
        tinyint MStatusId FK
    }
    SalesMenuItems {
        int Id PK
        int ProductGroupId FK
        int SalesMenuId FK
    }
    SalesMenus {
        int Id PK
        int DealerId FK
        tinyint MStatusId FK
    }
    StoreBulkUploadFiles {
        int Id PK
        int DealerId FK
    }
    StoreBulkUploadStores {
        bigint Id PK
        int StoreBulkUploadFilesId FK
    }
    DealerReportProfiles }o--|| ReportProfile : "ReportProfileId"
    SalesMenuItems }o--|| SalesMenus : "SalesMenuId"
    StoreBulkUploadStores }o--|| StoreBulkUploadFiles : "StoreBulkUploadFilesId"
```
