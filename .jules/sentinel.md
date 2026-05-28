## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-28 - Missing Authentication and IDOR on User Profile Endpoints
**Vulnerability:** Protected user routes (profile, change-password) in `src/worker/routes/auth-routes.ts` lacked the `requireAuth` middleware, and the handlers in `src/worker/handlers/auth.ts` did not validate that the requested `userId` matched the authenticated token's user ID.
**Learning:** Even if routes are logically "protected," forgetting to add the middleware leaves them completely open. Furthermore, simply requiring authentication is insufficient if users can specify any `userId` in the path to access or modify another user's data (IDOR).
**Prevention:** Always apply authentication middleware to protected routes. For endpoints operating on user-specific resources, strictly validate ownership by checking `if (!authContext || authContext.userId !== userId)` rather than assuming the path parameter is safe.
