## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-10-25 - Missing Authentication and IDOR on User Endpoints
**Vulnerability:** Protected user endpoints (`/profile/:userId`, `/change-password/:userId`) lack the `requireAuth` middleware, and their handlers do not verify if the requested `userId` matches the authenticated session's user ID.
**Learning:** Relying on comments (e.g., `/** Protected routes */`) without applying the actual middleware leads to authentication bypasses. Furthermore, simply checking if a user is authenticated is insufficient for user-specific operations; explicit ownership checks are required to prevent Insecure Direct Object References (IDOR).
**Prevention:** Always apply the `requireAuth` middleware to protected routes in Hono route definitions. Within the handlers, retrieve the authenticated context via `getAuthContext(c)` and explicitly validate that the target resource belongs to the authenticated user (`if (!authContext || authContext.userId !== userId)`) before proceeding.
