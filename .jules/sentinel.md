## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-08-12 - Prevented SSRF bypass in URL validation
**Vulnerability:** The validateAndSanitizeUrl function only blocked basic IPv4 string matches, leaving the system vulnerable to SSRF bypasses via canonicalized octal/hex IPs, IPv6 loopback ([::1]), link-local (169.254.x.x), 0.0.0.0, and internal TLDs (.local, .internal).
**Learning:** Node.js URL automatically canonicalizes IPv4 inputs, making strict hostname validation possible. However, the hostname blacklist must be comprehensive to block cloud metadata services (169.254.x.x) and internal DNS namespaces.
**Prevention:** Always use canonicalized hostnames and comprehensive blacklists, including IPv6, link-local, and internal TLDs when mitigating SSRF.
