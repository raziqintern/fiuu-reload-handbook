# Configuration & Secrets

Mechanisms only — no literal config values, connection strings, keys, or
secrets are reproduced below, per handbook policy.

There isn't one configuration story here — at least four distinct mechanisms
coexist, layered on top of each other depending on module and how old the
code is.

## 1. Classic `System.Configuration` / `app.config`/`web.config` `<appSettings>`

The oldest and most universal mechanism. Every module reads simple
non-secret settings via `ConfigurationManager.AppSettings["Key"]`, resolved
at runtime from whatever host application's config file is loaded (the
`class-library` projects' own `app.config` files carry only assembly-binding
redirects — no `<appSettings>` block — so the actual key/value pairs live in
the consuming EXE/web app's config, not in this library):

```csharp
// reload/class-library/Reloads/Game/Helpers/LogHelper.cs:20
DirFileLogs = ConfigurationManager.AppSettings["dirFileLogs"] ?? string.Empty;
```

```csharp
// reload/class-library/AWSCore/Services/ServiceBase.cs:38-40
else
{
    return ConfigurationManager.AppSettings[sConfigKey] ?? string.Empty;
}
```

## 2. A database-backed config table (`CONFIGURATION` DB / `ConfigDetails`)

Business/environment configuration (as opposed to log paths and app names)
is pulled from a `CONFIGURATION` database via a stored procedure keyed by a
config-group name, mapped into a generic `KeyName`/`KeyValue` model:

```csharp
// reload/class-library/AWSCore/Providers/ConfigurationProvider.cs:13-26
internal List<ConfigDetails> GetConfigDetails(string sConfigName)
{
    ...
    result = SqlAccessor.ExecuteProcedure(dbConnstringAlias: "CONFIGURATION",
        procName: "CONFIGURATION.dbo.ConfigDetails_Sel_ByConfigName", param);
    ...
}
```

```csharp
// reload/class-library/AWSCore/Models/ConfigDetails.cs
public class ConfigDetails
{
    public int ConfigId { get; set; }
    public string KeyName { get; set; }
    public string KeyValue { get; set; }
}
```

The same `ConfigDetails`-shaped model/table pattern also exists independently
under `Database/Models/RMS_OFFLINE/ConfigDetailModel.cs` — another instance
of the same idea reimplemented per module rather than shared.

## 3. AWS Secrets Manager, gated by an `EventAppName`/partner switch, cached in-process

Actual credentials (partner usernames/passwords/API keys for each downstream
integration) are fetched from AWS Secrets Manager, not from `appSettings` or
the `CONFIGURATION` DB. The set of secret *labels* expected for the current
host process is decided by a big switch on `EventAppName` (effectively "which
partner/app am I"):

```csharp
// reload/class-library/AWSCore/Helpers/SecretsHelper.cs:38-53 (labels only, no values)
private void SecretLabelMapper()
{
    string sEventAppName = GetAppSetting("EventAppName");
    switch (sEventAppName)
    {
        case AppUserNames.AnyPay:
            SecretsDictionary.Add(SecretsLabels.AnyPay.LoginId, string.Empty);
            SecretsDictionary.Add(SecretsLabels.AnyPay.Password, string.Empty);
            SecretsDictionary.Add(SecretsLabels.AnyPay.ApiKey, string.Empty);
            break;
        ...
```

`SecretsHelper` is a lazy singleton (`Lazy<SecretsHelper>`) that, on first
use, resolves every label in that dictionary to its real value via
`SecretsManagerService.GetSecret(label)`:

```csharp
// reload/class-library/AWSCore/Helpers/SecretsHelper.cs:24-36
private SecretsHelper()
{
    SecretsDictionary = new Dictionary<string, string>();
    SecretLabelMapper();
    foreach (string sSecretLabel in SecretsDictionary.Keys.ToList())
    {
        SecretsDictionary[sSecretLabel] = _secretsManagerService.GetSecret(sSecretLabel) ?? string.Empty;
    }
}
```

`SecretsManagerService` itself resolves which AWS Secrets Manager secret
*bundle* to fetch (by name pattern — e.g. whether the current app is a "Bill"
or "Backoffice" host) and caches the raw secret JSON blob in-process via a
shared `CacheHelper<T>`, so repeated `GetSecret(label)` calls after the first
don't re-hit AWS:

```csharp
// reload/class-library/AWSCore/Services/SecretsManagerService.cs:56-63
string sCacheKey = AWS + "#SecretManager#" + SecretName;
var cachedResponse = CacheHelper.Get(sCacheKey);
...
IAmazonSecretsManager _client = new AmazonSecretsManagerClient(_accessKeyId, _secretKey, RegionEndpoint.GetBySystemName(_region));
```

Note the AWS access key/secret used to *authenticate to* Secrets Manager are
themselves pulled from the `CONFIGURATION` DB (mechanism #2 above), not from
`appSettings` or an environment variable — so mechanism 2 bootstraps
mechanism 3.

## 4. Plain-text connection-string files on the local disk

`Fiuu.Database`'s connection strings are not read from a config file's
`<connectionStrings>` section at all. They're read from a flat text file
named after the database alias, searched for across a fixed, hardcoded list
of local directories:

```csharp
// reload/class-library/Database/Helpers/DBConnectionHelper.cs:12-15
private static string[] CONNECTION_DIRECTORIES = new string[] {
        "d:\\db",
        "c:\\db"
    };
```

```csharp
// reload/class-library/Database/Helpers/DBConnectionHelper.cs:18-26
public static string GetRMSOFFLINEConnectionString()
{
    if (!string.IsNullOrEmpty(_connectionString)) return _connectionString;
    string fullPath = FindConnectionFileByAlias("RMS_Offline");
    _connectionString = ReadFileContents(fullPath);
    return _connectionString;
}
```

The file is looked up as `{directory}\{alias}.txt` (e.g. `d:\db\RMS_Offline.txt`,
`d:\db\LOGGING.txt`), read as raw ASCII text, trimmed, and cached in a static
field for the process lifetime. This is a materially different — and more
fragile — mechanism than the rest of the codebase's config story: it assumes
a specific drive letter/folder exists on whatever machine the app runs on,
stores the connection string (which may itself embed a SQL login/password) in
an unencrypted flat file on local disk, and has no fallback if the file is
missing beyond throwing `FileNotFoundException`.

## Migration in progress: `.NET Framework` config vs. `.NET 8` `appsettings.json`

`ServiceBase.GetAppSetting` branches on the running CLR's major version to
decide whether to read `ConfigurationManager.AppSettings` (.NET Framework) or
parse `appsettings.json` directly (.NET 8+), rather than going through a
`Microsoft.Extensions.Configuration` abstraction that would hide the
difference:

```csharp
// reload/class-library/AWSCore/Services/ServiceBase.cs:25-41
public static string GetAppSetting(string sConfigKey)
{
    if (Environment.Version.Major >= 8)
    {
        //TO CATER FOR .NET VERSION 8 ONLY
        string sAppSettingsFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "appsettings.json");
        string json = File.ReadAllText(sAppSettingsFilePath);
        JObject jObject = JObject.Parse(json);
        return jObject[sConfigKey]?.ToString() ?? string.Empty;
    }
    else
    {
        return ConfigurationManager.AppSettings[sConfigKey] ?? string.Empty;
    }
}
```

This is a clear signal the codebase is being ported off classic .NET
Framework toward modern .NET incrementally, module by module, with runtime
version-sniffing used as a stopgap rather than a configuration abstraction
layer. See `known-patterns-and-pitfalls.md`.
