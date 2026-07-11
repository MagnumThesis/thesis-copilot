## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - SSRF via Link-Local and Internal Domains
**Vulnerability:** The URL validator `validateAndSanitizeUrl` blocked common private IPs (10.x, 192.168.x, 127.x) but missed link-local addresses (169.254.x.x), 0.0.0.0, IPv6 loopback, and internal TLDs (.internal, .local).
**Learning:** Attackers can use 169.254.169.254 to query cloud metadata endpoints (like AWS IMDS) or bypass basic IP filters using 0.0.0.0 or internal domains.
**Prevention:** When validating URLs to prevent SSRF, ensure comprehensive blocking of all loopback, zero-network, link-local, and internal domain variants.
