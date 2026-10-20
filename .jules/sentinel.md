## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-10-20 - SSRF Vulnerability in URL Validation regex false positives
**Vulnerability:** The URL validation logic used broad substring matching (`.includes('127.')`, `.startsWith('192.168.')`) to detect private IPs, which caused false positives for valid domains like `project127.com` or `my192.168.company.com`.
**Learning:** When writing regex or substring matches to detect IP ranges within hostnames, we must anchor them properly or use strict regex boundaries `(^|\.)` and `(?:\.|$)` to prevent blocking legitimate domain names that happen to contain IP-like numbers.
**Prevention:** Use precise regex patterns that fully match the IPv4 structure (e.g., `/(^|\.)127\.\d+\.\d+\.\d+(?:\.|$)/`) rather than naive `.includes()` or `.startsWith()` methods when checking for blocked IPs in hostnames.
