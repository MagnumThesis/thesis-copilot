## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-08-06 - Prevent SSRF Cloud Metadata Bypass
**Vulnerability:** Incomplete SSRF protection allowed access to cloud metadata services (169.254.169.254), 0.0.0.0, IPv6 loopback, and internal domains.
**Learning:** Checking for localhost and common private IPs (10.x, 192.168.x) is insufficient; attackers can exploit cloud instance metadata or alternative loopback representations.
**Prevention:** Always comprehensively block link-local addresses, 0.0.0.0, IPv6 loopbacks ([::1]), and internal TLDs (.local, .internal) when validating URLs for server-side fetching.
