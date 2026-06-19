## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-06-19 - Missing Authentication and IDOR on User Profiles
**Vulnerability:** The `getUserProfile`, `updateUserProfile`, and `changePassword` routes lacked the `requireAuth` middleware and did not verify that the authenticated user matches the requested `userId`.
**Learning:** Even if routes are logically grouped under 'Protected routes', they are not actually protected unless the authentication middleware is explicitly applied. Furthermore, merely being authenticated is insufficient for user-specific endpoints; ownership (IDOR prevention) must be strictly verified.
**Prevention:** Always apply authentication middleware (`requireAuth`) to protected routes and explicitly validate ownership via `getAuthContext(c)` against the requested resource ID using a fail-closed approach (`if (!authContext || authContext.userId !== userId)`).
