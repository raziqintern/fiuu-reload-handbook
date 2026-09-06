---
tags: [reload_db/architecture, module/tng]
---

# TNG

**Database:** `TNG` · **Schema:** `dbo` only · **Tables:** 22 ·
**Stored procedures:** 56

Touch 'n Go eWallet / prepaid card integration: accounts, wallets, card and
fund transactions, host authentications, terminal batches. Note the split
with `CEPP`: TNG *hardware and account provisioning*
(`TNGAccounts`/`TNGTerminals`/`TNGLocations`/`TNGReaderModel`/
`TNGReaderSerialNo`/`TNGSAMSerialNo`) lives in `CEPP.dbo`, while this
database holds the actual transactional/reconciliation data for accounts
once provisioned — see `cepp.md`'s "Banking, wallets, TNG/InComm hardware"
section for the CEPP-side half.

## Key tables

- **`Accounts`** — the TNG merchant account, `MStatusId`-gated. Everything
  else in this database hangs off `AccountId`.
- **`AccountBanks`/`AccountServiceProviders`/`AccountWallets`** — junction
  tables scoping an account to its bank, service provider (`SpId`, a `char`
  code rather than an int FK — TNG's own provider identifier scheme, not
  CEPP's `ServiceProviders.Id`), and wallet.
- **`CardTransactions`/`CardTransactionBatches`/`CardTransactionBatchSummary`**
  — the actual TNG card tap/reload transaction log, keyed by `TerminalId`/
  `LocationId`/`SpId` (all `char` codes — TNG's card-network identifiers, not
  CEPP terminal/store IDs directly) plus an `AccountId` FK. The same
  `CardTransactions` shape reappears verbatim in `REPORTSUMMARY.dbo` — see
  `reportsummary.md`.
- **`FundTransactions`/`FundAssignments`/`ReloadFundRequests`** — the money
  movement side: assigning float to an account, reloading a wallet, and the
  request/approval trail for it (`MFundPaymentTypeId`, `BankId`).
  `BalanceReconciliationLog` ties a `FundTransactionId` to a `WalletId` for
  balance-drift tracking.
- **`BlacklistCards`/`BlacklistCardBatches`** — card blacklist/batch-export
  for fraud/risk handling, with `Sel_AvailableForExport`/`Sel_BatchExport`
  stored procedures suggesting a file-export flow to TNG or a fraud vendor.
- **`HostAuthentications`** — per-account host/terminal authentication
  attempts.
- **`LookupCodes`** — TNG keeps its own local copy of the shared enum-table
  pattern (composite `LookupType`+`Code` key) rather than only reading
  `CEPP.dbo.LookupCodes` — one of several modules that do this (also seen in
  `RMS_OFFLINE`, `INCOMM`, `NOTIFICATION`, `MLookUp`).

## Stored procedures

`<Table>_<Verb>[_By_X]`, with an unusually heavy `SelOut_*` variant
(`AccountServiceProviders_SelOut_SpId_By_AccountId`,
`AccountWallets_SelOut_WalletId_By_AccountId`) — a naming wrinkle not seen
elsewhere in the modules sampled; likely denotes a proc whose primary purpose
is returning a single output value/column rather than a full row-set, but
this wasn't confirmed by reading the proc bodies.

## Relationships to other modules

Receives from `TRANSACTION.dbo` (`ApiTNGCardTransaction`, `ApiTNGFundRequest`,
and the `TNGCardTransactions`/`TNGFundRequests`/`TNGFundAssignments` tables
that live directly in `TRANSACTION.dbo` alongside the `Api*` staging rows —
TNG is one of the few provider integrations where the provider-database
tables and `TRANSACTION`-side tables share near-identical names and shapes).
Feeds `REPORTSUMMARY` (`TNGBillerReport`/`TNGSettlementReport`). References
`CEPP` for the hardware/account registration side noted above.

## Related

- [[architecture/reload/class-library/reloads-tng-game]] — the `class-library/Reloads/TNG` component that reads/writes this database
- [[architecture/reload/diagrams/tng-reload-flow]] — the traced e-wallet card transaction sequence
- [[architecture/reload_db/cepp]] — the hardware/account-provisioning half of TNG (§"Terminal Hardware & TNG")
- [[gitlab-analysis/reload_db-tribal-knowledge]] — TNG's #3 ranking by patch/MR traffic
- [[gitlab-analysis/reload-tribal-knowledge]] — the TNG crypto/session-resource-leak incident (§2.6)
