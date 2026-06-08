## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - IDOR in Auth Handlers
**Vulnerability:** The `getUserProfileHandler`, `updateUserProfileHandler`, and `changePasswordHandler` endpoints did not verify that the authenticated user's ID matches the requested `userId` parameter, leading to an Insecure Direct Object Reference (IDOR).
**Learning:** Even if a route is protected by `requireAuth` middleware, the handler must explicitly authorize the requested action against the authenticated user's context (`authContext.userId`) to ensure they only access or modify their own data.
**Prevention:** Always validate that the requested resource identifier matches the authenticated user's identifier or that the user has administrative privileges before proceeding.
