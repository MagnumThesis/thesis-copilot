## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-08-30 - Fix SSRF and CORS Vulnerabilities
**Vulnerability:** URL extractor bypassed IPv6 loopback ([::1]), 0.0.0.0, and AWS metadata IP (169.254.169.254). CORS resolver returned a fallback origin string for disallowed origins when `credentials: true` was configured.
**Learning:** The native Node.js `URL` object doesn't cover all IP representations. Also, returning an explicit allowed origin for unverified origins bypasses CORS protections when credentials are true. Explicitly returning `null` drops the header safely.
**Prevention:** Always validate all IPv4 and IPv6 private/loopback patterns rigorously in SSRF protections, including cloud provider metadata IPs. For CORS configurations on credentialed routes, always explicitly deny unapproved origins by returning `null` instead of a fallback string.
