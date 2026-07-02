## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - SSRF vulnerability due to incomplete private IP blocking
**Vulnerability:** The validateAndSanitizeUrl function blocks basic private IPs (10.x, 192.168.x, 127.x, 172.16-31.x) but fails to block 169.254.169.254 (AWS instance metadata), 0.0.0.0, and IPv6 loopback (::1).
**Learning:** Basic SSRF protection is often insufficient if it misses edge cases like instance metadata IPs and IPv6 variants, which can allow attackers to retrieve sensitive cloud environment metadata.
**Prevention:** Always comprehensively block local, private, link-local (169.254.x.x), 0.0.0.0, and IPv6 loopback variants when preventing SSRF via URL parsing.
