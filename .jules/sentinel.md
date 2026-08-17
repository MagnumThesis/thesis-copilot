## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-08-17 - Missing SSRF Protections in URL Validation
**Vulnerability:** The `validateAndSanitizeUrl` function in `src/worker/lib/url-metadata-extractor.ts` lacked comprehensive checks against Server-Side Request Forgery (SSRF). While it blocked some basic private IPs, it failed to block link-local addresses (e.g., `169.254.x.x` used for cloud metadata), `0.0.0.0`, IPv6 loopback (`[::1]`), and internal TLDs (`.internal`, `.local`).
**Learning:** SSRF protections must be exhaustive. Attackers can bypass basic IPv4 filters by using IPv6 loopback addresses, `0.0.0.0`, or targeting cloud-specific metadata endpoints (169.254.169.254) to extract sensitive credentials.
**Prevention:** Always use a comprehensive deny-list for URL validation that includes IPv6 equivalents, link-local addresses, and common internal domain suffixes when fetching arbitrary URLs provided by users.
