## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-18 - Fix SSRF Vulnerability in URL Metadata Extractor
**Vulnerability:** Server-Side Request Forgery (SSRF) bypass in URL metadata extraction. The `validateAndSanitizeUrl` function in `src/worker/lib/url-metadata-extractor.ts` only blocked basic local IPv4 addresses (e.g. `localhost`, `127.x.x.x`), allowing bypasses via `0.0.0.0`, `[::1]`, cloud metadata endpoints like `169.254.x.x`, and internal domains (`.internal`, `.local`).
**Learning:** Initial SSRF protections often focus purely on IPv4 loopbacks and private subnets, overlooking IPv6 loopbacks, `0.0.0.0` (which resolves locally on many systems), and environment-specific link-local addresses used by cloud providers for sensitive metadata APIs.
**Prevention:** Always validate against a comprehensive deny-list of internal/loopback IP spaces (including IPv6 and link-local) and block resolution of internal TLDs when fetching user-supplied URLs.
