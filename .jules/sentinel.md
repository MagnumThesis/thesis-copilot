## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Auth Middleware and IDOR in Auth Routes
**Vulnerability:** Protected routes in `auth-routes.ts` (`/profile/:userId`, `/change-password/:userId`, etc.) were missing the `requireAuth` middleware, allowing unauthenticated access. Furthermore, the handlers in `auth.ts` lacked IDOR protection, meaning any authenticated user could pass another user's ID to view/modify their profile.
**Learning:** Always explicitly apply `requireAuth` to protected endpoints, even if grouped under a "Protected routes" comment. Never trust client-provided IDs for sensitive operations without validating them against the authenticated user context (`getAuthContext(c)`).
**Prevention:** Apply authentication middleware explicitly to required routes and add IDOR checks (`authContext?.userId !== userId`) in handlers that operate on resources identified by a user-provided ID.
