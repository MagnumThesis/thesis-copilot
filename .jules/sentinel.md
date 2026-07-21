## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-07-21 - SSRF Filter Evasion via Cloud Metadata and Internal TLDs
**Vulnerability:** URL metadata extraction's SSRF protection missed link-local IPs (169.254.x.x), IPv6 loopback ([::1]), 0.0.0.0, and internal TLDs (.internal, .local), allowing potential extraction of cloud environment metadata.
**Learning:** Relying only on standard localhost and IPv4 private network ranges is insufficient to prevent SSRF in cloud environments. Attackers can leverage alternative loopback interfaces or cloud metadata endpoints.
**Prevention:** Maintain a comprehensive blocklist that includes link-local addresses, IPv6 loopback, and internal domain names when validating URLs for external fetches.
