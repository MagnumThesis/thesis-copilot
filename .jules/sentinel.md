## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-06-12 - Missing IDOR Protection in Auth Handlers
**Vulnerability:** The `/profile/:userId` and `/change-password/:userId` routes were lacking both authentication checks at the route level and proper authorization checks in the handlers, allowing any user to potentially access or modify another user's profile and password.
**Learning:** Simply accepting a `userId` as a URL parameter is insufficient. Handlers that operate on user-specific data must extract the authenticated user's ID from the request context (e.g., via `getAuthContext(c)`) and validate it against the requested parameter to prevent Insecure Direct Object Reference (IDOR) attacks.
**Prevention:** Always apply the `requireAuth` middleware to user-specific routes, and enforce an explicit check `if (requestedUserId !== authContext?.userId)` before performing sensitive operations in the handler.
