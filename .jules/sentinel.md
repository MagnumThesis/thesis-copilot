## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-05-01 - Missing authorization checks and unprotected sensitive routes
**Vulnerability:** IDOR vulnerability in `getUserProfileHandler`, `updateUserProfileHandler`, and `changePasswordHandler` allowed authenticated users to modify/view other users' data. Sensitive routes in `auth-routes.ts` lacked the `requireAuth` middleware.
**Learning:** Route parameters like `userId` must always be validated against the authenticated user's context. Middleware like `requireAuth` must be explicitly attached to protected routes.
**Prevention:** Always verify `userId` against `authContext.userId` for user-specific operations. Ensure sensitive routes are protected with `requireAuth`.
