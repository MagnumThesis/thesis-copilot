## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-06-16 - Missing Auth and IDOR on User Profile Routes
**Vulnerability:** Protected routes (`/profile/:userId` and `/change-password/:userId`) lacked the `requireAuth` middleware and explicitly failed to check if the `userId` parameter matched the authenticated user ID.
**Learning:** Even when routes are logically grouped as "protected", the middleware must be explicitly applied. Additionally, authentication does not guarantee authorization—IDOR vulnerabilities arise when resource ownership is assumed rather than verified using the server-side authentication context.
**Prevention:** Always apply authentication middleware (`requireAuth`) to protected endpoints and explicitly enforce a 'fail-closed' authorization check (e.g., `if (!authContext || authContext.userId !== userId)`) against the authenticated user context retrieved on the server.
