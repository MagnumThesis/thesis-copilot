## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Auth Middleware and IDOR in User Profile
**Vulnerability:** The protected user profile routes (`/profile/:userId`, `/change-password/:userId`) in `src/worker/routes/auth-routes.ts` were missing the `requireAuth` middleware. Additionally, their handlers in `src/worker/handlers/auth.ts` did not verify that the authenticated user matched the `userId` in the path parameters.
**Learning:** For endpoints manipulating user-specific resources, relying on route definitions without explicit middleware assignment can expose endpoints. Moreover, custom headers/context checks within adjacent handlers do not protect routes intrinsically. It's necessary to validate that `authContext.userId === param.userId`.
**Prevention:** Always apply the `requireAuth` middleware at the route level in Hono (e.g., `api.get('/path', requireAuth, handler)`). Within the handler, always fetch the user's context via `getAuthContext(c)` and assert that `userId` matches the requested resource ID to prevent Insecure Direct Object Reference (IDOR) vulnerabilities.
