# INVENTORY_MASTER

**Database:** `INVENTORY_MASTER` · **Schema:** `dbo` only · **Tables:** 3 ·
**Stored procedures:** 16

Inventory master-data tables, referenced by `TRANSACTION` and `CEPP`. Despite
the name suggesting it might be the authoritative "master" catalog, it
actually holds live stock *balances*, not product definitions (those live in
`CEPP.dbo.Products`/`ProductGroups`) — "master" here reads as "the master
copy of stock levels," distinct from `INVENTORY`'s staging role.

## Key tables

- **`Stocks`** (+ `Stocks_new_GIT1857` wide-key migration sibling, same
  pattern as the `TRANSACTION`/`REPORTSUMMARY` `_new_GIT1857`/`_new_GIT1858`
  tables) — `ProductId`, `DealerGroupId`, `SupplierId`, `GRNId` (Goods
  Received Note — links to `TRANSACTION.dbo.GoodReceivedNotes`). This is the
  authoritative stock-on-hand table this module's name implies.
- **`UploadingStocks`** — a staging table for bulk stock uploads
  (`ProductId`), presumably the landing zone before rows are validated and
  merged into `Stocks`.

## Relationships to other modules

Reads/writes alongside `TRANSACTION.dbo`'s stock-order flow
(`PurchaseOrders`/`GoodReceivedNotes`/`RestockOrders`/`AllocationOrders`) and
`INVENTORY.dbo.Stocks` (a near-identical but separate table — see
`inventory.md` for the distinction). References `CEPP` for
product/dealer-group/supplier identity.

## Drift vs. vault

None found — table list and shapes matched the vault exactly.
