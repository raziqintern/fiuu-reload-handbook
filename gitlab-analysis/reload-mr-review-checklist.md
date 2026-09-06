# Reload — MR Review Checklist

Grounded in actual reviewer comments pulled from the 24 highest-discussion merge
requests in `offline-teams/reload`'s full history (out of 1,963 total MRs) —
3,620 substantive (non-system, >15 character) review comments were read across
these 24 threads. This is not a generic best-practices list: every item below is
backed by a real, cited comment. Where a pattern is common but I only cite one or
two examples, treat the MR numbers as pointers to go read the actual thread, not
as the full extent of the pattern.

Two distinct reviewer voices show up in this data:

- **A human lead reviewer, `khenggek`** (Kheng Gek Goh, Manager – Software
  Development — confirmed via incident report #1221) — reviews essentially
  every MR in this dataset from project start (2022) onward, and is also the
  mandatory reviewer per the team's own onboarding SOP (`gitlab-reload-mrs` §9:
  "Reviewer = `@Khenggek`"). 1,398 of the 3,620 sampled comments are theirs.
- **An automated AI review bot, `deepcode_ai`** — first appears **13 June 2025**
  (on `!1304`) and is still active as of the most recent sampled MR (`!1762`,
  27 April 2026). This is a real, dateable process change: sometime around
  June 2025 the team added automated AI code review to the MR pipeline,
  alongside (not instead of) `khenggek`'s manual review. 1,090 of the 3,620
  sampled comments are `deepcode_ai`'s.

The two catch different classes of problems — see §A and §B. §C is a compressed,
actionable checklist combining both.

---

## A. What the human reviewer (`khenggek`) flags, repeatedly, across unrelated MRs

### A1. Variable naming must carry a datatype prefix

> *"Please help to rename the variable name with datatype prefix."* — `!970`
> *"Please add prefix for the variable name. lstReportData"* — `!317`
> *"Please remember to always name variable with datatype prefix."* — `!844`

This matches `conventions/naming.md`'s documented (if inconsistently-applied)
Hungarian-notation convention (`s`, `i`/`l`, `dt`, `lst`, `b` prefixes). It is
flagged often enough across independent MRs that it should be treated as a hard
house rule for new code, even in modules where existing code doesn't follow it.

### A2. Blank-line / whitespace discipline between logic blocks

> *"Please remove this empty line."* (repeated 5+ times in a single thread) —
> `!1065`
> *"Please add new line gap before and after this line. Please remember to add
> new line gap to break between distinct logic."* — `!317`
> *"Be consistent. either both with open close brackets or both no need
> brackets as both are single line."* — `!844`

This is a genuinely strict, mechanically-enforced formatting convention — one
blank line to separate distinct logical steps, no stray blank lines inside a
single logical block, and consistent brace/bracket style within a file. It's
the single most frequently repeated nit-level comment in the sampled data.

### A3. Don't log-and-rethrow when the caller already logs

> *"Please check whether the reference will write to event viewer. There is no
> point in writing to viewer and throw the same exception again. This will
> cause it to write to event viewer twice for the same error and will be
> misleading. Either do not throw..."* — `!844`
> *"Please always check the method reference. Is there try catch at the
> reference? If yes, you should not put try catch here as you are just logging
> and throwing exception again and causing double writing to event viewer..."*
> — `!470`

**Rule:** before adding a `try/catch` that logs an exception and rethrows,
check whether the calling method *also* catches and logs. If so, log in exactly
one place — either let it propagate unlogged to the caller's handler, or catch
and handle it here without rethrowing to a handler that will log it again.

### A4. Don't assume a partner/API's behavior — cross-check the actual spec or a sibling implementation

> *"There is no mentioned of such success code in the ATX API spec. Please do
> not assume and just follow billpayment service."* — `!470`
> *"This logic is wrong. You should check against whether the status is
> success or queriable(processing etc)... Please recheck and compare with other
> existing pinless service provider."* — `!836`

When implementing or modifying a partner/service-provider integration, the
review expectation is explicit: check the actual API spec document and/or how
an existing, already-shipped, similar integration handles the same case —
don't infer partner behavior from what seems logical.

### A5. Use the merchant/partner-supplied timestamp, never server "now"

> *"You should always use the transactiondatetime from merchant. Not current
> datetime."* — `!613`

This exact mistake recurs seriously enough elsewhere that it's also its own CR
(#2328, "Transaction datetime from Merchant different with Server datetime") —
see the tribal-knowledge doc §2.4. Treat this as a hard rule, not a style
preference, for any code that records or displays a transaction timestamp.

### A6. Log identifying keys, not just "an error happened"

> *"Should log the terminalContents.FirstOrDefault().Id as well as the
> RequestedAmount. As those are the key infos that points to which exact record
> is empty."* — `!613`
> *"Missing Key value in the log for easy log search. Double check all
> places."* — `!334`

Any new log line for a failure/edge case should include whatever
identifier(s) (reference ID, terminal ID, dealer ID) someone would need to find
the specific record later — a generic message without a key is treated as an
incomplete fix, not just a nice-to-have.

### A7. Don't leave report queries unbounded

> *"Dont set unlimited. Still need a max limit, as it will hold the db
> otherwise. Use the same default limit as all other reports for this
> scheduler will do."* — `!317`

A report/query change that removes or skips a row-limit is flagged as a DB-load
risk, not just a data-completeness question — match the existing default limit
convention used by sibling reports rather than defaulting to "no limit."

### A8. Remove dead code and confirm before deleting

> *"This function seems not being used anywhere. Please confirm and remove
> accordingly."* — `!660`

Unused functions introduced or exposed incidentally by a change are expected to
be cleaned up in the same MR, not left for later — but the reviewer wants
confirmation of non-use, not a guess.

### A9. Don't repurpose a mismatched model — check if a better-fitting one exists first

> *"Please check is it better to use a separate model more relevant to voucher
> or not instead of reusing the model where most of the fields are
> irrelevant."* — `!749`

Reusing an existing DTO/model where most fields don't apply to the new use case
is treated as a design smell worth raising, even when it "works."

---

## B. What the automated reviewer (`deepcode_ai`, adopted ~June 2025) catches

Its comments are much longer (structured "# Deepcode Review / ## Overall
Summary" write-ups per diff), but the specific, actionable findings cluster
around:

### B1. Type-widening migrations (`int`→`long`) risk stored-procedure/param mismatches

> *"Make sure your DB and SPs expect Int64 for @Id here, otherwise calls will
> fail at runtime."* — `!1762`
> *"Id field in BillPaymentOrder is now Int32 instead of Int64; ensure
> upstream/downstream compatibility."* — `!1762`

Flagged repeatedly and specifically on the two int→bigint primary-key migration
MRs (`!1727`, `!1762` — see tribal-knowledge §2.7 for the underlying issue,
`#1857`/`#1858`). **Any MR changing an ID column's underlying type needs every
call site — stored procedure parameter types, DTO properties, API contracts —
checked for the same width, not just the column and the immediate C#/VB
property.**

### B2. LINQ chains that can return null before a member-access

> *"If `lstStocks.FirstOrDefault(...)` Is Nothing, this will throw a
> NullReferenceException; add a null check before accessing
> `.CancellationReason`."* — `!1325`
> *"`PatchNormalBillPayment` references services and list items without null
> checks, which may raise runtime exceptions."* — `!1475`

### B3. Refactors that leave stale references to removed parameters

> *"Same as above: `param.Add("@Status", DbType.Int32, DBNull.Value)` references
> an argument that no longer exists — remove or refactor."* (flagged multiple
> times across one MR) — `!1475`

A recurring finding specifically on large refactor MRs: when a method's
parameter list changes, grep the whole file (not just the signature) for
leftover references to the removed parameter name.

### B4. Duplicated logic that should call an existing function instead

> *"This function duplicates logic for checking service maintenance — reuse the
> existing `IsUnderServiceMaintenance` function instead of duplicating..."* —
> `!1578`

Same principle as A9, caught mechanically instead of by a human noticing.

### B5. Copy-paste variable-name typos that would fail to compile or silently misbehave

> *"Typo: variable 'iinCommProduct' is not defined; should be 'inCommProduct'
> (see rest of code for naming, likely copy-paste error)."* — `!1425`

### B6. Secrets/encryption-key handling gets flagged whenever touched

> *"Storing multiple encryption keys in app.config in JSON can be risky; ensure
> this file is secured and not accessible publicly, and always rotate keys when
> necessary."* — `!1654`

The bot consistently raises a security note on any MR touching encryption-key
storage or config-based secrets — worth treating as a prompt to double check
the change matches the AWS-Secret-Manager migration direction the team is
already moving in (tribal-knowledge §4), not a reason to dismiss the comment as
boilerplate.

---

## C. Practical checklist (author or reviewer, before requesting/approving merge)

**Style/convention (what `khenggek` catches by hand — do these yourself first):**

- [ ] Every new local variable has a datatype-indicating prefix, matching the
      surrounding file's existing convention.
- [ ] Exactly one blank line separates distinct logical steps; no stray blank
      lines inside one logical block; brace/bracket style is consistent within
      the file.
- [ ] No method both logs an exception *and* rethrows it to a caller that will
      also log it — pick exactly one place to log.
- [ ] Any new/changed partner-facing behavior (response codes, field formats)
      is checked against the actual API spec or an existing sibling
      integration — not inferred.
- [ ] Any transaction timestamp uses the merchant/partner-supplied value, never
      `DateTime.Now`/server time.
- [ ] Any new failure/edge-case log line includes the record's key identifier
      (reference ID, terminal ID, dealer ID) — not just a generic message.
- [ ] Any new/changed report or list query has a row limit matching sibling
      reports' convention — never "unlimited."
- [ ] Any function made unreachable by this change is removed (after
      confirming it's genuinely unused), not left in place.
- [ ] A reused model/DTO actually fits the new use case — if most fields would
      be irrelevant, a purpose-built model is preferred.

**Correctness/safety (what `deepcode_ai` catches mechanically — check these
even if the bot will also flag them):**

- [ ] An `int`→`long`/`bigint` (or any type-widening) change has every call
      site checked — stored procedure parameter types, DTO properties, and any
      external API contract — not just the column/property itself.
- [ ] Any `FirstOrDefault()`/similar nullable-returning LINQ call has a null
      check before the result is dereferenced.
- [ ] After changing a method's parameter list, the whole method body (not
      just the signature) is checked for stale references to removed
      parameters.
- [ ] New logic that duplicates an existing helper/service method is replaced
      with a call to that existing method instead.
- [ ] Renamed variables are checked across the *whole* file/method for
      leftover references to the old name (a common source of copy-paste
      typos that either fail to compile or silently misbehave).
- [ ] Any change touching encryption keys or secrets is checked against the
      AWS Secret Manager migration direction, not left in config/static
      properties.

**Process note:** a merge request going through many `(Revision N)` cycles
(seen up to Revision 17 on `!403`/chain and Revision 13 on the `RMSO-1397`
chain) is common in this project and is not automatically a signal of poor
initial code quality — a large share of revision churn here reflects evolving
business requirements discovered mid-review (new phases, new edge cases named
by BD/Ops), not repeated review rejection of the same code. Don't read revision
count alone as a quality signal without checking what actually changed between
revisions.

---

## Coverage note

Grounded in 24 of 1,963 MRs (the highest-discussion ones by `user_notes_count`),
capped at 300 notes per MR for the three busiest threads (`!970` truncated from
998 total notes at fetch time, `!1065` from 762, `!1762` from 522) — the
patterns above are drawn from the earliest ~300 comments on those three, not
their full threads. The other 21 MRs' threads were pulled in full or nearly
full. This is a real, cited sample, not an exhaustive read of every review
comment in the project's history.
