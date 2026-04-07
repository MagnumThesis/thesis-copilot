## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Authentication and IDOR on User Profile Endpoints
**Vulnerability:** The `/profile/:userId` and `/change-password/:userId` endpoints were lacking `requireAuth` middleware and IDOR checks. A malicious actor could access or modify another user's profile and password without being authenticated as that user.
**Learning:** Endpoints dealing with sensitive user data must enforce both authentication and authorization. Applying `requireAuth` ensures the user is logged in, but checking that the authenticated `userId` matches the targeted resource `userId` prevents IDOR.
**Prevention:** Always apply the `requireAuth` middleware to protected routes. For endpoints operating on a specific user's resource, verify the `userId` parameter matches `getAuthContext(c)?.userId`.
