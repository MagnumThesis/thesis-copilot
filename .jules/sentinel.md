## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-08-10 - Fix SSRF via IPv6, 0.0.0.0, and Internal Domains
**Vulnerability:** The `validateAndSanitizeUrl` function missed SSRF edge cases like `0.0.0.0`, IPv6 loopback (`[::1]`), cloud metadata endpoints (`169.254.x.x`), and internal domains (`.local`, `.internal`).
**Learning:** Basic SSRF filters often overlook alternative localhost representations (like `0.0.0.0` which resolves to loopback on Linux) and link-local cloud endpoints which can leak sensitive metadata in AWS/GCP/Azure.
**Prevention:** Always use comprehensive blocklists for SSRF protection, ensuring link-local IPs and common internal TLDs are explicitly blocked when fetching user-supplied URLs.
