## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-11-05 - Insecure CORS Origin Resolver returning Wildcard for No Origin
**Vulnerability:** The CORS origin resolver returns `*` when the `Origin` header is empty (`!origin`).
**Learning:** Returning a wildcard (`*`) with `credentials: true` (which is used in `/api/auth/*` routes) is a violation of the CORS specification and often flagged by security scanners. Even for requests where the `Origin` header is missing, the resolver must fall back to a specific, trusted allowed origin instead of returning `*` to ensure the configuration remains secure and compliant.
**Prevention:** Always fall back to a specific known-good origin (like the first allowed origin) instead of returning `*` when `credentials: true` might be used in the route.
