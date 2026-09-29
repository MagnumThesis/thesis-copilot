## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-09-29 - Improper IP Validation in SSRF Protections
**Vulnerability:** The application was vulnerable to bypassing SSRF protections using naive string matching (e.g., `hostname.startsWith('127.')`).
**Learning:** Using `startsWith` blocks valid domain names (e.g., `127.0.0.1.com`) and misses link-local IPs (like AWS metadata endpoint `169.254.169.254`) and alternative IP representations.
**Prevention:** Always use precise regex boundaries or dedicated IP parsing functions to correctly identify private IP ranges and validate IP formats.
