## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## $(date +%Y-%m-%d) - Fix permissive CORS configuration
**Vulnerability:** The dynamic CORS origin resolver incorrectly fell back to returning `*` for missing origins and an arbitrary allowed origin for unauthorized ones, potentially allowing credentials leakage if misconfigured.
**Learning:** Returning a string from a dynamic CORS resolver does not fail closed; the framework will use that string as the `Access-Control-Allow-Origin` header. Returning an unauthorized origin or `*` defeats the purpose of an allowlist when `credentials: true` is set.
**Prevention:** Always explicitly return `null` for disallowed origins in Hono's dynamic CORS origin resolver to omit the response header and deny cross-origin access correctly.
