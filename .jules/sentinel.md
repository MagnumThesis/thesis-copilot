## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-25 - Insecure Direct Object References (IDOR) and Missing Authentication
**Vulnerability:** The `/profile/:userId`, `change-password/:userId`, and other protected endpoints were missing the `requireAuth` middleware and explicit authorization checks to verify that the requesting user (`authContext.userId`) matches the requested resource ID (`userId`).
**Learning:** Without explicit authorization checks at the handler level, any authenticated user can manipulate the `userId` parameter in the URL to read or modify another user's profile and password.
**Prevention:** Always apply the `requireAuth` middleware to protected endpoints and explicitly validate authorization inside the handler using a fail-closed check (`if (!authContext || authContext.userId !== userId)`) before accessing or modifying the resource.
