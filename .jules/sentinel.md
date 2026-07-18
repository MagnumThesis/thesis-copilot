## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-07-18 - SSRF via Incomplete URL Validation
**Vulnerability:** The application's `validateAndSanitizeUrl` function allowed link-local addresses (169.254.x.x), 0.0.0.0, IPv6 loopback ([::1]), and internal domains (.internal, .local), creating an SSRF risk.
**Learning:** Attackers can retrieve sensitive cloud environment metadata (like AWS IMDSv2 via 169.254.169.254) or bypass internal firewalls if only basic private IP ranges (10.x.x.x, 192.168.x.x) are blocked.
**Prevention:** Ensure that local, private, link-local, 0.0.0.0, IPv6 loopback, and internal TLDs are comprehensively blocked when preventing SSRF. Leverage the native `URL` object's canonicalization to prevent bypasses like octal IP representations.
