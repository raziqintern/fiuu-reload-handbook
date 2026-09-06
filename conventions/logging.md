---
tags: [conventions]
---

# Logging

## No single logging mechanism — two underlying frameworks, three-plus hand-rolled wrappers

There are two shared logging primitives that appear to come from Fiuu's
internal framework libraries (compiled dependencies, `Fiuu.Logging.dll` and
part of `Fiuu.MasterFramework.dll` — no source in this repo):

- `Fiuu.MasterFramework.Utilities.Logger` — a rolling file logger
  (`new Logger(path, Encoding.UTF8, maxLines, maxFiles, bool)`) plus a static
  `Logger.WriteErrorToEventLogs(ex, ...)` that writes to the Windows Event Log.
- `Fiuu.Logging.LogManager` / `Fiuu.Logging.Models.Log` — a structured logger
  taking a `Log` object with `LogLevel`, `EventName`, `ReferenceId`,
  `ExceptionInfo`, `Detail`, `RemoteIp`, `Source`.

Instead of one shared façade, at least three modules each define their own
static `LogHelper` class wrapping these primitives differently:

```csharp
// reload/class-library/Reloads/TNG/Helpers/LogHelper.cs:15-20
private readonly static Logger _logger = new Logger(
    string.Format(ConfigurationManager.AppSettings["TNGAPILogFileName"], DateTime.Now.ToString("yyyyMMdd")),
    Encoding.UTF8, 1000, 30, true);
```

```csharp
// reload/class-library/AWSCore/Helpers/LogHelper.cs:20-41
static LogHelper()
{
    EventAppName = GetAppSetting("EventAppName");
    // ...reflects over AppUserNames constants to find a friendly app name for the log file...
    string sLogFilePath = GetAvailableFileName(string.Format("{0}_{1}", sAppName, DateTime.Now.ToString("yyyyMMdd")));
    _logger = new Logger(sLogFilePath, Encoding.UTF8, 1000, 30, true);
}
```

```csharp
// reload/class-library/Reloads/Game/Helpers/LogHelper.cs:12-23
private static ConcurrentDictionary<string, Logger> LoggerDic;
...
static LogHelper()
{
    DirFileLogs = ConfigurationManager.AppSettings["dirFileLogs"] ?? string.Empty;
    LoggerDic = new ConcurrentDictionary<string, Logger>();
    MultipleCountry = DirFileLogs.Contains("{0}");   // one log file per country code, keyed dynamically
}
```

Each of these three `LogHelper`s has a different method surface
(`Write`/`Error`/`Trace`/`Warn` in TNG's; just `Write` in AWSCore's;
`Write`/`Error` with an operation+referenceId overload in Game's), so code
that logs in one module cannot be lifted into another without adapting calls.
See `known-patterns-and-pitfalls.md`.

## Common call-pattern: bracketed `[Key: ref] >>>` / `<<<` request/response logging

Independent of which `LogHelper` a module uses, outbound HTTP/API calls are
logged with a recurring `>>>` (outgoing) / `<<<` (incoming) bracket
convention, tagged with a correlation key:

```csharp
// reload/class-library/Secure/Astro/Providers/RpnProvider.cs:93-97
LogHelper.Write(string.Format("[{0}] >>> [Key: {1}] {2}", config.AmdocsPaymentUrl, billPayment.BankClientRefId, request.ToJson()));
string response = HttpHelper.HttpPost(config.AmdocsPaymentUrl, request.ToJson(), MIMEType.TEXT_JSON, config.HttpRequestTimeout);
LogHelper.Write(string.Format("[{0}] <<< [Key: {1}] {2}", config.AmdocsPaymentUrl, billPayment.BankClientRefId, response));
```

```csharp
// reload/class-library/AWSCore/Services/SecretsManagerService.cs:73-80
LogHelper.Write(string.Format("[{0}] >>> [Key: {1}] {2}", "GetSecret", sUniqueKey, request.ToJson()));
GetSecretValueResponse response = _client.GetSecretValue(request);
...
LogHelper.Write(string.Format("[{0}] <<< [Key: {1}] {2}", "GetSecret", sUniqueKey, "Secrets received successfully."));
```

This is genuinely a house convention — it recurs across unrelated modules
(Astro, AWSCore) written presumably by different people, and it's the closest
thing to a de facto logging standard in the codebase: full request/response
bodies get logged (as JSON via a shared `.ToJson()` extension), correlated by
a key that's usually the business reference id or a generated timestamp
string.

## Errors are logged twice in some paths: file log + event log

```csharp
// reload/class-library/Reloads/Game/Helpers/LogHelper.cs:85-93
public static void Error(string sOperation, string sReferenceId, string sMessage, Exception ex)
{
    string sFormatted = Format(sOperation, sReferenceId, sMessage);
    Write(sFormatted + (ex != null ? " [System Error: " + ex.Message + "]" : string.Empty));  // file log
    Logger.WriteErrorToEventLogs(ex, null, null, sFormatted);                                  // Windows Event Log
}
```

## What gets logged

- Full outbound request/response payloads (serialized via `.ToJson()`),
  including for payment/account-verification calls
  (`Secure/Astro/Providers/RpnProvider.cs`) — be mindful these payloads can
  carry account numbers and amounts; nothing in the sampled code redacts
  fields before logging.
- Exceptions, generally with a `customMessage` describing which operation
  failed and the serialized input that caused it
  (`Logger.WriteErrorToEventLogs(ex, customMessage: ...)`), so the log is the
  primary (often only) place the failure detail survives — see
  `error-handling.md`.
- Row-count/no-op conditions as informational writes rather than errors, e.g.
  `LogHelper.Write("UpdateGameSalesTransactionStatus", sReferenceId,
  "GameSalesTransactions_Upd matched no row.")`
  (`Reloads/Game/Providers/GameProvider.cs:64`).

## Logging is defensively isolated from the transaction it's logging

```csharp
// reload/class-library/Reloads/Game/Helpers/LogHelper.cs:25-71
public static void Write(string sMessage, string sCountryCode = "General")
{
    try
    {
        ...
    }
    catch
    {
        // Logging must never take down a transaction.
    }
}
```

This try/swallow-everything wrapper around the logging call itself is
deliberate and commented — it's the one place in the sampled code where a
blanket empty catch is clearly intentional rather than incidental.

## Related

- [[conventions/known-patterns-and-pitfalls]] — the per-module `LogHelper` reinvention pattern (§1)
- [[conventions/error-handling]] — how the exception detail these logs carry is (or isn't) surfaced to callers
- [[architecture/reload/class-library/logging]] — the `Fiuu.Logging` component these `LogHelper` wrappers sit on top of
