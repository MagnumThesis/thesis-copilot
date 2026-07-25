## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-07-25 - Prevent SSRF in URL Metadata Extractor
**Vulnerability:** URL validation failed to block 0.0.0.0, IPv6 loopback ([::1]), cloud metadata APIs (169.254.x.x), and internal domains (.internal, .local), enabling Server-Side Request Forgery (SSRF) when extracting URL metadata.
**Learning:** Basic regex/string matching for private IPs is insufficient; developers often miss edge cases like cloud metadata endpoints or alternative loopback representations.
**Prevention:** Always comprehensively block all non-routable, link-local, loopback IPs, and internal domains when making outbound requests on behalf of a user, relying on robust URL parsing.
