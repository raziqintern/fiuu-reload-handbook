---
tags: [reload_db/architecture, module/cepp]
---

# CEPP

**Database:** `CEPP` · **Schema:** `dbo` only · **Tables:** 84 current (83 per
vault + `PublicHolidays`, see `vault-drift-notes.md`) · **Stored procedures:**
538+

The central master-data and back-office administration hub. Every other
module in the estate reads from this database directly via three-part cross-
database names (`[CEPP].[dbo].[LookupCodes]`, `[CEPP].[dbo].[Dealers]`, ...) —
it's the single most-referenced database in the platform, and the vault's
734-relationship inference count puts `TRANSACTION → CEPP` alone at 243 links.
"CEPP" as a name is never expanded anywhere in the scripts found; likely a
legacy product/project codename predating the "Fiuu Reload" branding.

## Org hierarchy

The backbone entity chain nearly everything else hangs off:

`Company → Dealers → Stores → Terminals`, with `Users`/`Roles` cutting across.

- **`Company`** — top-level legal entity.
- **`Dealers`** — the merchant/reseller account. Carries `DealerGroupId`,
  `CompanyId`, `WalletId`, `MWalletTypeId`, `MAgencyTypeId`, a
  `SalesManagerUserId` FK into `Users`, and workflow status fields
  (`MStatusId`, `MWorkFlowStatusId`) — dealer onboarding is a workflow, not a
  single insert.
- **`DealerGroups`** — groups dealers for commission/reporting rollups; also
  the join target for `DealerGroupSAPItemCode` (SAP item-code mapping per
  dealer group — a second, CEPP-side link into the SAP integration alongside
  the standalone `SAP` database, see `sap.md`).
- **`Stores`** — belongs to a `Dealer`, has its own `MStatusId`/
  `MWorkFlowStatusId` and an `IsSupportHybrid` flag.
- **`Terminals`** — belongs to a `Store`. The physical/logical POS unit that
  everything in `TRANSACTION` traces back to via `TerminalId`.
- **`Contacts`** / **`CompanyContactPersons`** — polymorphic-ish contact
  records (`Contacts.OwnerId` + `MOwnerTypeId` — owner type is a discriminator,
  not a hard FK to one table).
- **`Departments`** — minimally modeled (only an `Id`), likely a lookup rather
  than a full entity.

## Users & access

`Users → Roles → RoleFunctions → Functions`, plus scoping join tables
(`UserDealers`, `UserStores`, `UserSuppliers`, `UserCompany`, `UserBillers`)
that restrict which dealers/stores/suppliers/billers a back-office user can
act on. `Users.UserUId` (a `uniqueidentifier`) is the value shared
cross-database with `RMS_OFFLINE.dbo.Users.Id` and `LOGGING.dbo.DevicesLoginTrail.UserId`
— the one place a CEPP user identity crosses into the consumer-facing and
audit databases.

## Product & service catalog

The pricing/catalog side, several layers deep:; `ServiceProviders →
ProductGroups → Products`, with `TerminalServices → TerminalServiceProducts`
as the per-terminal enablement layer (a store's terminal has to be
provisioned with a `TerminalService` before its `TerminalServiceProducts` can
be sold). `MasterServices → MasterServiceProducts` is a parallel, apparently
newer catalog layer (`MasterServiceProducts.RestorifyProjectId` links
straight into the `RESTORIFY` database's `Projects` table, and
`ServiceProviderId` links the same row to a `ServiceProviders` row — this
table looks like the newer unification point between legacy per-provider
catalogs and RESTORIFY's carbon-offset product line).

`InCommProductGroups`/`InCommProducts`, `OfflinePaymentProducts`,
`TerminalServiceProductSettings` (has a `BillerId` — bill-payment biller
config sitting in CEPP rather than `BILL_PAYMENT` itself) round out the
per-integration product tables.

## Commission & settlement

The most structurally complex cluster: `SaleCommissions →
SaleCommissionMargins → SaleCommissionMarginRates` (rates keyed by a wide
combination of `ServiceTypeId`/`GroupTypeId`/`ProductGroupId`/`ProductItemId`/
`MarginTypeId`/`CommissionTypeId`/`ProductOwnerId`/`PlatformId`) is the
general-purpose commission engine; `DealerCommissionPackages` and
`SaleCommissionRates` apply it per dealer. `Settlement` configures how/when a
dealer gets paid out (`MFrequencyTypeId`, `MSettlementReportTypeId`).
`SevenEProduct`/`SevenECommissionRate`/`SevenEChannelCommissionRate`/
`SevenEMaterial`/`SevenESAPAccount` is a fully separate, parallel commission
model for "7-Eleven" as a channel — enough dedicated tables that 7-Eleven is
evidently treated as a first-class distribution channel, not just another
dealer group.

## Banking, wallets, TNG/InComm hardware

`Wallets`, `BankAccounts`, `BankPaymentChannels`, `Banks`, `StoreAccounts`
back the dealer/store payout side. A separate cluster holds TNG-specific
hardware/account registration that lives in CEPP rather than the `TNG`
database itself: `TNGAccounts`, `TNGTerminals`, `TNGLocations`,
`TNGReaderModel`/`TNGReaderSerialNo`, `TNGSAMSerialNo`, plus InComm's
`InCommTerminals` and M2M SIM tooling (`M2MServiceProvider`/
`M2MSIMCardSerialNo`). This is a recurring pattern worth knowing: **hardware
provisioning and account registration for a provider integration lives in
CEPP; the transaction/settlement data for that same provider lives in the
provider's own database** (`TNG`, `INCOMM`).

## Reference data

`LookupCodes` (composite key `LookupType`+`Code`) is the shared enum table —
referenced from nearly every module in the estate (`INVOICE.dbo.InvoiceItems`'s
column comments literally say "Refer to CEPP.dbo.LookupCodes.LookupType").
`Country`/`Currency`/`Regions`/`States` are the geography tree.
`PublicHolidays` (new, see drift notes) is a flat `HolidayDate` PK table —
likely used to exclude holidays from SLA/settlement date calculations,
though no consuming stored procedure was inspected to confirm.

## Stored procedures

Naming convention is strict and consistent:
`<Table>_<Verb>[_By_<Column(s)>]`, verbs `Ins`/`Sel`/`Upd`/`Del` plus
variants (`Upd_Activate`, `Upd_Suspend`, `Sel_By_Id`, `Sel_By_<OtherColumn>`).
No `Report_*` procedures found directly in CEPP (those live in the modules
that actually produce reports — `EINVOICE`, `DataWarehouse`) — CEPP's own
538+ procs are essentially all CRUD for the tables above.

## Relationships to other modules

CEPP is read cross-database by nearly every other module for its master data
— dealer/store/terminal identity, product catalog, lookup codes. It does not
generally read *from* other modules (it's the hub, not a spoke), the one
partial exception being `MasterServiceProducts.RestorifyProjectId`, a
CEPP-side column that reaches into `RESTORIFY.dbo.Projects`.

## Drift vs. vault

See `vault-drift-notes.md` §1–2: `PublicHolidays` is missing from the vault;
5 filenames in `CEPP/Table/` (`Packages`, `PackageProducts`, `StorePackages`,
`StoreServices`, `DealerProductGroups`) are drop-scripts for already-removed
tables and the vault correctly excludes them.

## Related

- [[architecture/reload/class-library/cepp]] — the `Fiuu.CEPP` component that is the domain layer over this database
- [[architecture/reload_db/diagrams/cepp-er]] — the clustered ER diagrams for this module
- [[architecture/reload_db/restorify]] — the `MasterServiceProducts.RestorifyProjectId` cross-database link
- [[architecture/reload_db/sap]] — the `DealerGroupSAPItemCode` SAP item-code mapping living in this database
- [[gitlab-analysis/reload_db-tribal-knowledge]] — CEPP's #2 ranking by patch/MR traffic in this estate
