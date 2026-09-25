## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-09-25 - Incomplete SSRF Protection in URL Validation
**Vulnerability:** The `validateAndSanitizeUrl` function missed checks for `0.0.0.0`, cloud metadata IPs (`169.254.x.x`), and IPv6 loopback variants (e.g., `[::1]`, `[::ffff:127.0.0.1]`), and overly broad string matching (like `.startsWith('169.254.')` or `.startsWith('10.')`) would wrongly block legitimate domains (e.g., `10.com` or `169.254.com`). This enabled SSRF attacks against internal services while also causing false positives.
**Learning:** Standard IPv4 checks (`localhost`, `127.x`) are insufficient for SSRF protection because URL canonicalization does not automatically map alternate encodings or IPv6 loops to IPv4 loops. Furthermore, `.startsWith` is unsafe for hostname validation; precise regex boundaries are required.
**Prevention:** Always block `0.0.0.0`, cloud metadata IP ranges, and all IPv6 local/loopback variants explicitly when implementing application-level SSRF filters, and always use strictly bounded regular expressions (e.g., `/^169\.254\.\d+\.\d+$/`) instead of string prefix matching.
