# SQL-side Conventions (`reload_db/MAINT`)

## Folder structure: one folder per database, one subfolder per object type

Every database under `MAINT/` (`TRANSACTION`, `CEPP`, `LOGGING`, `INVENTORY`,
etc.) follows the same internal shape: `Data/`, `Function/`, `Index/`,
`Schema/`, `StoredProcedure/`, `Table/`, `Type/`. This is consistent across
every database folder sampled.

## Objects are organized per-partner using SQL schemas, not just tables

Rather than one flat `dbo` schema with partner-prefixed table names, many
databases give each integration partner its own SQL schema
(`Celcom`, `ATX`, `AnyPay`, `DTOne`, `Giftee`, `IIMMPACT`, `JomPay`, ... —
see `reload_db/MAINT/TRANSACTION/Schema/*.sql`, one file per schema), and
partner-specific tables/procs live inside that schema:

```sql
-- reload_db/MAINT/TRANSACTION/StoredProcedure/Celcom.Transactions_Ins.sql:28
INSERT INTO [Transaction].[Celcom].[Transactions] (...)
```

Generic/shared tables stay in `dbo` (`dbo.SalesTransactions`,
`dbo.PurchaseOrders`, `dbo.AuditLogs`).

## Stored procedure naming: `<Schema>.<Table>_<Verb>[_By_<Columns>]`

Verbs are always the same four abbreviations: `Ins`, `Sel`, `Upd`, `Del`.
Column-qualified selectors are suffixed `_By_<Column>[_<Column>...]`:

```
Celcom.Transactions_Ins
Celcom.Transactions_Sel_By_ServiceTypeId_ReferenceId
Celcom.Transactions_Upd
Celcom.Transactions_Upd_IsGenerated_By_ReferenceId
dbo.AllocationOrderItems_Del_By_AllocationOrderId
```

This naming is load-bearing — the C# side references procedures through
generated constant holders whose member names mirror it exactly
(`Fiuu.Provider.Database.TNG.StoredProcedures.TerminalActivities_Ins`, see
`data-access.md`), so the SQL object name and the C# constant name are kept
in lockstep by convention, not by any codegen step visible in this repo.

## Stored procedure body style

```sql
-- reload_db/MAINT/TRANSACTION/StoredProcedure/Celcom.Transactions_Ins.sql
USE [TRANSACTION]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- Author/Create date/Description/Used by header (see comment-style.md)
CREATE OR ALTER PROCEDURE [Celcom].[Transactions_Ins]
    @MServiceTypeId INT
    , @ReferenceId VARCHAR(50)
    ...
AS
BEGIN
    SET NOCOUNT ON;
    ...
END
GO
```

Consistent elements across every procedure sampled: `CREATE OR ALTER
PROCEDURE` (not `CREATE PROCEDURE` guarded by an `IF EXISTS DROP`), leading
comma parameter lists, `SET NOCOUNT ON;` as the first statement in the body,
and `SELECT`/read procedures using `WITH (NOLOCK)` on every table reference:

```sql
-- reload_db/MAINT/TRANSACTION/StoredProcedure/Celcom.Transactions_Sel_By_ServiceTypeId_ReferenceId.sql:30
FROM [Transaction].[Celcom].[Transactions] WITH (NOLOCK)
```

`NOLOCK` on every read is universal in the sampled procedures — a deliberate
throughput-over-consistency choice for a high-volume transactional system,
worth knowing about if you ever need to reason about read consistency.

## Column naming

- PascalCase columns throughout (`ReferenceId`, `TransactionDateTime`,
  `ResponseStatus`, `AmountInCents`).
- Foreign keys into lookup/status tables use the `M`-prefix convention
  described in `naming.md` (`MServiceTypeId`, `MWorkFlowStatusId`,
  `MSourceTypeId`).
- Audit columns (`CreatedDateTime`, `CreatedBy`, `ModifiedDateTime`,
  `ModifiedBy`) recur on most transactional tables.
- `Id` as the PK column name is standard; `@@IDENTITY` (not
  `SCOPE_IDENTITY()`) is used to return the new row's id in at least one
  sampled insert procedure (`Celcom.Transactions_Ins.sql:49`) — worth flagging
  since `@@IDENTITY` can return an id from a trigger-inserted row rather than
  the row you just inserted, which `SCOPE_IDENTITY()` avoids.

## Index naming: `IX_`/`IXU_` prefix, `<Table>_<Column(s)>` body

```sql
-- reload_db/MAINT/TRANSACTION/Index/IXU_PurchaseOrders_PONo_CountryId_RMSO-366.sql:13
CREATE UNIQUE NONCLUSTERED INDEX [IXU_PurchaseOrders_PONo_CountryId] ON [dbo].[PurchaseOrders]
```

`IXU_` = unique index, `IX_` = non-unique — consistent across the `Index/`
folders sampled. Ticket suffixes on the *index name itself* are not used
(the ticket only appears in the filename), so `IXU_PurchaseOrders_PONo_CountryId`
is the actual object name in both the "AWSQA" and prod variants of that
patch — only the filename distinguishes them (see below).

## Patch-script filenames: ticket references are wildly inconsistent

Looking at `TRANSACTION/Table/*.sql` alone (274 files), the "add/alter a
column" scripts encode the same two operations under at least six different
spellings:

```
ApiPinlessTransactions_ADDColumn.sql                  (no ticket at all)
dbo.AllocationOrders_AddColumn_GIT-790.sql            (AddColumn, GIT-nnn)
dbo.AllocationOrderItems_Add_Column_GIT_1382.sql      (Add_Column, GIT_nnn)
dbo.ApiStockOrders_Add_Column_RMSO-219.sql            (Add_Column, RMSO-nnn)
dbo.GoodReceivedNotes_AddColumn_RMSO-366-AWSQA.sql    (AddColumn, RMSO-nnn, +env suffix)
ApiGiftCardTransactions_ALTER_Column_RMSO-2315.sql    (ALTER_Column)
dbo.ApiTicketTransactions_ALTER_Column_GIT1858.sql    (ALTER_Column, GITnnnn no separator)
PinlessSalesTransactions_ALTERColumn.sql              (ALTERColumn, no ticket)
dbo.GoodReceivedNotes_AlterColumn_MWorkFlowStatusId_RMSO-2106.sql (AlterColumn + column name)
dbo.ReconMOLPayDetails_Temp_Alter_Column_GIT#1114.sql (Alter_Column, GIT#nnnn)
```

At least four ticket-tag spellings are in simultaneous use:
`RMSO-nnn`, `GIT-nnn`, `GIT_nnn`, `GITnnnn` (concatenated), and `GIT#nnnn`.
Some scripts (mostly the oldest/simplest ones) carry no ticket reference at
all. There is no single "correct" format — whichever the individual author
used at the time stuck for that file, and no later cleanup pass unified them.

## Multi-step migrations get their own numbered subfolder

For patches large enough to need staged execution (create new table, then
indexes, then rename), the convention is a subfolder named after the ticket
with numerically-prefixed step folders:

```
TRANSACTION/Table/GIT1857/1.CreateNewTable/dbo.ApiStockOrders_CREATE_Table_GIT1857.sql
TRANSACTION/Table/GIT1857/2.CreateIndexes/dbo.ApiStockOrders_CREATE_Index_GIT1857.sql
TRANSACTION/Table/GIT1857/3.RenameTable/dbo.ApiStockOrders_RENAME_GIT1857.sql
```

and similarly for data patches:

```
TRANSACTION/Data/GIT#1857/0.PROD_SalesTransactions_PreVerify_VoidTransactionId.sql
TRANSACTION/Data/GIT#1857/1.PROD_SalesTransactions_Patch_VoidTransactionId.sql
TRANSACTION/Data/GIT#1857/2.PROD_SalesTransactions_Verify_VoidTransactionId.sql
```

This numbered pre-verify/patch/verify sequencing (see the `VoidTransactionId`
example under `error-handling.md`'s sibling docs) is a genuinely good,
repeatable pattern for staged production patches — it just isn't
formalized anywhere outside these ad hoc folder names, and the ticket-tag
format still drifts between `GIT#1857` (this folder) and `GIT1857` (the
sibling `Table/GIT1857/` folder for the same ticket) even within the *same*
piece of work.

## One-off data patches sometimes ship with no ticket linkage and minimal explanation

```sql
-- reload_db/MAINT/CEPP/Data/00-GLOBAL/Dealers_Patching_RMSO-30.sql:1-9
-- =============================================
-- Author:		Yusairi Yap
-- Create date: 2021-08-17
-- Description:	Patch all dealers with RetailerId in production
-- =============================================

UPDATE [CEPP].[dbo].[Dealers]
SET PINStoreAppName = '...', PINStoreAppCode = '...'
WHERE RetailerId = '18538'
```

The header names an author and date but the "why these specific dealers"
context lives only in the linked ticket (RMSO-30, from the filename) — the
script itself is not self-explanatory, and there's no corresponding rollback
script alongside it.
