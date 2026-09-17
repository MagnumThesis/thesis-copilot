## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-09-17 - Inadequate SSRF Protections with String `startsWith`
**Vulnerability:** URL string sanitization used naive `startsWith('127.')` checks which both allowed bypassed equivalent formats (like `0.0.0.0`, `[::1]`) and blocked valid domains containing IP digits (like `169.254.com` or `127.com`).
**Learning:** Native `URL` parsing does not catch non-standard private IPs. SSRF string matching must enforce boundaries. Naive string matching blocks legitimate domains and creates SSRF bypasses.
**Prevention:** Use strictly-bounded RegEx matching mapped against a known bad list including IPv6 representations. Do not rely on loose `startsWith` methods for hostname validation.
