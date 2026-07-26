## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-07-26 - Enhance SSRF protections in URL validator
**Vulnerability:** URL validator missed several critical SSRF bypass vectors including 0.0.0.0, IPv6 loopback, cloud instance metadata IP (169.254.x.x), and internal domains (.local, .internal).
**Learning:** The URL validator in src/worker/lib/url-metadata-extractor.ts only blocked standard IPv4 private networks and localhost, leaving it vulnerable to SSRF attacks targeting cloud infrastructure metadata or IPv6 loopbacks.
**Prevention:** When implementing SSRF protections, comprehensively block local, private, link-local (169.254.x.x), 0.0.0.0, IPv6 loopback ([::1]) addresses, and internal domains/TLDs (.internal, .local). Note that Node.js URL object canonicalizes IPv4 addresses, which helps when combined with strict hostname validation.
