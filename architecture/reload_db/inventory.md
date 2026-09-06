# INVENTORY

**Database:** `INVENTORY` · **Schema:** `dbo` only · **Tables:** 2 ·
**Stored procedures:** 84

Stock/inventory staging tables supporting the stock-order flow in
`TRANSACTION`. Despite having only 2 tables, this database has 84 stored
procedures — by far the highest procedure-to-table ratio in the estate (42:1,
vs. CEPP's ~6:1 or TRANSACTION's ~6:1). That ratio alone is a signal that
`Stocks` here is queried/mutated through a wide variety of narrow,
purpose-specific procedures rather than generic CRUD — consistent with stock
being a high-contention, many-code-paths-touch-it table (restock, return,
allocation, void, sale all move stock state).

## Key tables

`Stocks`/`Stocks_new_GIT1857` — same column shape and same `_new_GIT1857`
migration pattern as `INVENTORY_MASTER.dbo.Stocks`, but with **more status
columns**: `MStockStatusId`, plus FK-by-convention columns tying a stock row
back to whichever operation last moved it (`ReStockOrderId`,
`ReturnRequestId`, `AllocationOrderId`). This looks like the actively-
mutated staging/working copy of stock state that the stock-movement stored
procedures operate against, with `INVENTORY_MASTER.dbo.Stocks` as a more
stable "master" reference copy — the exact relationship between the two
`Stocks` tables (which one is authoritative, whether one syncs to the other)
wasn't determined from the schema alone; the 42:1 procedure ratio suggests
this one is where the actual business logic runs.

## Relationships to other modules

Tightly coupled to `TRANSACTION.dbo`'s stock cluster
(`PurchaseOrders`/`RestockOrders`/`AllocationOrders`/`ReturnRequests`/
`VoidOrders`, all of which appear as FK-by-convention sources on this table)
and to `INVENTORY_MASTER.dbo.Stocks`.

## Drift vs. vault

None found — table list and shapes matched the vault exactly.
