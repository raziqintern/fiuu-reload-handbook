# C# — 250-question progressive syntax training set

Same progression model as the SQL set: Tier 1 is bare syntax with the
construct named explicitly; by Tier 6 you're given a real-world scenario
(flavored like the reload/web + class-library-style C# codebase — dealers,
terminals, transactions, EOD, commission) and have to figure out which
language features to reach for yourself. No answers included.

---

## Tier 1 — Beginner (Q1–Q40)
Core syntax: variables, types, control flow, loops, methods, basic classes.
Construct named directly.

1. Declare an `int` variable named `counter` and assign it `0`.
2. Declare a `string` variable named `message` and assign it `"Hello"`.
3. Write an `if...else` that checks if a number is positive, negative, or zero.
4. Write a `switch` statement on a variable `dayOfWeek` with cases `1` to `7` and a `default`.
5. Write a `for` loop that prints numbers `1` to `10`.
6. Write a `foreach` loop that iterates over a `string[]` and prints each one.
7. Write a `while` loop that runs while a counter is less than `5`.
8. Write a `do...while` loop equivalent to the same logic.
9. Declare an array of 5 `int`s named `numbers`.
10. Declare and initialize an array literal: `string[] fruits = { "Apple", "Banana" };`.
11. Write a `void` method named `PrintMessage` with no parameters that prints `"Hi"`.
12. Write a method named `AddNumbers` that takes two `int`s and returns their sum.
13. Write a method with a default parameter value (`int x = 10`).
14. Write a `ref` parameter example that doubles a passed integer in place.
15. Declare a `const` named `Pi` equal to `3.14159`.
16. Declare a `bool` variable and use it in an `if` check.
17. Concatenate two strings using the `+` operator.
18. Use string interpolation (`$"..."`) to build a string with two placeholders.
19. Write a `try...catch...finally` block that catches a `DivideByZeroException`.
20. Declare a `int?` (nullable int) and check `.HasValue` before using `.Value`.
21. Write a `class` named `Person` with auto-implemented `Name` and `Age` properties.
22. Instantiate `Person` and set its properties using object initializer syntax.
23. Write a constructor for `Person` that takes `name` and `age`.
24. Declare an `enum` named `Status` with `Active`, `Inactive`, `Suspended`.
25. Use that `enum` inside a `switch` statement.
26. Write a `for` loop with multiple initializers/incrementers in the same statement.
27. Explain what `var` does and when the compiler can and can't infer the type.
28. Write a single-line comment (`//`) and a block comment (`/* */`).
29. Use `break` and `continue` inside two different loops.
30. Use the `%` operator to check whether a number is even.
31. Loop through an `int[]` and sum all its values.
32. Declare a two-dimensional array (`int[,]`) and access one element by index.
33. Write a `static void Main(string[] args)` entry point.
34. Convert a `string` to an `int` using `(int)` cast (where applicable), `Convert.ToInt32`, and `int.Parse`; note the differences.
35. Use `int.TryParse` to safely convert a string to an integer.
36. Write an `if` using `&&` and `||` (short-circuit logical operators).
37. Write a `struct` named `Point` with `X` and `Y` fields.
38. Use `==` vs `ReferenceEquals` to compare object references, and explain the pitfall with strings.
39. Write an `interface` named `IShape` with a method `double Area();`.
40. Implement `IShape` in a class named `Circle`.

---

## Tier 2 — Intermediate (Q41–Q90)
Collections, exceptions, string handling, LINQ basics, class relationships.
Constructs still named, but you assemble them yourself.

41. Declare a `List<int>` and add five values to it.
42. Use `List<T>.Sort()` and `.Reverse()` on a list of strings.
43. Declare a `Dictionary<string, int>` mapping product codes to prices, and add three entries.
44. Loop over a `Dictionary` using `foreach (var kvp in dict)`, printing key and value.
45. Use `.TryGetValue` to safely check before reading a `Dictionary` value.
46. Write a custom exception class named `InsufficientBalanceException` inheriting from `Exception`.
47. Throw and catch your custom exception with a meaningful message.
48. Use `catch (SpecificException ex) when (<condition>)` (exception filter).
49. Write a method that returns multiple values using a `(int, string)` tuple.
50. Use `string.Split` and `string.Join` to break apart and reassemble a CSV line.
51. Use `.Trim()`, `.ToUpper()`, and `.Contains()` chained on one string expression.
52. Write a LINQ query using query syntax (`from ... in ... where ... select`) over a `List<int>`.
53. Rewrite the same LINQ query using method syntax (`.Where(...).Select(...)`).
54. Use `Enumerable.Sum`, `.Average`, and `.Max` on a `List<decimal>`.
55. Write a class `Animal` and a class `Dog : Animal`, overriding a `MakeSound` method.
56. Mark a base method `virtual` and override it correctly with `override`.
57. Use `abstract class` to make a class abstract, and `abstract` on one of its methods.
58. Write a `static` method and a `static` field on a class.
59. Use `this` inside a constructor to disambiguate a parameter name from a field.
60. Write a property with explicit `get`/`set` blocks (not auto-implemented) that validates the setter value.
61. Use an init-only or read-only property set only in the constructor (`{ get; }` or `{ get; init; }`).
62. Write a `foreach` loop over a `List<Person>` and filter using an inline `if`.
63. Use `Array.Sort` and `Array.IndexOf` on a `string[]` array.
64. Write a recursive method that computes factorial.
65. Write a method using `params int[]` to accept a variable number of arguments.
66. Use the null-conditional operator (`?.`) and null-coalescing operator (`??`) together safely.
67. Use the null-coalescing assignment operator (`??=`) to set a default only if null.
68. Write a method that takes an `Action<int>` delegate and invokes it.
69. Declare a custom `delegate` type and assign a matching method to a variable of that type.
70. Use `+=` and `-=` to subscribe and unsubscribe an event handler at runtime.
71. Declare a custom `event` on a class using `EventHandler` and raise it.
72. Write a lambda expression assigned to a `Func<int, int, int>`.
73. Use `using (...)` (or a `using` declaration) with a `StreamReader` to read a text file safely.
74. Write code to read all lines of a file into a `List<string>` using `File.ReadAllLines`.
75. Write code to write a `List<string>` back out to a file using `File.WriteAllLines`.
76. Use `string.IsNullOrEmpty` vs `string.IsNullOrWhiteSpace` and explain the difference with an example.
77. Write a method that takes an `IEnumerable<int>` and returns only even numbers using LINQ.
78. Use `GroupBy` in LINQ to group a `List<Person>` by an `Age` bracket.
79. Use `OrderBy` and `ThenBy` to sort a `List<Person>` by `LastName` then `FirstName`.
80. Write a class that implements `IComparable<T>` so instances can be sorted directly.
81. Write a class that overrides `.ToString()` to produce a custom string representation.
82. Override `.Equals()` and `.GetHashCode()` on a simple value-like class.
83. Use a `SortedDictionary<TKey, TValue>` and explain when you'd pick it over `Dictionary`.
84. Write a generic method `static T Max<T>(T a, T b) where T : IComparable<T>`.
85. Write a generic class `Box<T>` with a single `Value` property.
86. Use pattern matching (`is` with a type pattern) to check an object's runtime type before using it.
87. Use `as` vs a direct cast vs pattern matching, and explain when each is appropriate.
88. Write a class implementing `IDisposable` with a `Dispose()` method releasing a resource.
89. Use that `IDisposable` class inside a `using` block.
90. Write a method with multiple `catch` blocks handling different exception types in priority order.

---

## Tier 3 — Advanced (Q91–Q140)
Generics, interfaces, async/await, reflection-lite, more realistic
multi-class structures. Still explicit constructs, but composed into
small systems.

91. Design an `interface IRepository<T>` with `Add`, `GetById`, and `GetAll` members, and implement it with an in-memory `List<T>`.
92. Write an `async Task<T>` method that awaits a simulated delay (`Task.Delay`) and returns a result.
93. Call that async method from `Main` using `await` (top-level or `async Task Main`), and explain why blocking with `.Result` is risky.
94. Write a method using `Task.WhenAll` to run three independent async operations concurrently.
95. Use a `try...catch` around an `await` call and explain how exceptions propagate from async methods.
96. Write a class hierarchy: `abstract class PaymentMethod` with `CardPayment` and `WalletPayment` subclasses, each implementing a `Process` method differently (polymorphism).
97. Use an `interface` combined with an `abstract` base class together and explain why you'd choose one over the other.
98. Write a `partial class` split across two conceptual files, and explain why partial classes exist.
99. Use the `new` modifier to hide (not override) a base class member, and demonstrate the difference from `override` with a small example.
100. Write a method using `Reflection` (`GetType()`, `.GetProperties()`) to print every property name and value of an arbitrary object.
101. Write a generic constraint example: `class Repository<T> where T : class, new()` and explain what each constraint means.
102. Implement `IEnumerable<T>` on a custom collection class using an iterator method and `yield return`.
103. Write an iterator method that lazily yields Fibonacci numbers indefinitely.
104. Use `lock` around a shared counter increment to make it thread-safe.
105. Write two `Thread` objects that increment a shared counter, and show the race condition without `lock`.
106. Use `Interlocked.Increment` as an alternative to `lock` for a simple counter.
107. Write a class using `Lazy<T>` to defer expensive initialization until first access.
108. Use `Task.Run` to offload CPU-bound work off the calling thread, and explain when that's actually beneficial vs harmful in a UI or ASP.NET context.
109. Write a method that uses `try...catch...finally` where `finally` releases a resource even when an exception is rethrown.
110. Write a custom `Attribute` class and apply it to a property, then read it back via reflection.
111. Use `Nullable<T>` combined with `GetValueOrDefault` in a calculation pipeline that tolerates missing data.
112. Write an extension method (`public static class` with a `this` parameter) that adds a `.ToTitleCase()` method to `string`.
113. Write a LINQ query that joins two in-memory lists (e.g., `Dealers` and `Stores`) on a shared key using `Join ... on ... equals`.
114. Write a LINQ query that performs a left-outer-join-like operation using `GroupJoin` plus `SelectMany`/`DefaultIfEmpty`.
115. Design an `IValidator<T>` interface and a `CompositeValidator<T>` that runs multiple validators and aggregates errors.
116. Write a class implementing the observer pattern manually using `event`/`EventHandler<T>`, without a framework.
117. Write a method that deep-clones an object graph, and explain the pitfall of a naive shallow `MemberwiseClone`.
118. Use `System.Text.Json` (or similar) conceptually to serialize a class to a string and back.
119. Write a class implementing `IEquatable<T>` correctly alongside overridden `Equals`/`GetHashCode`.
120. Write a small state machine using an `enum` for state plus a `switch` dispatch, modeling a transaction's lifecycle (Pending -> Processing -> Settled/Failed).
121. Write a method using recursion with memoization (a `Dictionary` cache) to avoid recomputation.
122. Use `ConcurrentDictionary<TKey, TValue>` and explain why it's safer than `Dictionary` under concurrent access.
123. Write a generic method that accepts `IEnumerable<T> where T : IComparable<T>` and returns the largest item.
124. Write a class exposing a fluent-style API (builder pattern) where each method returns `this` to allow chaining.
125. Write code demonstrating boxing/unboxing with `object` and `int`, and why it matters for performance in a tight loop.
126. Write a method that uses composite/custom format strings (e.g., currency, padding) for a settlement report line.
127. Use `DateTime` arithmetic (`AddDays`, `Subtract`) to compute whether an `EffectiveEndDate` has passed.
128. Write a `TimeSpan` calculation showing elapsed processing time between two `DateTime` values.
129. Write a class implementing multiple interfaces at once and resolving a name collision between them using explicit interface implementation.
130. Write a static class exposing extension methods usable across the whole solution, and explain what `using` (namespace import) is needed to bring them into scope.
131. Write a small dependency-injection-by-hand example: a class `OrderProcessor` that receives an `IRepository<Order>` via constructor injection rather than `new`-ing it internally.
132. Write a method that safely parses a configuration value with a fallback default, guarding against `FormatException`.
133. Write a class implementing a simple retry-with-backoff loop around a flaky operation (simulate with a random failure).
134. Write a method combining `try...catch` with custom exception wrapping (`throw new AppException("context", innerEx)`).
135. Write a class `CommissionCalculator` that selects the correct commission rate given overlapping effective-date ranges, using LINQ `Where` + `OrderByDescending`.
136. Write an `async Task` method that fetches data from two simulated sources concurrently and merges the results once both complete.
137. Write a class using `protected internal` and explain the accessibility scope compared to `protected` alone.
138. Write a method demonstrating `yield return` combined with a `while` condition to produce a lazily-evaluated, potentially infinite sequence, with consuming code stopping early via `.Take(n)`.
139. Write a class marked `sealed` and explain why you'd want to prevent further inheritance.
140. Write a method that validates a terminal's serial number against a regex pattern using `System.Text.RegularExpressions.Regex`.

---

## Tier 4 — Expert (Q141–Q180)
Fully business-framed C# tasks (reload/CEPP-flavored), naming no specific
keyword — you decide the constructs.

141. "Write a class that represents a dealer's commission structure, where the rate can change over time, and give me the current effective rate for any date I ask for."
142. "I want a reusable way to validate a terminal's status transition — active can go to suspended, suspended can go to active or retired, but nothing else. Model that so invalid transitions throw a clear error."
143. "Build something that retries a flaky settlement-file upload up to 3 times with increasing delay before giving up and logging the failure."
144. "Give me a small in-memory cache for product lookups that expires entries after 5 minutes so we're not hammering the database for the same product repeatedly."
145. "Model a transaction going through its lifecycle — created, pending, settled, voided — in a way that makes an illegal jump (like voided straight to settled) impossible to compile past, not just a runtime check."
146. "I need a way to process a batch of EOD records where each one might fail independently, but I still want a summary of which succeeded and which didn't at the end, not a single exception that kills the batch."
147. "Build a generic paged-result wrapper I can reuse for any list — dealers, stores, transactions — that carries the page number, page size, total count, and the items."
148. "Write something that takes a list of sales orders and groups them by dealer, then by day, computing a running total per dealer as the days go by."
149. "I want two different payment providers (say TNG and InComm) to be swappable behind one interface, so the rest of the code doesn't care which one is actually processing the reload."
150. "Give me a safe way to parse a terminal's raw config string (semi-colon delimited key=value pairs) into a strongly-typed object, without blowing up on malformed input."
151. "Model a store's operating hours and give me a method that tells me if a given timestamp falls inside them, correctly handling hours that cross midnight."
152. "Build a small event system so that when a dealer's status changes to suspended, any number of other parts of the app (notification, reporting, terminal deactivation) can react without the status-change code knowing about them directly."
153. "I want a builder-style way to construct a complex SalesOrder object step by step, so the calling code reads cleanly instead of one giant constructor call."
154. "Write a class that can calculate commission for a mixed batch of products with different commission structures (flat rate, tiered, percentage) using one unified method."
155. "Give me a thread-safe counter of in-flight transactions per terminal, so multiple threads processing transactions concurrently don't corrupt the count."
156. "Build something that reads a large transaction log file line by line without loading the whole file into memory, and yields parsed transaction objects as it goes."
157. "I want to compare two versions of a dealer's commission package and get back a clear list of what changed — which fields, old value, new value."
158. "Write a validator pipeline for a new dealer registration form that runs several independent checks and collects ALL the errors, not just the first one it hits."
159. "Model a terminal's firmware version as a comparable value type so I can ask 'is this terminal's version at least 2.3.1' without string-comparing versions incorrectly."
160. "Build a lightweight audit wrapper around a repository's Save method that automatically records who changed what and when, without every caller having to remember to do it."
161. "I want a way to represent money (amount + currency) as its own type so we stop accidentally adding MYR and USD together as if they were the same number."
162. "Give me something that batches up individual notification requests over a short time window and sends them as one combined message instead of spamming one at a time."
163. "Write a class that can deserialize a settlement report file even if some optional fields are missing, filling in sensible defaults instead of throwing."
164. "Model a many-to-many relationship between users and stores in memory (a user can access several stores, a store can have several users) and give me a fast lookup both directions."
165. "Build a simple rules engine where each rule is a small reusable unit ('if void ratio > X flag it', 'if dormant > 60 days flag it') that can be combined and run against a dealer."
166. "I want a decorator around an existing repository that adds logging around every call without modifying the original repository class."
167. "Write something that safely converts user-entered text into a decimal amount, handling different locale formats (comma vs period as decimal separator) gracefully."
168. "Give me a way to represent a date range (effective start/end) as a reusable type, with a method to check if it overlaps another range — I need this in at least three different places in the codebase."
169. "Build a small in-memory queue that processes reload requests one at a time in the order they arrived, even if they're submitted concurrently from multiple threads."
170. "Model the difference between a 'soft delete' and a real delete for a Store entity, so deactivated stores don't show up in normal queries but the data isn't actually gone."
171. "I want a class that can snapshot an object's state before an edit and roll it back if the save fails partway through."
172. "Write something that takes raw terminal heartbeat pings and determines which terminals have gone silent for longer than expected, without polling constantly."
173. "Build a simple templating helper that fills placeholders like {DealerName} and {Amount} into a notification message string safely, even if a placeholder is missing from the data."
174. "Give me a class hierarchy for different void reasons (customer request, system error, fraud suspicion) where each reason has different downstream handling, but the calling code just calls one method."
175. "Write a way to deduplicate a batch of incoming transactions that might have been submitted twice due to a retry, based on a business key rather than the generated Id."
176. "Model a commission approval workflow with states (Draft, PendingApproval, Approved, Rejected) where only specific role types can move it between specific states."
177. "Build something that converts between a flat CSV row and a strongly-typed DealerImportRow object, validating each column as it goes and collecting row-level errors."
178. "I want a way to compare a terminal's actual transaction pattern against its expected pattern and flag statistically unusual days, reusable for any terminal."
179. "Write a small object pool for something expensive to create (like a report generator) so we reuse instances instead of constructing a new one per request."
180. "Give me a class that can represent partial payment/refund amounts against an original transaction and always know the remaining balance, resistant to floating-point rounding errors."

---

## Tier 5 — Wizard (Q181–Q200)
Multi-part, ambiguous, senior-engineer voice. Requires you to state
assumptions and design tradeoffs before any code is right.

181. "Our terminal status logic has turned into a maze of nested if statements across three files. Before you touch the code, tell me how you'd redesign it so a new status rule doesn't require editing five places — then show me the shape of the classes."
182. "We keep getting bugs from race conditions in the reload processing pipeline under load, but nobody can reproduce them locally. Walk me through how you'd design the concurrency model differently, and what C#/.NET tools you'd actually reach for."
183. "A junior dev wants to add a fourth payment provider by copy-pasting the InComm integration class and tweaking it. Talk me out of it (or don't) and show the alternative structure."
184. "Our commission calculation has silently drifted between what Finance expects and what the code produces, and nobody trusts it anymore. How would you restructure the calculation code so it's independently testable and the logic is obvious to a non-programmer reading it?"
185. "We need to support offline terminals that queue transactions locally and sync later, without duplicating or losing any of them when connectivity returns. Design the approach, not just the sync method."
186. "Management wants 'real-time' dealer risk scoring but our current design recalculates everything from scratch on every request, and it's getting slow. How would you redesign this for incremental updates instead?"
187. "This class has ballooned to 2,000 lines and does validation, persistence, notification, and reporting all in one place. Tell me how you'd split responsibilities and what the resulting class list would look like."
188. "We're about to let external partners call into part of our system via an API. Design the boundary — what's exposed, what's hidden, how errors are translated into partner-safe messages, without me needing to explain HTTP specifics."
189. "A refactor introduced a subtle bug where two threads processing the same dealer's EOD can interleave and corrupt the total. Without seeing the exact code, what pattern of mistake would you look for first, and how would you redesign to make that class of bug structurally impossible?"
190. "We want to A/B test two different commission algorithms live without duplicating the calling code everywhere it's used. Design the seam that makes that swap trivial."
191. "Our unit tests for the transaction processor are basically untestable without a live database. How would you restructure the class so business logic can be tested without any I/O at all?"
192. "The codebase has five different ad-hoc ways of representing 'money'. Convince me why that's a problem and show the shape of the fix."
193. "We need an audit trail on every sensitive entity (Dealer, CommissionRate, BankAccount) but don't want every developer to remember to write logging code by hand each time. Design the mechanism that makes it automatic."
194. "A batch job processes 2 million transactions nightly and it's started timing out. Before reaching for 'just add more threads', walk me through how you'd diagnose whether this is a design problem or a genuine scale problem."
195. "We want new terminal firmware rules pluggable without redeploying the whole app. Design the extension point."
196. "Our exception handling is inconsistent — some methods swallow errors silently, some crash the whole batch. Propose a consistent error-handling strategy for the whole reload pipeline and justify it."
197. "A merchant integration partner keeps sending malformed XML/JSON about 2% of the time. Design a class boundary that isolates that mess from the rest of the clean domain model."
198. "We're planning to eventually port critical business logic to another language/platform. What would you do differently in how you write the domain classes today to make that migration less painful later?"
199. "Two senior devs disagree: one wants inheritance-heavy payment provider classes, the other wants composition with strategy objects. Referee this with the actual tradeoffs for OUR codebase, not textbook generalities."
200. "If you had to onboard a new hire onto this codebase's business-logic layer in one hour, what's the one structural thing you'd want to already be true about the code to make that possible?"

---

## Tier 6 — Master (Q201–Q250)
Real-world, multi-class system design problems. Complexity escalates
toward Q250; several require you to design a small subsystem, not just
write one class.

201. "Design and sketch (classes, interfaces, key methods — not full implementation) a reconciliation subsystem that compares in-memory-staged transactions against a settlement feed and reports mismatches, handling the case where the settlement feed arrives out of order and sometimes duplicated."
202. "Build the shape of a plugin architecture so new bill-payment billers can be added by dropping in a new assembly implementing a known interface, without modifying the core processing loop at all — including how you'd discover and load those plugins at startup (e.g., `MEF`/reflection over assemblies)."
203. "Design a domain model for 'commission packages with overlapping effective date ranges' that makes it structurally impossible to end up with two conflicting active rates for the same dealer at the same instant, and explain how you'd enforce that at construction time, not just with validation after the fact."
204. "We need an in-process event bus so that a transaction being voided can trigger notification, reporting, and terminal-state updates without those modules referencing each other directly. Design it, including how you'd prevent one slow subscriber from blocking the others."
205. "Model a full terminal lifecycle state machine (provisioned -> active -> suspended -> retired, with a couple of exceptional paths like 'lost/stolen') as actual types, not a status enum plus scattered if statements, and show how an illegal transition becomes a compile-time or construction-time impossibility."
206. "Design a batch-processing framework generic enough to run any of our nightly jobs (EOD, settlement reconciliation, dormant-terminal detection) with shared retry, logging, and partial-failure handling, without each job reimplementing that plumbing."
207. "Build the outline of a rules engine where business users could (eventually) define fraud-detection rules in a simple DSL/config, and your C# code interprets and evaluates them against a transaction, without a full rules-engine framework dependency."
208. "Design a caching layer for dealer/store/terminal master data that's shared across many services, stays reasonably fresh (invalidates on change), and is safe under heavy concurrent read/occasional write."
209. "We're migrating from synchronous, blocking provider calls (TNG, InComm, bill payment) to async ones, one provider at a time, without breaking the ones not yet migrated. Design the transitional architecture."
210. "Build a generic import pipeline (CSV/Excel -> validated domain objects -> persistence) reusable across dealer bulk upload, store bulk upload, and product bulk upload, with per-row error collection and a final report."
211. "Design an approval-workflow engine (not hardcoded to commission approval) that could later support store approval, dealer onboarding approval, etc., driven by configurable states and allowed transitions per entity type."
212. "Model money and multi-currency commission calculations so that a bug can never silently add MYR and USD together, INCLUDING what the compiler should stop you from doing, not just runtime checks."
213. "Design a subsystem that ingests raw terminal heartbeat pings at high volume, keeps only the state needed to detect 'gone silent' terminals, and doesn't grow memory unbounded over a long-running process."
214. "Build the structure for a feature-flag system so specific dealer groups can be opted into new commission logic before a full rollout, without duplicating the calculation code per flag."
215. "Design a retry-with-idempotency system for outbound provider calls (TNG, InComm) so that a network timeout followed by an automatic retry can never result in a double-charge, even if the original request actually succeeded on the provider's side."
216. "Model a full audit-trail subsystem that can answer 'show me every change to this dealer's commission rate, by whom, and revert to any prior version' — design the storage shape and the API, not the UI."
217. "We want to support both real-time and batch settlement reconciliation using the SAME comparison logic underneath, just different triggers and I/O. Design the shared core and the two thin wrappers around it."
218. "Design a class structure for representing partial refunds/voids against an original transaction that can be summed, always knows the remaining refundable balance, and rejects any sequence of operations that would over-refund — including concurrent refund attempts on the same transaction."
219. "Build the outline of a 'dead letter' subsystem for transactions that fail processing repeatedly, so they're set aside for manual review instead of blocking the batch or silently disappearing, with enough context captured to actually diagnose them later."
220. "Design a strongly-typed configuration system (replacing loose string key/value CONFIGURATION rows) that validates values at startup, fails fast on misconfiguration, and still allows runtime overrides for specific dealer groups."
221. "Model a versioned API contract for an external partner integration, where you need to support both v1 and v2 request/response shapes simultaneously during a migration window, sharing as much internal logic as possible."
222. "Design a small saga/orchestration pattern for a multi-step reload transaction (reserve funds -> call provider -> confirm -> settle) where any step can fail and needs a defined compensating action, without a full distributed-transaction framework."
223. "Build a generic 'diff and merge' utility for comparing two versions of any domain entity (Dealer, Store, Terminal) using reflection, producing a field-level change list usable for both audit logging and conflict resolution."
224. "Design a rate-limiting mechanism per terminal/per dealer for inbound transaction requests, so a misbehaving integration can't overwhelm the processing pipeline, while legitimate bursts still go through."
225. "Model a multi-tenant-aware repository layer (dealer-scoped data access) so that a bug can never accidentally leak one dealer's data into another dealer's query results, ideally enforced structurally rather than by convention."
226. "Design the shape of a background worker pool (`Channel<T>`/`BackgroundService`-style) that processes queued reload transactions with configurable concurrency, graceful shutdown (finish in-flight work, don't accept new), and backpressure when the queue grows too large."
227. "Build a strongly-typed builder/validator for constructing complex settlement report objects from multiple partial data sources (provider data + CEPP master data + commission data), failing clearly if a required piece never arrives."
228. "Design a subsystem to detect and quarantine 'poison' transaction records that repeatedly crash the processor (e.g., malformed data), including how it avoids crash-looping the whole batch job."
229. "Model an entity-versioning scheme (like an event-sourced dealer commission history) where you can ask 'what was dealer X's effective rate on date Y' at any point in the past, purely by replaying stored changes."
230. "Design a pluggable notification-channel system (email, SMS, push) where new channels can be added without touching the code that decides WHAT to notify, only the code that decides HOW to deliver it."
231. "Build the architecture for safely running a schema-changing data migration against live production-like data with zero downtime, including how your application code would need to tolerate both old and new shapes during the transition."
232. "Design a generic 'business rule violation' exception hierarchy expressive enough that a UI layer can show a specific, helpful message per violation type without a giant string-matching switch statement."
233. "Model a terminal-to-store reassignment workflow that must be atomic from the caller's perspective (either the whole reassignment succeeds — old store updated, new store updated, audit logged — or none of it does), without a real database transaction spanning multiple services."
234. "Design a testing seam for time-dependent business logic (like 'commission expires in 30 days') so tests don't have to actually wait or fake the system clock unsafely (e.g., an injectable `IClock` abstraction)."
235. "Build the outline of a merchant-facing self-service API layer that wraps the internal domain model, deliberately hiding internal fields/concepts that shouldn't be exposed externally, while staying in sync as the internal model evolves."
236. "Design a subsystem for detecting duplicate dealer/store registrations (fuzzy matching on name/address/contact) that runs as a background check rather than blocking registration, and routes suspected duplicates to a review queue."
237. "Model a composite validation result type expressive enough to represent nested validation (a DealerImportRow containing invalid StoreImportRows) with clear paths to each specific error."
238. "Design the shape of a metrics/telemetry layer baked into the transaction pipeline (timing, success/failure counts, per-provider breakdowns) without scattering counter-increment calls all through business logic."
239. "Build an outline for supporting scheduled, delayed commission-rate changes (e.g., 'apply this new rate starting next Monday') that doesn't require a background job to constantly poll for 'is it time yet' — design the mechanism."
240. "Design a class structure that lets a single transaction be processed differently based on dealer-specific rule overrides layered on top of dealer-group defaults layered on top of system defaults, resolved cleanly at read time."
241. "Model a safe bulk-update operation (e.g., mass-updating commission rates for an entire dealer group) that can be previewed (dry run, showing exactly what would change) before being committed for real, sharing the same underlying logic for both modes."
242. "Design a resilience strategy for a chain of dependent provider calls (TNG depends on a token service which depends on a config service) so a failure in the token service degrades gracefully instead of cascading into total transaction failure."
243. "Build the shape of an internal DSL (fluent builder) for constructing complex test data (a Dealer with N Stores each with N Terminals with realistic transaction histories) so tests stay readable as scenarios get complex."
244. "Design a subsystem that can replay a day's worth of historical transactions through an updated commission calculation to verify the new logic produces the expected results before it goes live — without touching production data."
245. "Model a permission/authorization layer where a user's effective access to a store depends on their role, their dealer assignment, AND any store-specific overrides, resolved efficiently for a user who might have access to thousands of stores."
246. "Design a graceful-degradation strategy for the whole reload pipeline when a downstream provider is down — should transactions queue, fail fast, or fall back to an alternate provider, and how would the code decide which one, per situation?"
247. "Build the outline of a change-data-capture-style mechanism so that changes to CEPP master data (a dealer's commission package changing) automatically and reliably propagate to dependent caches/read-models without manual cache-busting scattered everywhere."
248. "Design a 'shadow mode' execution path where a new version of the commission calculator runs alongside the old one on live traffic, logging differences without affecting real output, so you can validate it safely before cutover."
249. "Put together, as a set of collaborating classes (not one god class), a full 'dealer onboarding' orchestration — validation, company/bank verification, initial store/terminal provisioning, and welcome notification — where any step can fail independently and the whole process can be resumed from where it left off rather than restarted from scratch."
250. "You have one hour to make one structural change to this C# codebase that would prevent the most future bugs, based on everything covered in this question set — what is it, why that one over all the others, and what does the resulting class shape actually look like?"
