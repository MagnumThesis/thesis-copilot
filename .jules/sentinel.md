## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-10-25 - Comprehensive SSRF Protection
**Vulnerability:** URL validator missed link-local IPs (169.254.x.x), loopback variants (0.0.0.0, [::1]), and internal domains (.local, .internal), enabling potential Server-Side Request Forgery against cloud metadata APIs.
**Learning:** The URL API normalizes IP obfuscation, but strict blocking of all internal, link-local, and specific domains is required for comprehensive SSRF prevention.
**Prevention:** Always block cloud metadata link-local IPs (169.254.x.x), `0.0.0.0`, IPv6 loopbacks, and common internal TLDs when fetching URLs on behalf of users.
