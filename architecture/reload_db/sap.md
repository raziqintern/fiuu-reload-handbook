# SAP

**Database:** `SAP` · **Schema:** `TRANS` · **Tables:** 2 ·
**Stored procedures:** 4

> **Missing from the vault entirely** — see `vault-drift-notes.md` §1. This
> whole module doc is written directly from `reload_db/MAINT/SAP/` since no
> vault note exists to start from or cross-check against.

SAP Business One integration, created 2025-02-03 under ticket `GIT#2103`
("Create Submission table"). This looks like a staging area for documents
destined to be posted into SAP Business One (SAP B1) — the column vocabulary
is distinctively SAP B1's own (`CardCode`, `DocEntry`, `DocType`,
`U_EIV_*` user-defined fields), not internal Fiuu naming.

## Tables (`TRANS` schema)

- **`Submissions`** — one row per SAP B1 document submission:
  `SubmissionType`, `DealerId`/`MasterServiceProductId`/`ServiceProviderId`
  (linking back toward `CEPP`), a transaction date range
  (`TransStartDate`/`TransEndDate`) plus SAP B1's own document dating
  (`DocDate`/`DocDueDate`/`TaxDate`), `CardCode` (SAP B1's business-partner
  code), `NumAtCard`, `DocCurrency`, `DocType`, and three
  `U_EIV_*` user-defined fields (`FreqSync`, `InvoiceType`, `OriRefNum`,
  `OriCode`) — the `EIV` prefix almost certainly stands for "E-Invoice,"
  tying this table directly to the `EINVOICE` database's domain even though
  no direct FK-by-convention column links them. `DocEntry`/`StatusCode`/
  `Message` capture SAP B1's response once the document is actually posted.
- **`SubmissionItems`** — line items (`SubmissionId` FK): `ItemCode`,
  `Quantity`, `ItemDescription`, `VatGroup`, `AccountCode`, `LineTotal`,
  up to four `CostingCode`/`CostingCode2/3/4` dimensions (SAP B1's
  multi-dimensional cost-center allocation), and its own
  `U_EIV_TaxExemptDoc`/`U_EIV_Classification` user-defined fields mirroring
  `EINVOICE.TRANS.InvoiceItems.Classification`.

## Stored procedures

`TRANS.Submissions_Ins`, `_Sel_By_DocDate`, `_Sel_By_NumAtCard`,
`_Upd_By_Id` — a minimal CRUD set, no `SubmissionItems_*` procedures found in
the `StoredProcedure/` folder at all (either items are inserted via a
different path — e.g. bulk insert from the calling application, or a
table-valued parameter into `Submissions_Ins` — or the procs exist
uncaptured in `MAINT/`, the same gap pattern seen with `NOTIFICATION`'s
procedures; not resolved from the script folder alone).

## Relationships to other modules

`DealerId`/`MasterServiceProductId`/`ServiceProviderId` on `Submissions`
reference `CEPP`. The relationship to `EINVOICE` (both databases stage
"submissions" for the same underlying sales data, one to LHDN/MyInvois and
one to SAP B1, both carrying `U_EIV_*`-prefixed fields) is a strong
naming/domain inference, not a verified join — flagged the same way in
`00-overview.md` and `einvoice.md`. No stored procedure doing a live
cross-database `SAP.dbo...`/`EINVOICE.dbo...` query was found in either
module's `StoredProcedure/` folder in the time available.

## Open questions

- Whether `SAP` and `EINVOICE` are two independent downstream systems fed
  from the same upstream sales/commission data (most likely, given the
  parallel-not-linked table shapes), or one feeds the other, is not settled
  by the schema alone — worth resolving from the C# integration code
  (`Fiuu.CEPP` or a dedicated SAP/EInvoice provider project) before
  building anything that assumes a specific direction.
