## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - IDOR and Missing Auth in Protected Routes
**Vulnerability:** Protected routes (e.g., `/profile/:userId`, `/change-password/:userId`) were missing the `requireAuth` middleware and lacked Insecure Direct Object Reference (IDOR) checks in their handlers.
**Learning:** Even if routes are intended to be protected, they are completely open if the authentication middleware is not explicitly applied to them in the router. Furthermore, even with authentication, handlers must explicitly verify that the requested resource (e.g., `userId`) matches the authenticated user's ID to prevent IDOR attacks where a user accesses or modifies another user's data.
**Prevention:** Always explicitly apply authentication middleware (like `requireAuth`) to protected routes in the router definition. Inside the handler, always retrieve the authenticated context (e.g., `getAuthContext(c)`) and validate ownership of the requested resource against the authenticated user ID (`authContext.userId === requestedId`) using a fail-closed approach.
