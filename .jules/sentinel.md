## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-08-16 - Prevent SSRF via Comprehensive URL Validation
**Vulnerability:** The URL metadata extractor was vulnerable to Server-Side Request Forgery (SSRF) because it failed to block IPv6 loopback addresses ([::1]), the 0.0.0.0 address, link-local addresses (169.254.x.x) used for cloud metadata, and internal top-level domains (.internal, .local).
**Learning:** Native Node.js/browser URL objects automatically canonicalize IPv4 addresses, which helps prevent octal/hex bypasses, but explicit string matching on the resolved `urlObj.hostname` must comprehensively cover all local, private, and internal address spaces, not just standard IPv4 private networks.
**Prevention:** Always validate against a comprehensive list of restricted hostnames and address blocks, including 0.0.0.0, [::1], and 169.254.x.x, when preventing SSRF in URL processing.
