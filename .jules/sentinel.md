## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-07-22 - Prevent SSRF Cloud Metadata Bypass
**Vulnerability:** URL validation for metadata extraction blocked `localhost`, `127.0.0.1`, `192.168.*`, and `10.*`, but allowed cloud metadata endpoint `169.254.169.254`, `0.0.0.0`, IPv6 loopback `[::1]`, and internal TLDs (`.internal`, `.local`).
**Learning:** Basic SSRF protection is often incomplete. Native `URL` parsing helps canonicalize, but specific blocks for cloud environments (link-local), zeroes, and internal hostnames are critical.
**Prevention:** When building an allowlist/blocklist for URL sanitization to prevent SSRF, comprehensively include AWS/GCP metadata IPs (`169.254.x.x`), IPv6 analogs (`[::1]`), and internal domain extensions.
