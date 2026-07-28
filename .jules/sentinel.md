## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-07-28 - SSRF Vulnerability in URL validation
**Vulnerability:** URL validation missed several IP variations used for SSRF, including cloud metadata IP (169.254.169.254), 0.0.0.0, IPv6 loopback, and local/internal TLDs.
**Learning:** When preventing SSRF via URL parsing, ensure that local, private, link-local (169.254.x.x), 0.0.0.0, IPv6 loopback ([::1]), and internal domains/TLDs are comprehensively blocked to prevent attackers from retrieving sensitive cloud environment metadata.
**Prevention:** Always use comprehensive IP blocklists and TLD checks when parsing URLs before fetching them in server-side logic.
