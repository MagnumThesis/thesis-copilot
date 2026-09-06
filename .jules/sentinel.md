## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-09-06 - SSRF Bypass via IPv6, Metadata IP, and `.startsWith` False Positives
**Vulnerability:** A string-based SSRF filter in `validateAndSanitizeUrl` relied on `.startsWith()` for IP ranges, which erroneously blocked legitimate domains like `127.com`, while failing to block cloud metadata IPs (`169.254.169.254`), `0.0.0.0`, and IPv6 variants (`[::1]`, `[::ffff:127.0.0.1]`).
**Learning:** Native `URL` object canonicalization does not normalize IPv6 loopback or `0.0.0.0` into IPv4 localhost. Also, `.startsWith()` is too naive for IP matching, leading to both false positives and false negatives.
**Prevention:** When performing string-based SSRF protections on URLs, use precise regex boundaries covering both IPv4 and IPv6 loopback/ULA/link-local variants, as well as `169.254.x.x` ranges, instead of generic string matching.
