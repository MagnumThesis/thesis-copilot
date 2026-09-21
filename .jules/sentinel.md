## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-09-21 - Incomplete SSRF Protection in URL Validator
**Vulnerability:** The `validateAndSanitizeUrl` function used string `.startsWith()` methods to block local/private IP ranges. This was too broad (blocking `169.254.com`), yet completely missed critical SSRF vectors including `0.0.0.0`, IPv6 loopback (`[::1]`), IPv6 private ranges, and IPv4-mapped IPv6 (`[::ffff:127.0.0.1]`).
**Learning:** Using basic string prefix matching on `urlObj.hostname` is a common pitfall. The native `URL` object doesn't convert all loopback/private representations into standard strings (like `127.0.0.1`). Malicious actors can use IPv6 representations or `0.0.0.0` to bypass naive IPv4 filters and query internal infrastructure or cloud metadata services.
**Prevention:** Always use precise IP-matching regular expressions (or dedicated IP parsing libraries) to comprehensively block both IPv4 and IPv6 loopback/private/metadata representations when protecting against SSRF. Avoid naive string matching.
