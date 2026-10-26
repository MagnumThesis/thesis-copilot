## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-10-26 - SSRF Protection Bypass via Wildcard DNS
**Vulnerability:** Broad substring checks for localhost/private IPs like `.startsWith('127.')` can be bypassed using wildcard DNS records like `127.0.0.1.nip.io` since `urlObj.hostname` resolves to `127.0.0.1.nip.io`.
**Learning:** Using `.startsWith` on hostnames is insufficient against wildcard DNS routing and doesn't explicitly catch EC2 metadata `169.254.*` or IPv6 localhost `[::1]`.
**Prevention:** Explicitly use regex like `/(^|\.)127\.\d+\.\d+\.\d+(?:\.|$)/` to validate explicitly IP ranges and match exact IPv6 endpoints to ensure complete SSRF protection.
