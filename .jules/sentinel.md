## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2025-02-28 - SSRF Validation Bypasses in URL Extraction
**Vulnerability:** URL hostname validation for SSRF protection used `.startsWith()` and lacked comprehensive IP block checks, allowing bypasses via wildcard DNS (127.0.0.1.nip.io), cloud metadata endpoints (169.254.169.254), and IPv6 localhost ([::1]). It also caused false positives for valid domains starting with numbers (127.example.com).
**Learning:** `URL.hostname` does not resolve wildcard DNS and substring checks like `.startsWith('127.')` are imprecise and lead to both false positives and false negatives.
**Prevention:** Always use precise regex patterns with strict boundaries `/(^|\.)IP(?:\.|$)/` when validating hostnames, and explicitly block IPv6 localhost and AWS link-local (`169.254.*`) blocks.
