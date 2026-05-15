## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Authentication and IDOR on User Profile Routes
**Vulnerability:** Protected routes (like `/profile/:userId` and `/change-password/:userId`) did not use the `requireAuth` middleware, and the handlers lacked authorization checks verifying the requested `userId` matched the authenticated user's ID.
**Learning:** This exposes a critical Insecure Direct Object Reference (IDOR) vulnerability, allowing unauthenticated or unauthorized access to other users' profiles and operations. Always validate both authentication and the user's authority over the specific resource.
**Prevention:** Ensure protected routes utilize the `requireAuth` middleware and handlers explicitly validate the authenticated user's ID against the requested resource's `userId` using a fail-closed approach.
