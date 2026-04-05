## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Auth & IDOR on Profile Endpoints
**Vulnerability:** The `/profile/:userId` and `/change-password/:userId` endpoints were missing both `requireAuth` middleware and IDOR checks.
**Learning:** Even if custom logic might eventually fail downstream, endpoints operating on sensitive user data MUST explicitly require authentication middleware at the route level AND validate the authenticated user matches the requested resource ID within the handler.
**Prevention:** Apply `requireAuth` middleware to all protected routes in the Hono router definition, and always extract `authContext` to verify ownership via `authContext.userId === paramId`.
