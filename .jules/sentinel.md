## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2025-03-08 - Fix SSRF Vulnerability in URL Validation
**Vulnerability:** URL validation in `url-metadata-extractor.ts` failed to block Cloud Metadata endpoints (169.254.x.x), 0.0.0.0, IPv6 loopbacks, and internal TLDs (.internal, .local), allowing Server-Side Request Forgery.
**Learning:** The URL parser automatically canonicalizes IPs, but explicit checks must cover all private/internal spaces, not just standard RFC1918 networks, especially on cloud infrastructure where link-local addresses can leak IAM credentials.
**Prevention:** Always include 169.254.x.x, IPv6 loopbacks, and 0.0.0.0 when validating user-supplied URLs against private IP spaces, along with internal DNS domains.
