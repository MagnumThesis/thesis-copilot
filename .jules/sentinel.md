## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-09-14 - SSRF Validation False Positives and IPv6 Bypasses
**Vulnerability:** The SSRF protection used `.startsWith()` which allowed IPv6 loopbacks (e.g., `[::1]`) and cloud metadata IPs (`169.254.169.254`) while mistakenly blocking legitimate domains like `10.example.com`.
**Learning:** Using `.startsWith()` string matching on hostnames is highly flawed as it does not enforce boundaries and ignores non-standard representations.
**Prevention:** Always use precise boundary-enforcing regular expressions or dedicated IP parsing libraries to validate hostnames for SSRF protection, ensuring both IPv4 and IPv6 patterns (as well as cloud metadata) are properly covered.
