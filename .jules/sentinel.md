## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-09-09 - SSRF Bypass via IPv6 and 0.0.0.0
**Vulnerability:** URL validation in `validateAndSanitizeUrl` naively used `.startsWith()` checks, which failed to block `0.0.0.0`, cloud metadata IPs (`169.254.x.x`), and IPv6 loopback variants (`[::1]`, `[::ffff:...]`), while mistakenly blocking legitimate domains like `10.com`.
**Learning:** Native `URL` parsing does not canonicalize all loopback addresses to standard IPv4 `127.0.0.1`. IPv6 variants and `0.0.0.0` remain intact and can bypass simple prefix checks. Furthermore, `.startsWith()` is too broad and can cause false positives for valid domains.
**Prevention:** Always use precise regex boundaries or dedicated parsing logic to match IP ranges. Explicitly block `0.0.0.0`, cloud metadata subnets, and IPv6 loopback variants when preventing SSRF.
