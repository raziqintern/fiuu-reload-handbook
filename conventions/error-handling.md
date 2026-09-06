---
tags: [conventions]
---

# Error Handling

## Dominant pattern: catch-all, log, return a sentinel/error-code — don't rethrow

The most common shape at the Provider and Service layer is: wrap the whole
method body in `try { ... } catch (Exception ex) { log; return <safe default
or error-code DTO>; }`. The exception's information lives only in the log; the
caller sees a `false`, `-1`, `null`, or a response object with an error
response code — never the exception itself.

```csharp
// reload/class-library/Reloads/Game/Providers/GameProvider.cs:15-46
public long AddGameSalesTransaction(GameSalesTransaction gameSalesTransaction)
{
    long iId = -1;
    ...
    try
    {
        ...
        iId = result.GetParameterValue<Int64>("@Id");
    }
    catch (Exception ex)
    {
        LogHelper.Error("AddGameSalesTransaction", gameSalesTransaction != null ? gameSalesTransaction.ReferenceId : null, "Unhandled exception.", ex);
    }
    return iId;   // caller cannot tell "-1 because of an exception" from "-1 because that's a real id"
}
```

```csharp
// reload/class-library/Secure/Astro/Services/BillPaymentService.cs:78-83
catch (Exception ex)
{
    Logger.WriteErrorToEventLogs(ex, customMessage: string.Format("Payment: {0}", billPaymentRequest.ToJson()));
    return new BillPaymentResponse { ResponseCode = ResponseCode.MOL_SYSTEM_ERROR };
}
```

This pattern is consistent across TNG, Game, Astro, and InComm — it's the de
facto house style even though nobody wrote it down.

## Narrower pattern: catch a specific SQL error, translate to a status, rethrow otherwise

Where duplicate-key detection matters for correctness (idempotency checks on
retryable network calls), the code catches `SqlException`, checks the error
number against known SQL Server constraint-violation codes, and only swallows
that specific case — everything else is rethrown:

```csharp
// reload/class-library/Reloads/TNG/Providers/TerminalProvider.cs:109-124
try
{
    result = SqlAccessor.ExecuteProcedure(...);
    auth.Id = result.GetParameterValue<long>("@Id");
}
catch (Exception ex)
{
    if (ex is SqlException sqlEx && (sqlEx.Number == 2627 || sqlEx.Number == 2601))
    {
        auth.TransStatus = TransStatus.DuplicateTransNo;
        auth.ResponseMessage = "Trans No has been used.";
        return false;
    }
    throw;
}
```

The magic numbers 2601/2627 are also captured as a named enum elsewhere
(`Reloads/TNG/Enums/SqlExceptionNumber.cs`: `ViolationOfUniqueKeyConstraint =
2601`, `ViolationOfUniqueIndexConstraint = 2627`), but `TerminalProvider`
doesn't use that enum — it re-inlines the raw numbers. Two ways of expressing
the same check coexist in the same module.

## Custom exception types exist, but are thin and rarely propagated

```csharp
// reload/class-library/Reloads/TNG/Exceptions/MissingMerchantSecretKeyException.cs:5-11
public class MissingMerchantSecretKeyException : Exception
{
    public MissingMerchantSecretKeyException(string sMerchantLabel)
        : base($"Merchant secret key not found at AWS Secret Manager for label: {sMerchantLabel}")
    {
    }
}
```

```csharp
// reload/class-library/Secure/Incomm/CustomException/APIRequestException.cs:8-16
public class APIRequestException : ApplicationException
{
    public int RequestStatus { set; get; }
    public APIRequestException(int status)
    {
        RequestStatus = status;
    }
}
```

`APIRequestException` is actually used — `FastPinSaleService` special-cases it
in its catch block to preserve a request-status code
(`Secure/Incomm/Services/FastPinSaleService.cs:49-54`). That's the exception
being used the way an exception should be: to carry structured failure
information back up through a catch. It's the exception here (pun intended)
rather than the rule.

## A broken custom exception in production code

`TNGEODException` is worth flagging directly since it demonstrates what
"nobody reviews exception types closely" looks like in practice:

```csharp
// reload/class-library/Reloads/TNG/Exceptions/TNGEODException.cs:14-33
public TNGEODException()
{
    new TNGEODException(terminalId, businessDate, messageNo);   // constructs and discards a second instance; does nothing to `this`
}

public TNGEODException(int terminalId, DateTime businessDate, string messageNo)
{
    this.terminalId = terminalId;
    this.businessDate = businessDate;
    this.messageNo = messageNo;
}

public override string Message
{
    get { return base.Message; }   // overrides Message but doesn't do anything with terminalId/businessDate/messageNo
}
```

The parameterless constructor's body is a no-op bug (`new
TNGEODException(...)` builds and throws away an unused object instead of
chaining to `this(...)`), and the `Message` override exists but adds no value
over the base implementation — the three private fields it stores are never
surfaced anywhere. See `known-patterns-and-pitfalls.md`.

## Surfacing to callers: response codes, not HTTP status / structured faults

Because `web_api` has no source in this checkout, how exceptions become HTTP
responses could not be traced end-to-end. What's visible from `class-library`
is that Services return domain response DTOs carrying an enum response code
(`ResponseCode.MOL_SYSTEM_ERROR`, `ResponseCode.MOL_TIME_OUT`,
`RequestStatus.MOLServiceError`) rather than throwing out of the Service layer
— the presumed intent is that these get serialized straight into the API
response body, with the exception detail staying server-side in the log only.

## Logging inside error handling never itself throws

The one defensive pattern that recurs deliberately: logging code is wrapped so
a logging failure can never mask or replace the real error:

```csharp
// reload/class-library/Reloads/Game/Helpers/LogHelper.cs:66-71
LoggerDic[sKey].Log(sLogMessage);
...
catch
{
    // Logging must never take down a transaction.
}
```

## Summary

| Situation | Pattern |
|---|---|
| Generic unexpected failure | catch `Exception`, log, return sentinel/error-code — swallow |
| Known SQL constraint violation | catch, check `SqlException.Number`, translate to business status, rethrow everything else |
| Cross-boundary failure needing a code | occasionally a custom `Exception` subclass, caught and translated one layer up |
| Logging itself failing | always swallowed silently, no rethrow, no fallback logger |

## Related

- [[conventions/known-patterns-and-pitfalls]] — the broken `TNGEODException` (§3) and swallowed-error (§2) patterns cited above
- [[conventions/logging]] — where the exception detail actually ends up when it's swallowed
- [[gitlab-analysis/reload-mr-review-checklist]] — the "don't log-and-rethrow" review rule (§A3) that pushes back on this pattern
