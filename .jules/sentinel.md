## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-07-19 - SSRF Cloud Metadata Bypass
**Vulnerability:** Incomplete SSRF protection in `validateAndSanitizeUrl` allowed bypassing blocks via 169.254.x.x, 0.0.0.0, [::1], and internal domains (.local, .internal).
**Learning:** Basic private IP checks (e.g. 127.0.0.x, 192.168.x.x) are insufficient because cloud environments use link-local addresses (like 169.254.169.254) for metadata services, and internal domains are commonly used for intra-service communication.
**Prevention:** Use a comprehensive blocklist that includes link-local addresses, loopback variants (0.0.0.0, IPv6 [::1]), and internal TLDs to thoroughly prevent SSRF access to internal infrastructure.
