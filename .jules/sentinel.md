## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2025-04-03 - Fix IDOR in Auth Profile Handlers
**Vulnerability:** IDOR in user profile and password endpoints (`/profile/:userId`, `/change-password/:userId`). The endpoints lacked `requireAuth` middleware and the handlers themselves didn't cross-check the authenticated user token with the target `userId`.
**Learning:** Even if custom logic verifies headers (like in `verifyTokenHandler` or `logoutHandler`), route-specific resource manipulation needs explicit middleware protection (`requireAuth`) AND explicit ownership checks (`authContext.userId === userId`).
**Prevention:** Always wrap targeted endpoints with `requireAuth` middleware in the route definition and enforce `userId` match via `getAuthContext(c)` within the handler logic.
