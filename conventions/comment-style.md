# Comment / Documentation Style

## XML doc comments are rare — roughly 1 in 10 files has any

Of 626 `.cs` files under `class-library` (excluding `bin`/`obj`), only 62
contain an XML doc comment (`///`) anywhere at all — and most of those files
likely have just one or two, not comprehensive coverage. Public APIs
(`*Service`, `*Provider` classes and their public methods) are overwhelmingly
undocumented at the member level. Method and parameter names are expected to
carry the meaning on their own (see `naming.md`), and mostly do — e.g.
`GetTerminalSummaryByTransNo(string transNo)` — but there's no
IntelliSense-visible description of behavior, edge cases, or failure modes
for a consumer of the shared library.

## SQL stored procedures: a consistent header block, but shallow

Nearly every stored procedure sampled opens with the same four-line comment
block:

```sql
-- reload_db/MAINT/TRANSACTION/StoredProcedure/Celcom.Transactions_Ins.sql:9-14
-- =============================================
-- Author:		Chee Hong
-- Create date: 2024-05-06
-- Description:	Celcom Transactions
-- Used by:     Celcom Pinless
-- =============================================
```

This is almost certainly a leftover from SSMS's built-in "Create Stored
Procedure" template (the `Author`/`Create date`/`Description` field names are
SSMS's defaults), kept as a convention rather than deliberately designed. The
`Description:` line is frequently just the table name restated
("Celcom Transactions" for a proc that inserts into Celcom Transactions),
not a description of behavior, pre/post-conditions, or callers — beyond the
one-off `Used by:` line, it doesn't explain *why* the proc exists or what
calls it.

## Patch scripts: header comments present for structured patches, absent for quick ones

Multi-step or risk-bearing patches get a real explanatory comment describing
sequencing/intent:

```sql
-- reload_db/MAINT/TRANSACTION/Data/GIT#1857/1.PROD_SalesTransactions_Patch_VoidTransactionId.sql:4-10
-- =============================================
-- Patch: SalesTransactions.VoidTransactionId
-- VoidTransactionId is one-way (NULL -> value only). Syncs rows copied during pre-deployment
-- where void occurred after the copy was taken.
-- Run AFTER rename table (downtime only).
-- Run AFTER pre-verify confirms PendingPatch count is as expected.
-- =============================================
```

But plenty of one-off data patches ship with no comment beyond the
Author/date/description header (or none at all) and just the raw
`UPDATE`/`INSERT` statements — see `sql-conventions.md` for the
`Dealers_Patching_RMSO-30.sql` example, which has the header block but no
explanation of *why* those specific rows needed patching, only what changed.

## Inline comments: sparse, but occasionally load-bearing when present

Most methods have zero inline comments — the code is expected to read for
itself. When an inline comment does appear, it's usually because the
behavior is genuinely non-obvious and the author knew it:

```csharp
// reload/class-library/Reloads/TNG/Validators/CardNumberValidator.cs:53-56
long subNumber = Int64.Parse(cardNumber.Substring(cardNumber.Length - 10, 9)); //last digit is serve as parity bit
long fileIndex = (subNumber - 1) / 2000000;
int cardIndex = (int)(subNumber % 2000000);
cardIndex = cardIndex == 0 ? 1999999 : cardIndex - 1; // Fix the index due to 2000000 should be last position
```

```csharp
// reload/class-library/Reloads/TNG/Validators/CardNumberValidator.cs:66
else if (fileIndex < 25) //CBL6 -> CB25 are MyCard. Cannot be blacklisted.
```

This is representative of the codebase's comment philosophy in practice:
comments explain *domain magic numbers and business rules* that can't be
inferred from the code, not *what the code is doing* mechanically. The
trade-off is that a file like `CardNumberValidator.cs`, which is dense with
magic numbers (`2000000`, `60146400`, fixed byte-array sizes), is still hard
to follow even with the comments it has — there's no overview comment
explaining the file format or the blacklist scheme as a whole.

## `#region` blocks used sparingly, mostly in older/AWS-adjacent code

```csharp
// reload/class-library/AWSCore/Services/SecretsManagerService.cs:18-28
#region Private Declaration
private const string AWS = "AWS";
...
internal static readonly CacheHelper<dynamic> CacheHelper = new CacheHelper<dynamic>();
#endregion
```

Not a universal convention — most files sampled outside AWSCore don't use
`#region` at all.

## TODO-style comments exist and are left in place

```csharp
// reload/class-library/Database/Helpers/DBConnectionHelper.cs:61-63
foundFile = true;
break; // TODO: might not be correct. Was : Exit For
```

This particular one is also a tell that the file was mechanically ported
from VB.NET ("Was: Exit For") rather than written fresh in C# — worth keeping
in mind when reading `Fiuu.Database` code generally.
