## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2025-02-20 - Incomplete SSRF Protection in URL Parser
**Vulnerability:** The validateAndSanitizeUrl function blocked some local IPs (127.x.x.x, 192.168.x.x, 10.x.x.x) but missed critical cloud metadata endpoints (169.254.x.x), 0.0.0.0, IPv6 loopbacks (::1), and internal DNS suffixes (.local, .internal), exposing the server to SSRF.
**Learning:** Basic regexes and partial IP lists are insufficient for SSRF protection because attackers can use alternative encodings, 0.0.0.0, IPv6 loopbacks, or metadata endpoints.
**Prevention:** When preventing SSRF via URL parsing, ensure that local, private, link-local (169.254.x.x), 0.0.0.0, IPv6 loopback ([::1]) addresses, and internal domains/TLDs (`.internal`, `.local`) are comprehensively blocked to prevent attackers from retrieving sensitive cloud environment metadata.
