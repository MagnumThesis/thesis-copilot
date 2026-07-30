## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-07-30 - Incomplete SSRF Protection in URL Parsing
**Vulnerability:** URL parsing blocked common private IPs but missed critical cloud metadata endpoints (169.254.x.x), 0.0.0.0, IPv6 loopback, and internal TLDs.
**Learning:** Basic regex/prefix checks for private IPs are insufficient to prevent SSRF in modern cloud environments where attackers can leverage link-local addresses to extract sensitive IAM credentials or metadata.
**Prevention:** When validating user-supplied URLs for backend fetch operations, implement comprehensive blocklists that explicitly include link-local (169.254.0.0/16), ANY (0.0.0.0), IPv6 loopback ([::1]), and internal domains (.local, .internal).
