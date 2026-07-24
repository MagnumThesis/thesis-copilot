## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - SSRF vulnerability due to incomplete URL sanitization
**Vulnerability:** The validateAndSanitizeUrl function blocked common private IPs (10.x, 192.168.x) but missed 0.0.0.0, IPv6 loopback ([::1]), link-local addresses (169.254.x.x), and internal domains (.internal, .local), allowing Server-Side Request Forgery (SSRF).
**Learning:** Basic regex matching for IPv4 private networks is insufficient for SSRF protection because attackers can use alternative formats like IPv6 loopbacks, 0.0.0.0, or cloud metadata endpoints (169.254.169.254).
**Prevention:** Implement comprehensive blocklists that include all loopback interfaces, link-local addresses, and internal TLDs. Consider relying on native Node.js/browser URL object canonicalization to prevent octal/hex bypasses when validating hostnames.
