## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-10-27 - SSRF Vulnerability via Loose Hostname Validation
**Vulnerability:** The metadata extractor's URL validation used `.startsWith()` for IP checks (e.g., `hostname.startsWith('127.')`).
**Learning:** This approach enables SSRF bypasses via DNS resolution of embedded IPs (e.g., `127.0.0.1.nip.io`) and causes false positives for domains like `project127.com`. It also omitted IPv6 loopback (`[::1]`) and AWS metadata endpoints (`169.254.x.x`).
**Prevention:** Always use strict regex patterns bound by word boundaries or dots to validate IPv4 addresses securely. Ensure AWS link-local IP and IPv6 localhost patterns are included.
