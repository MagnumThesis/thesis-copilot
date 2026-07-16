## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-05-24 - Missing SSRF Protections in URL Validation
**Vulnerability:** The `validateAndSanitizeUrl` function failed to block link-local (`169.254.x.x`), `0.0.0.0`, `[::1]`, and internal `.internal`/`.local` domains, exposing the application to SSRF (Server-Side Request Forgery).
**Learning:** Basic regex validation for "HTTP" and IP blocks like 127.x.x.x or 10.x.x.x is insufficient. Attackers can reach cloud metadata services via 169.254.169.254 or bypass localhost filters using `0.0.0.0` or `[::1]`.
**Prevention:** Always comprehensively validate URLs by rejecting cloud provider link-local metadata endpoints, all forms of loopback addresses (IPv4 and IPv6), and common internal TLDs.
