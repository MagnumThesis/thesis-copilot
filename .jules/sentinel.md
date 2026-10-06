## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-10-06 - SSRF and Overly Permissive CORS with Credentials Fixes
**Vulnerability:**
1. SSRF bypass in `url-metadata-extractor.ts` where DNS-based wildcards (e.g., `169.254.169.254.nip.io`) and pseudo-formats (`127.1`) bypassed a basic `.startsWith` validation for private IPs.
2. The fallback of the CORS origin resolver in `cors-resolver.ts` returned `*`, which combined with `credentials: true` creates a critical security risk allowing arbitrary cross-origin requests to send and read authenticated user session data.

**Learning:**
- The `URL` constructor does not canonicalize DNS resolutions of local or spoofed private IPs via DNS rebinding / wildcard domains (e.g. `*.nip.io`). Regular expressions must capture any segment of the hostname.
- Returning `*` alongside `credentials: true` is inherently unsafe and explicitly blocked by modern browsers in some configurations, but nonetheless a dangerous anti-pattern that can expose CSRF and data leakage vulnerabilities.

**Prevention:**
- Ensure thorough IP validation checks use robust regex matching for IPv4 private subnets occurring anywhere in the hostname, and convert IP formats to numbers for range-based checks to thwart format-evasion.
- For wildcard origins in development/production when `credentials: true` is active, explicitly return an authorized origin (e.g., `allowedOrigins[0]`) when no origin header is provided, rather than returning `*`.
