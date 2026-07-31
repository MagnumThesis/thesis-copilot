## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-27 - SSRF via Incomplete URL Validation
**Vulnerability:** URL validation in `url-metadata-extractor.ts` failed to block cloud metadata IPs (`169.254.x.x`), `0.0.0.0`, IPv6 loopback (`[::1]`), and internal domains (`.internal`, `.local`), leading to potential Server-Side Request Forgery (SSRF).
**Learning:** Checking for common private IPs (`10.x.x.x`, `192.168.x.x`, etc.) is insufficient. Cloud environments have specific metadata IPs (`169.254.x.x`) that must be explicitly blocked. Additionally, `0.0.0.0`, `[::1]`, and internal TLDs can be used to bypass basic filters and access internal services.
**Prevention:** Implement comprehensive SSRF protection by explicitly blocking `169.254.*`, `0.0.0.0`, `[::1]`, `.internal`, and `.local` in addition to standard RFC 1918 private IP ranges during URL validation.
