## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-10-14 - CORS Wildcard with Credentials Vulnerability
**Vulnerability:** The CORS origin resolver returned `*` when the `origin` header was missing, which combined with `credentials: true` in `hono/cors` configuration is a critical security vulnerability.
**Learning:** Combining wildcard origins with credentials bypasses browser protections and can cause misconfigurations, especially when custom fallback resolvers default to `*`.
**Prevention:** When an origin header is missing and the endpoint requires credentials, explicitly return `undefined` or a strict default origin instead of a wildcard.
