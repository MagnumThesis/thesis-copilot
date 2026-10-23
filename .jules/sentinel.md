## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-10-23 - Overly Permissive CORS fallback with Credentials
**Vulnerability:** The CORS resolver in `src/worker/utils/cors-resolver.ts` falls back to `*` for missing origins while `credentials: true` is configured on endpoints.
**Learning:** Returning `*` alongside `credentials: true` is a violation of the CORS specification and exposes a severe vulnerability. The origin must fall back to a concrete trusted allowed origin instead of a wildcard.
**Prevention:** Always fallback to an explicit trusted domain (e.g., `allowedOrigins[0]`) when processing requests missing an Origin header if credentials are required.
