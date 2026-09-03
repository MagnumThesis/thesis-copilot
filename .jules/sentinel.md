## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-09-03 - URL Validation SSRF Protection
**Vulnerability:** The validateAndSanitizeUrl function had incomplete SSRF protections, failing to block 0.0.0.0, cloud metadata endpoints (169.254.x.x), and IPv6 loopback variants (e.g., [::1], IPv4-mapped addresses, ULA).
**Learning:** Native URL parsing in Node.js does not canonicalize or map IPv6 representations (like [::ffff:127.0.0.1]) back to standard IPv4 localhost strings, requiring explicit blocking of these ranges.
**Prevention:** Always explicitly check for IPv6 loopback variants, 0.0.0.0, and cloud provider metadata IPs when implementing SSRF protections for URL validation.
