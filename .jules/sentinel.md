## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-10-18 - AWS Metadata and IPv6 Localhost SSRF
**Vulnerability:** The URL validation logic in `url-metadata-extractor.ts` only blocked IPv4 loopback and standard private ranges (`127.*`, `10.*`, `192.168.*`, `172.16-31.*`) but failed to block the AWS EC2 instance metadata IP (`169.254.169.254`) and IPv6 localhost (`[::1]`).
**Learning:** String-matching SSRF protections are often incomplete and miss cloud-specific internal IPs or alternative representations like IPv6.
**Prevention:** Ensure any local IP denylists explicitly include the `169.254.*` link-local block and `[::1]` for IPv6.
