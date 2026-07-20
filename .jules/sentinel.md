## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-07-20 - Insufficient SSRF Protection on Metadata Extraction
**Vulnerability:** The application fetches metadata from URLs but lacks full mitigation against Server-Side Request Forgery (SSRF) since it does not block `169.254.x.x` (AWS meta-data), `0.0.0.0`, IPv6 loopback, or internal domains.
**Learning:** URL sanitizers must comprehensively block link-local addresses, internal TLDs, and 0.0.0.0 (which resolves to localhost in some environments) to prevent attackers from retrieving sensitive cloud environment metadata.
**Prevention:** Implement comprehensive blocklists that include `169.254.x.x`, IPv6 loopback, and `.internal` / `.local` domains when performing outgoing server-side requests to user-provided URLs.
