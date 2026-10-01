## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-10-01 - Naive SSRF Protection using startsWith
**Vulnerability:** The application was using `.startsWith('127.')` (and similar checks) on URL hostnames to prevent Server-Side Request Forgery (SSRF) when fetching external metadata.
**Learning:** Using `hostname.startsWith()` is overly broad and intercepts legitimate domains that coincidentally start with those characters (e.g. `127.0.0.1.com`). More importantly, it is an insecure and unreliable way to check IP addresses against private or internal networks.
**Prevention:** Use strictly defined regular expressions to match entire IPv4 patterns for loopback, private, and link-local ranges, or utilize a dedicated IP parsing library, rather than partial string matching.
