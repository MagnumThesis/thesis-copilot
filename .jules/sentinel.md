## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Incomplete SSRF Protection in URL Validation
**Vulnerability:** The validateAndSanitizeUrl function blocked some private IPs but missed critical cloud metadata addresses (169.254.x.x), 0.0.0.0, IPv6 loopback, and internal TLDs.
**Learning:** Relying on a partial blacklist for SSRF protection leaves cloud environments vulnerable to metadata extraction and internal network scanning.
**Prevention:** Use a comprehensive blacklist for URL sanitization that covers link-local, loopback, and all private address spaces, or consider allowlisting specific target domains.
