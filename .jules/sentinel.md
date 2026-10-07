## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-10-07 - DNS-based SSRF via URL Validation
**Vulnerability:** Naive SSRF validation using `hostname.startsWith('127.')` in `validateAndSanitizeUrl` blocked legitimate domains (e.g. `127.com`) and failed to catch wildcard DNS SSRF variants (e.g. `127.0.0.1.nip.io`) or IPv6 loops.
**Learning:** Node's URL object resolves integer/hex IPs (e.g. `2130706433` -> `127.0.0.1`) but doesn't resolve DNS (like `127.0.0.1.nip.io`). To block SSRF, explicit regex boundary matching is required on the parsed hostname, alongside IPv6 checks.
**Prevention:** Always use precise IP boundary regexes (`/(^|\.)(127\.\d+...)/`) and include IPv6 and localhost checks when performing SSRF mitigation without a dedicated IP parsing library.
