## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-05-24 - Missing Route and Handler Level Auth/Authz
**Vulnerability:** IDOR (Insecure Direct Object Reference) and missing authentication on `/profile/:userId` and `/change-password/:userId` endpoints allowed any user (or unauthenticated user) to read/modify other users' data.
**Learning:** In Hono apps using custom middleware, you must apply the authentication middleware (e.g., `requireAuth`) at the route definition and additionally verify in the handler that the authenticated user (`authContext.userId`) matches the resource being accessed (`req.param('userId')`), unless the resource explicitly does not belong to a specific user.
**Prevention:** Always use `requireAuth` on sensitive routes and validate `authContext.userId === requestedUserId` within the handler for user-specific endpoints to prevent IDOR.
