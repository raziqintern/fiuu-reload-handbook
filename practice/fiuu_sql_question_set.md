# Fiuu reload_db — 200-question progressive SQL practice set

Grounded in the real `reload_db` estate (16 databases, ~470 tables — see the
`reload-db-schema` vault). Domain used throughout:

- **CEPP** — master data hub: `Dealers`, `Stores`, `Terminals`, `Users`,
  `Products`, `Company`, `DealerGroups`, `SaleCommissionRates`, `Settlement`,
  `Roles`, `BankAccounts`, `Suppliers`, `TNGAccounts`, etc.
- **TRANSACTION** — core reload/payment staging, EOD/reconciliation, plus
  per-provider schemas (TNG, INCOMM, BILL_PAYMENT, RESTORIFY, TICKET, and
  newer ones like AnyPay/CelcomDigi/RazerGold).
- **REPORTSUMMARY** — settlement & billing report aggregation (SalesOrders,
  PINReloadSettlementReport, TNGSettlementReport, VoidOrders, etc.).
- **DataWarehouse** — star schema (`DIM_DEALERS`, `DIM_*`, `FACT_DAILYSALES`).
- **Provider DBs** — TNG, INCOMM / INCOMM_TRANS, BILL_PAYMENT (one schema per
  biller), RESTORIFY, TICKET, PREPAID.
- **Shared services** — NOTIFICATION, LOGGING, CONFIGURATION, MLookUp,
  INVENTORY / INVENTORY_MASTER.

No answers included yet — this is the question bank only.

---

## Tier 1 — Beginner (Q1–Q40)
Straight SQL syntax practice. Questions name the table/column directly, almost
1:1 with the SQL clause needed. Good for someone who just learned SELECT/
WHERE/ORDER BY/basic aggregates.

1. Write a query to list all columns for every row in `CEPP.dbo.Dealers`.
2. Select just `Id`, `Name`, and `Code` from `CEPP.dbo.Dealers`.
3. List all `Stores` where `DealerId = 105`.
4. Find every row in `CEPP.dbo.Terminals` where `MStatusId = 1`.
5. Select all `Products` with `ProductTypeId = 3`.
6. List the `Name` and `RegistrationNo` of dealers where `Name` starts with 'A'.
7. Show all users in `CEPP.dbo.Users` whose `Email` is not null.
8. Get the 10 most recently created dealers, ordered by `CreatedDate` descending.
9. Count how many rows exist in `CEPP.dbo.Stores`.
10. Count how many terminals have `MStatusId = 2`.
11. List all distinct `MStatusId` values used in `CEPP.dbo.Dealers`.
12. Select stores where `EffectiveEndDate` is null (i.e., still active).
13. Find all dealers created between '2024-01-01' and '2024-12-31'.
14. List all rows from `CEPP.dbo.SaleCommissionRates` where `DealerId = 210`.
15. Show all `Products` sorted alphabetically by `Name`.
16. Select all columns from `REPORTSUMMARY.dbo.SalesOrders` where `DealerId = 88`.
17. Find all rows in `TRANSACTION.dbo.ApiBillPaymentTransactions` where `DealerId = 42`.
18. List all `Terminals` belonging to `StoreId = 501`.
19. Get the top 5 highest `Amount` values from `REPORTSUMMARY.dbo.SalesOrders`.
20. Select all dealers where `IsAutoRestock = 1`.
21. Find all users where `ModifiedBy` equals a specific `UserId`, e.g. 17.
22. List all rows in `CEPP.dbo.Suppliers` ordered by `Name` ascending.
23. Count the number of distinct `DealerId` values in `CEPP.dbo.Stores`.
24. Select all `BankAccounts` where `BankId = 5`.
25. Find rows in `CEPP.dbo.Dealers` where `CurrencySymbol = 'MYR'`.
26. List all rows in `CEPP.dbo.Roles`.
27. Show the `CreatedDate` and `CreatedBy` for every row in `CEPP.dbo.BulkUploadFiles`.
28. Select terminals where `TerminalModel` is not null.
29. Find all dealers where `SuspendedDate` is not null (i.e., suspended dealers).
30. List the first 20 rows of `TRANSACTION.dbo.ApiGiftCardTransactions`, any order.
31. Select all rows in `CEPP.dbo.Company` where `Name` contains 'Sdn Bhd'.
32. Get all `Products` where `MStatusId <> 1`.
33. List all rows from `NOTIFICATION` where `CreatedDate >= '2025-01-01'`.
34. Select all `LookupCodes` from `CEPP.dbo.LookupCodes` where `LookupType = 'DealerStatus'`.
35. Find the maximum `Amount` in `REPORTSUMMARY.dbo.SalesOrders`.
36. Find the minimum `CreatedDate` in `CEPP.dbo.Dealers` (the earliest dealer registered).
37. Select all rows in `CEPP.dbo.Stores` where `Name` is null.
38. List all `Terminals` where `IsSupportTerminalService = 1`.
39. Count how many rows exist per `MStatusId` value in `CEPP.dbo.Terminals` (GROUP BY).
40. Select all rows in `CEPP.dbo.DealerGroups` ordered by `Id`.

---

## Tier 2 — Intermediate (Q41–Q90)
Joins, GROUP BY with aggregates, subqueries, date ranges, multi-condition
filters. Language is still fairly technical/structured, but a couple of
questions start hiding the table name behind a description.

41. List each dealer's `Name` next to their `DealerGroup`'s `Name` (join `Dealers` to `DealerGroups`).
42. For each store, show the store name and its parent dealer's name.
43. Count how many terminals each store has, showing `StoreId` and the count.
44. Find dealers that have more than 10 stores.
45. List all sales orders (`REPORTSUMMARY.dbo.SalesOrders`) together with the dealer's name, for orders placed in March 2025.
46. Show total `Amount` of sales orders grouped by `DealerId`, sorted highest first.
47. Find the top 5 dealers by total sales order amount in the last 90 days.
48. List every product along with its product type name (join `Products` to `ProductTypes`).
49. Find all stores that have zero terminals assigned.
50. For each dealer, show the count of active terminals (`MStatusId = 1`) vs total terminals.
51. List dealers whose total commission rate entries (`SaleCommissionRates`) is more than 3.
52. Show the average sales order amount per dealer group.
53. Find all users who belong to more than one dealer (join through `UserDealers`).
54. List terminals along with their terminal model name and version.
55. Find dealers that had no sales orders in the last 30 days but had sales orders before that.
56. Show a monthly count of sales orders for 2025, one row per month.
57. List all void orders (`REPORTSUMMARY.dbo.VoidOrders`) joined to the original sales order they voided.
58. Find the dealer with the highest number of suspended terminals.
59. Show each store's total sales amount and rank stores within their dealer by that amount.
60. List all TNG-related sales (`REPORTSUMMARY.dbo.TNGSettlementReport`) for dealers in a specific dealer group.
61. Find products that have never been sold (no matching rows in sales/order tables).
62. Show the number of PIN reload transactions per day for the past week.
63. List dealers along with their bank account details (join `Dealers` or `StoreAccounts` to `BankAccounts`).
64. Find all stores where the sum of sales orders exceeds RM 50,000 this month.
65. Show which suppliers provide which products, with supplier name and product name side by side.
66. Find the second-highest sales order amount overall.
67. List dealers created in each quarter of 2024, with counts.
68. Compare terminal counts between two specific dealer groups.
69. Find all bill payment transactions where the transaction failed (based on a status/lookup code) in the last week.
70. Show each dealer's most recent sales order date.
71. List stores that have terminals but have never processed a bill payment.
72. Find duplicate dealer registrations — dealers sharing the same `RegistrationNo`.
73. Show a running total of sales amount per dealer, ordered by date.
74. List all commission rates that changed (have more than one row) for a given dealer over time.
75. Find the average number of terminals per store, grouped by dealer.
76. Show settlement report totals per biller for the current month (`BillPaymentSettlementReport`).
77. List every dealer group with the number of dealers and the number of stores under it combined.
78. Find users who have never logged any activity (no matching `LOGGING` rows).
79. Show the top 3 products by total quantity sold, per product type.
80. List all terminals that were suspended and later reactivated (status changed more than once, if a history table is available).
81. Find dealers where the sales this month dropped by more than 20% compared to last month.
82. Show all InComm activation transactions (`INCOMM_TRANS.dbo.ActivateTransactions`) alongside the dealer name.
83. List all reversal transactions (`INCOMM_TRANS.dbo.ReversalTransactions`) with the original transaction they reversed.
84. Find the busiest hour of day for sales orders, based on `CreatedDate` time component.
85. Show dealers who operate in more than one region/state.
86. List all stores with their assigned sales manager (via `Dealers.SalesManagerUserId` -> `Users`).
87. Find all products in a product group that have inconsistent pricing across dealers.
88. Show a day-by-day count of new terminal activations for the past month.
89. List all pending workflow status dealers (`MWorkFlowStatusId`) awaiting approval, with how long they've been pending.
90. Find the dealer group with the highest average commission rate.

---

## Tier 3 — Advanced (Q91–Q140)
Multi-table joins across modules (CEPP <-> TRANSACTION/REPORTSUMMARY <->
DataWarehouse), window functions, CTEs, reconciliation-style logic. Phrasing
starts sounding like a real internal ops/finance request rather than a
textbook SQL prompt — you have to infer which tables/joins are needed.

91. For every dealer, show their rank in total sales this year compared to all other dealers.
92. Identify stores whose sales dropped for three consecutive months.
93. Build a report showing each terminal's lifetime transaction count and total value.
94. Find transactions that appear in `TRANSACTION.dbo.ApiGiftCardTransactions` but have no matching settlement row in `REPORTSUMMARY` — i.e., unsettled transactions.
95. For each dealer, compute their month-over-month sales growth percentage for the last 6 months.
96. List every EOD submission and flag any where the submitted total doesn't match the sum of underlying sales orders for that shift.
97. Find dealers whose commission structure changed mid-month, and show the blended effective rate for that month.
98. Identify terminals that have been inactive (no transactions) for more than 60 days but are still marked active in `CEPP`.
99. Build a cohort report: for dealers onboarded in each month of 2024, show their average sales in their first 3 months vs. their most recent 3 months.
100. Find pairs of stores under the same dealer with unusually similar transaction patterns (possible duplicate store setups).
101. Reconcile `TNG` settlement report totals against `TRANSACTION` staging totals for a given date range and list mismatches.
102. For each biller in `BILL_PAYMENT`, compute the failure rate (failed / total attempts) per week over the last quarter.
103. Identify the top 10 stores by sales growth (not absolute sales) over the last 2 quarters.
104. Find users with access to stores across multiple dealers who have made changes (via `ModifiedBy`) to commission rates.
105. Build a report of void orders as a percentage of total orders, per dealer, per month, and flag dealers above the 90th percentile.
106. Trace a single transaction from `TRANSACTION.dbo.ApiBillPaymentTransactions` through to its settlement row and its EOD submission, in one query.
107. Identify dealers who are "dormant risk" — active status in CEPP but zero transactions in the trailing 45 days across all provider tables.
108. For each product, compute a 7-day moving average of daily sales quantity.
109. Find all terminals that were transferred between stores (StoreId changed) and show the before/after store names with the transfer date.
110. Compute each dealer's contribution to total company-wide revenue as a percentage, ranked descending, with a running cumulative percentage column.
111. Identify suppliers whose products have the highest return/reversal rate relative to total transactions.
112. Build a data quality check: find dealers in `CEPP` with a `CompanyId` that doesn't exist in `CEPP.dbo.Company`.
113. For every store, determine its "first sale date" and "most recent sale date" and flag stores inactive for over 90 days since their most recent sale.
114. Compare TNG eWallet reload volume against InComm gift card volume, by dealer group, for the last fiscal quarter.
115. Find the median transaction amount per product type (not average).
116. Identify commission rate entries that overlap in effective date range for the same dealer (data integrity issue).
117. Build a report showing, for each terminal model, the average transaction success rate.
118. Find dealers whose settlement report total in `REPORTSUMMARY` disagrees with the aggregated DataWarehouse `FACT_DAILYSALES` figure for the same month.
119. For each region, rank dealer groups by total commission paid out year-to-date.
120. Identify terminals with an unusually high void-to-sale ratio compared to the store average, as possible fraud indicators.
121. Build a query that shows, for each dealer, the number of distinct products sold and the concentration (% of sales from their top 1 product).
122. Trace every step a prepaid registration goes through — from `PREPAID.dbo.PrepaidRegistrations` to its resulting transaction and settlement.
123. Find weeks where a specific biller's transaction volume in `BILL_PAYMENT` diverged more than 2 standard deviations from its trailing 8-week average.
124. Identify stores that share the same address or contact number but are registered under different dealers (potential duplicate merchant setups).
125. Build a retention report: of dealers active in January, what percentage were still transacting in June?
126. Compute each sales manager's team performance — total sales across all dealers assigned to them via `SalesManagerUserId`.
127. Find all terminal service product settings that reference a product no longer available for sale (soft-deleted or status-inactive).
128. Identify the longest gap (in days) between consecutive transactions for each terminal, and flag the top 20 longest gaps.
129. Build a query that pivots monthly sales totals for the last 12 months into columns, one row per dealer.
130. Find dealers where the number of active terminals grew but total sales did not grow proportionally (declining productivity per terminal).
131. Reconcile InComm activation and deactivation transaction counts to ensure every activation has a matching downstream record.
132. Identify the top 5 dealer groups by year-over-year revenue growth, excluding groups with fewer than 5 dealers.
133. Build an aging report for pending workflow-status dealers, bucketed into 0-7, 8-30, 31-90, 90+ days pending.
134. Find all stores that had a terminal go from active to suspended to active again within a 30-day window.
135. Compute each dealer's effective blended commission rate, weighted by the sales volume of each product they sell.
136. Identify which product groups are declining in share of total transaction volume over the last 4 quarters.
137. Build a query showing the first and last transaction for every dealer, and how many total distinct calendar days they transacted on.
138. Find discrepancies between `CEPP.dbo.Terminals.MStatusId` and the terminal's actual recent transaction activity (status/behavior mismatch).
139. Rank stores within each dealer by sales, but only include dealers with at least 5 stores, and only show the top 3 stores per dealer.
140. Identify all commission packages that are about to expire (`EffectiveEndDate` within 30 days) and the dealers who would be affected.

---

## Tier 4 — Expert (Q141–Q180)
Fully business-framed, ambiguous on purpose — like a stakeholder (finance,
ops, compliance) asking a question in plain English with no hint of which
tables or joins are involved. You have to figure out the data model yourself.

141. "Which of our merchants are quietly slowing down — not stopped, just fading — over the past few months?"
142. "I want to know if any of our terminals are being used way more than they should be for their type. Can you check?"
143. "Some of our dealers seem to be getting a better commission deal than others doing the same volume. Can you find who?"
144. "Are there any stores that look like the same business registered twice under different dealers?"
145. "I need to know which billers are having a rough week compared to normal — anything look off?"
146. "Give me a sense of how sticky our merchants are — once they start reloading with us, do they keep coming back?"
147. "Which sales manager's book of business is actually growing, and whose is stalling?"
148. "Something feels off with our void rates lately. Can you dig in and tell me where?"
149. "Can you find any money that seems to have gone missing between what the terminals reported and what actually got settled?"
150. "Which of our product lines are losing ground to others, even if overall sales look fine?"
151. "I suspect some terminals are marked active in the system but haven't actually done anything in ages. Confirm?"
152. "How concentrated is our revenue — are we relying too heavily on a small number of dealers?"
153. "Are commission rates ever overlapping or conflicting for the same dealer? That shouldn't happen."
154. "Which regions are punching above or below their weight in terms of revenue per merchant?"
155. "I want a health check — dealers that are technically 'active' but haven't transacted in a month and a half."
156. "Did any biller's failure rate spike recently, and is it isolated or spreading?"
157. "Can you tell me if our approval queue for new dealer onboarding is backing up anywhere?"
158. "Some terminals seem to bounce between suspended and active a lot — is that a pattern worth investigating?"
159. "I need a picture of which dealer groups are actually driving growth versus just sitting flat."
160. "Are there any products that basically nobody buys anymore? I want to consider dropping them."
161. "Show me merchants whose terminal count is growing but their revenue per terminal is shrinking — that smells like inefficiency."
162. "What does the typical transaction size look like per product category — not the average, the middle-of-the-pack number."
163. "Can you check whether every gift card activation we recorded actually has a matching downstream trail? I don't want any orphaned activations."
164. "Give me a merchant retention curve — of everyone active at the start of the year, how many are still with us now?"
165. "I want to see how much of our total commission payout is going to each region, ranked."
166. "Which stores look dormant based on their last transaction date, even though nothing in the system flags them as closed?"
167. "Are there merchants whose reported sales don't reconcile with what's in our data warehouse numbers?"
168. "Find me any suspicious pattern where a terminal has a lot of voids relative to its actual sales."
169. "I want to understand each dealer's product mix — are they diversified or all-in on one thing?"
170. "Which weeks this quarter had unusually low or high volume for a specific biller, statistically speaking?"
171. "Show me which merchants grew their terminal footprint but didn't see proportional revenue growth."
172. "Can you flag any dealer whose company record seems to be missing or broken in the master data?"
173. "I want the full lifecycle of a transaction — from the moment it hits our systems to when it's finally settled — for a handful of sample transactions."
174. "Which merchants are about to lose their special commission arrangement in the next month?"
175. "Compare how eWallet reloads are trending against gift card reloads for our top merchant groups."
176. "Tell me which sales manager has the best-performing portfolio this year versus last year."
177. "Are there any long stretches where a specific terminal just went quiet — no activity for an unusually long time?"
178. "I need to know if any store shares contact details with another store that's technically a different merchant."
179. "How much of the company's revenue comes from just the top handful of merchants? I want the cumulative picture."
180. "Give me a merchant-by-merchant breakdown of how many different products they sell and whether they're overly reliant on just one."

---

## Tier 5 — Wizard (Q181–Q200)
Maximally human, indirect, and layered — the kind of thing a non-technical
exec or auditor would actually say, often bundling 2-3 implicit questions
or requiring you to define your own thresholds/assumptions before writing
any SQL at all.

181. "Before we sign off on this quarter's numbers, I want to be confident nothing's slipping through the cracks between what the terminals say happened and what we actually paid out — walk me through how you'd prove that end to end."
182. "Our biggest merchant just asked why their commission looks different from a competitor's despite doing similar volume — I need an answer I can defend, not just a number."
183. "If I had to bet on which five merchants are going to churn in the next quarter, what would the data tell me to look at, and who are they?"
184. "Ops thinks something's wrong with how terminals get reassigned between stores, but nobody can point to specific cases — can you find the ones that look off?"
185. "The board wants to know if we're too dependent on a handful of dealer groups for our growth story — give me the honest picture, not the flattering one."
186. "Compliance is asking whether any store might be a shell or duplicate set up to game commissions — how would you even go about checking that from the data we have?"
187. "I keep hearing anecdotes that certain terminal models are less reliable, but nobody's shown me numbers — is there anything in the transaction patterns that backs that up?"
188. "We want to reward sales managers fairly next cycle — build me something that separates who's actually driving new growth from who's just riding existing accounts."
189. "Finance flagged a gap between the settlement reports and the warehouse totals for last month, but couldn't say where — find the exact points of divergence."
190. "If a regulator asked us to prove every gift card activation this year has a clean, traceable path to settlement, could we? Show me where it breaks down, if anywhere."
191. "One of our billers has been the subject of merchant complaints lately — is there anything in the failure/volume patterns that would explain why, and when it started?"
192. "I want a story, not just numbers: which merchant segments are thriving, which are coasting, and which are quietly dying — and why should I believe the difference isn't just noise?"
193. "Before we approve this dealer's request for a better commission rate, tell me honestly whether their volume and consistency actually justify it compared to peers in the same group."
194. "There's a theory going around that void rates spike right before a merchant goes dormant — is that actually true in our data, or just a story people tell?"
195. "If I wanted to catch a terminal being skimmed or misused before it shows up as a big loss, what pattern in the data would be the earliest warning sign?"
196. "We're thinking of consolidating regions with weak performance — show me which regions are genuinely underperforming versus which just have fewer, smaller merchants dragging the average down."
197. "A new dealer group wants aggressive commission terms citing 'expected volume' — based on how similar new dealer groups actually performed in their first two quarters historically, is that realistic?"
198. "Legal wants to know if any dealer's data setup (company link, registration info) is inconsistent enough that it could be a compliance problem, not just messy data entry."
199. "If our warehouse star schema and our live settlement numbers ever quietly drifted apart without anyone noticing, how would we detect that going forward, not just this one time?"
200. "Pull it all together: if you had to tell leadership the single biggest revenue risk hiding in this data right now, backed by a query, what would it be and how did you find it?"

---

---

## Tier 6 — Master (Q201–Q250)
Picks up past Wizard-tier ambiguity. These are no longer "write one query
for one ask" — most require you to (a) design the approach before touching
SQL, (b) reason across 4+ databases at once including ones outside the core
CEPP/TRANSACTION/REPORTSUMMARY/DataWarehouse spine (INCOMM_TRANS, PREPAID,
RESTORIFY, TICKET, NOTIFICATION, LOGGING, CONFIGURATION, MLookUp, the newer
per-provider TRANSACTION schemas), (c) account for the vault's own caveats —
unenforced FKs, incomplete CEPP/TRANSACTION baselines, no cardinality info,
soft status columns instead of hard deletes — and (d) often produce more
than a single result set (a small system: a view, a scheduled check, a
scoring model) rather than one query. Complexity increases steadily; by
Q250 you're essentially being asked to design a small analytics/monitoring
subsystem and justify it, the way a staff engineer or a data lead would be
asked to in a real incident or planning meeting.

201. "A merchant is disputing a settlement figure from three months ago and wants a full paper trail. Reconstruct, end to end, every system that touched that money — from the terminal transaction through TRANSACTION staging, EOD submission, REPORTSUMMARY settlement, and into the DataWarehouse fact table — and show me anywhere the numbers don't tie out."
202. "We're about to deprecate the `PREPAID` module in favor of what's now handled inside `TRANSACTION`. Before we do, prove that every historical prepaid registration has an equivalent, reconcilable record somewhere in the newer flow, or tell me exactly which ones would be orphaned."
203. "Design a query (or set of queries) that could run nightly to catch 'ghost terminals' — terminals marked active in CEPP, assigned to a store, with a valid model and version, but that have not produced a single transaction across ANY provider schema (TNG, INCOMM_TRANS, BILL_PAYMENT, RESTORIFY, TICKET, core TRANSACTION) since activation."
204. "Build a merchant risk score from scratch using only what's in this database — no external data. Walk me through which signals you'd pull (void ratios, dormancy, commission anomalies, terminal churn, reversal rates) and how you'd combine them into one number per dealer, then show the query for at least the top 3 signals."
205. "Two dealer groups merged on paper last year, but their data was never consolidated. Find every place in the schema where that would cause double-counting or broken joins if someone naively summed revenue by 'dealer group' today, and propose how you'd query around it without a schema migration."
206. "I want a single query that answers: for every currency we operate in, what's our effective revenue after commission payout, net of voids and reversals, for the trailing 12 months — broken down by provider (TNG vs InComm vs bill payment vs core reload)."
207. "Some terminals silently changed `TerminalModel` mid-life without a version history table capturing it cleanly. Given only what IS reliably tracked, propose a way to detect a terminal model swap purely from behavioral changes in its transaction pattern, and write the query that would flag candidates."
208. "A store was deleted from active use (status changed, not row-deleted) but its terminals were never reassigned or deactivated. Find every such 'zombie store' situation across the whole estate and quantify the transaction volume, if any, that's still flowing through them."
209. "Build a query that identifies commission leakage: cases where the effective commission actually paid out (based on SaleCommissionRates/DealerCommissionPackages history) doesn't match what the rate schedule in effect at the transaction date says it should have been."
210. "Simulate a worst-case scenario: if the `TRANSACTION` core schema and one specific provider schema (say TNG) diverged for a full week due to a sync failure, what query would you run first to quantify blast radius (dealers affected, revenue affected, settlement lag introduced)?"
211. "The InComm gift card flow has three tables — activation, deactivation, and reversal. Find any activation with a deactivation AND a reversal both linked to it, which shouldn't be logically possible, and explain what that would mean operationally if found."
212. "Executives want to know our 'true' active merchant count — not what CEPP's status flag says, but based on actual transacting behavior in the last 30/60/90 days across every provider schema combined. Build the tiered definition and the query for each tier."
213. "A regulator wants proof that no single employee (by `ModifiedBy`/`CreatedBy`) has unilaterally created a dealer AND approved its commission package AND processed its first transaction — a segregation-of-duties check. Design how you'd query for violations across CEPP and TRANSACTION."
214. "Build a same-day settlement SLA report: for every EOD submission, calculate the time between the last transaction included and when the settlement report row was created in REPORTSUMMARY, and flag any dealer whose average lag is trending upward over the last 8 weeks."
215. "We suspect one supplier's products are systematically overpriced relative to market-equivalent products from other suppliers in the same product group. Design the comparison query, accounting for currency and product group correctly."
216. "Trace the complete lifecycle of a single RM 50 reload from a specific terminal on a specific date — every table it should have touched, in order — and write a query for each hop, noting anywhere the trail could legitimately go cold given what we know is and isn't in this schema."
217. "A dealer group wants to spin off one of its dealers into an independent entity with its own `CompanyId`. Before that's approved, find every foreign-key-by-convention relationship (all ~734 of them, conceptually) that touches `DealerId` and identify which downstream systems would break silently if the dealer's `CompanyId` changed without a coordinated update."
218. "Design a fraud heuristic that combines: unusually high void-to-sale ratio, terminal reassignment frequency, and transaction timing outside a store's normal operating hours (`OperationStartTime`/`OperationEndTime`) into a single composite alert query."
219. "For our DataWarehouse `FACT_DAILYSALES`, determine whether it behaves as a slowly-changing dimension correctly — specifically, if a dealer's `DealerGroupId` changes, does historical fact data reflect the OLD group or get silently reattributed to the NEW one? Design a query to detect which behavior is actually happening in our data."
220. "Compliance wants a 'know your merchant' completeness check: every active dealer should have a complete chain — Company, at least one BankAccount, at least one active Store, at least one active Terminal, and a CreatedBy user that still exists and is active. Find every dealer failing any link in that chain."
221. "Build a query that estimates how much revenue we're leaving on the table from terminals that go from active to suspended and are never reactivated — essentially a terminal 'churn cost' model, using each terminal's trailing average revenue before suspension as the baseline."
222. "One of our biller integrations under BILL_PAYMENT has a schema-per-biller design. Write a query approach (not necessarily one SQL statement) to compare failure rates apples-to-apples across billers that may have different status/lookup code conventions per schema."
223. "A merchant claims they were charged a higher commission rate than their contract states, going back 14 months, across a period where their `DealerCommissionPackage` changed twice. Reconstruct exactly which rate applied to which transaction and produce a corrected-vs-actual variance report."
224. "Design a query that would catch 'commission rate gaming' — a dealer whose transaction volume spikes suspiciously right before a scheduled commission rate increase takes effect (`EffectiveStartDate`), suggesting artificial volume inflation."
225. "We want to build an early-warning system for biller outages: a query that compares each biller's transaction volume in the last rolling hour against its typical volume for that hour-of-week, and flags anomalies before a human would normally notice."
226. "Determine, using only what's reconstructable from CEPP and TRANSACTION, whether our terminal provisioning process has ever assigned the same terminal serial/model combination to two different active stores simultaneously — a provisioning bug that would show up as inconsistent, not necessarily impossible, in this schema."
227. "For the RESTORIFY carbon-offset product line, correlate subscription payment consistency (`CalculatorSubscriptionPayments`) against the dealers' core reload transaction volume — do carbon-offset subscribers tend to be our higher-volume or lower-volume core merchants?"
228. "Build a full data lineage query: for one specific `FACT_DAILYSALES` row, work BACKWARD to every REPORTSUMMARY row that fed it, and from there backward to every TRANSACTION-side row that fed those, proving the aggregation is correct for that one row."
229. "A new regulation requires us to show, for any given day, every dealer whose end-of-day submission was late by more than 2 hours past their `OperationEndTime`, cross-referenced with whether that lateness correlated with any settlement discrepancy that day."
230. "Design a query to detect 'phantom commission packages' — DealerCommissionPackages rows with an EffectiveStartDate/EffectiveEndDate range that no transaction ever actually fell inside, suggesting either dead configuration or a dealer who was set up but never went live."
231. "For dealers operating in multiple currencies (implied by `CurrencySymbol` differing from their `Company`'s presumed home currency), find any case where a settlement report total appears to have been summed without proper currency conversion — i.e., data that would only make sense if two different currencies were added together as if they were the same."
232. "Model 'merchant lifetime value' using only internal data: total net revenue contribution per dealer from first transaction to either their last transaction or today, minus estimated support/overhead proxied by how many status changes (suspensions, workflow reversions) they've required."
233. "We think our TNG integration under-reports voids compared to core TRANSACTION voids for the same merchants. Build the cross-schema comparison query and identify the size and direction of the discrepancy, if any."
234. "Build a query that identifies 'silent migrations' — dealers who used to transact heavily through one provider (e.g., InComm) and now transact almost entirely through another (e.g., core TRANSACTION reload) within the same 6-month window, which could indicate either a strategic shift or a broken integration nobody flagged."
235. "Design an audit query for our LOGGING table: does every `ModifiedBy`/`CreatedBy` actor on a sensitive table (Dealers, SaleCommissionRates, BankAccounts) have a corresponding login/session record in LOGGING around the same timestamp? Flag changes with no corresponding audit trail."
236. "A dealer's `MWalletTypeId` and `WalletId` reference wallet data. Build a query that verifies wallet balance movements (as best reconstructable) are consistent with the sum of that dealer's settled transactions minus payouts, and flag any dealer where the two don't reconcile."
237. "Propose and implement a query-based early detection for 'store cloning' — near-identical `Stores` rows (same address fields, same contact, overlapping operating hours) created under different `DealerId`s within a short time window of each other, which historically has correlated with fraud in similar systems."
238. "Build a full quarter-over-quarter attribution model: of this quarter's total revenue growth (or decline) versus last quarter, how much is explained by (a) existing dealers transacting more, (b) new dealers onboarded, and (c) dealers who churned out — a full bridge/waterfall breakdown, not just a total."
239. "For our top 20 dealers by volume, build a 'concentration risk' dashboard query: what % of THEIR revenue comes from a single store, a single terminal, and a single product — three separate concentration ratios per dealer — to identify who has dangerous single points of failure."
240. "Trace whether NOTIFICATION messages sent for failed transactions actually correspond 1:1 with transactions that show a failure status elsewhere in TRANSACTION/REPORTSUMMARY — build the reconciliation and quantify both false positives (notified but no failure found) and false negatives (failure found but no notification sent)."
241. "Design a query to answer: if we had to roll back to yesterday's settlement snapshot because of a suspected data corruption today, which dealers would see a settlement figure change, by how much, and is the pattern consistent with a data bug or with legitimate late-arriving transactions?"
242. "Using MLookUp and CONFIGURATION as shared reference tables, find any place where a status/lookup code used in a provider schema (say a specific `LookupType` in TNG or BILL_PAYMENT) has drifted out of sync with what MLookUp currently defines — i.e., orphaned or undefined codes still being written."
243. "Build a merchant segmentation model purely from behavioral data (transaction frequency, average ticket size, product diversity, void rate, tenure) that clusters dealers into something like 'stable core', 'high-growth', 'high-risk', and 'declining' — describe the query-derived features you'd compute for each dealer as the input to that segmentation."
244. "A postmortem is being written for an incident where duplicate settlement rows were suspected for one day last month. Write the exact query you'd run to prove or disprove duplication at the REPORTSUMMARY level, accounting for the possibility that some 'duplicates' are legitimate re-submissions with a different `ModifiedDate`."
245. "For the TICKET (Ticket2U voucher) integration, which touches only 3 tables across 2 schemas, determine how confidently you can reconcile it against REPORTSUMMARY given how thin the schema is — and design the best-effort query plus a clear statement of what it CANNOT prove given the data available."
246. "Build a single query or view that could serve as the definitive 'source of truth' for a dealer's current effective commission rate at any point in time (not just today) — handling overlapping packages, rate changes mid-period, and dealer-group-level defaults falling back when a dealer has no specific override."
247. "Estimate the financial impact of the ~130 tables the vault excluded as replication scaffolding/temp/test junk — obviously you can't query dropped tables, but design a query against the surviving schema that would tell you whether any CURRENT table shows suspicious gaps or jumps in identity `Id` sequences that might hint at data that used to exist and was migrated away."
248. "Leadership wants one number: 'What percentage of our total processed volume last year passed through at least one manual intervention point (a status override, a workflow reversion, a manually-triggered retry in PaymentRetryOperation, or a void)?' Define exactly what counts as 'manual intervention' from the schema, then compute it."
249. "Design a full continuous monitoring suite (as a set of named queries, not just one) that, together, could replace a human reviewing this database every morning — covering settlement reconciliation, dormant terminal detection, commission anomalies, biller health, and merchant concentration risk — and explain how you'd prioritize alerts if all five fired on the same day for different dealers."
250. "You have one query to run before this database goes into a board meeting in an hour, and you can only surface ONE finding. Given everything you now understand about how CEPP, TRANSACTION, REPORTSUMMARY, DataWarehouse, and the provider schemas fit together — including their gaps, their unenforced relationships, and their real-world failure modes — what's the single most consequential thing you'd check, why that one over everything else in this set, and what does the query look like?"

---

### Notes on difficulty progression
- **Tier 1**: table/column named explicitly, single clause.
- **Tier 2**: joins + GROUP BY + basic subqueries, table names still given.
- **Tier 3**: cross-module joins, CTEs/window functions, reconciliation
  logic — table names sometimes only implied by domain description.
- **Tier 4**: pure business phrasing, no table names at all — requires
  mapping intent to the CEPP/TRANSACTION/REPORTSUMMARY/DataWarehouse model.
- **Tier 5**: multi-part, ambiguous, exec/audit voice — requires clarifying
  assumptions (thresholds, definitions of "dormant"/"risk"/"underperforming")
  before a query is even possible.
- **Tier 6**: real-world system-design-grade problems — cross-module
  reconciliation, fraud/risk modeling, audit and segregation-of-duties
  checks, data lineage tracing, and monitoring-suite design. Frequently
  needs more than one query, explicit assumptions, and awareness of the
  schema's own limits (unenforced FKs, incomplete baselines, soft-status
  instead of hard deletes) to even scope the problem correctly.
