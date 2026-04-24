## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Authentication Middleware on Protected Routes
**Vulnerability:** The application is missing the `requireAuth` middleware on protected routes in `src/worker/routes/auth-routes.ts` (e.g., `/verify`, `/profile/:userId`, `/change-password/:userId`, and `/logout`). Although some internal checks exist, the explicit authentication context was missing at the route level.
**Learning:** Endpoints meant to require authentication must have the authentication middleware explicitly applied to them. Otherwise, unauthenticated users could access sensitive user-level endpoints.
**Prevention:** Always apply the `requireAuth` middleware explicitly in the route definition for endpoints that require authentication.
