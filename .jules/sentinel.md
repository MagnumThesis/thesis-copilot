## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Authorization Checks in Auth Routes
**Vulnerability:** IDOR vulnerability in protected routes due to missing middleware and authorization checks.
**Learning:** Protected user routes must not only verify the presence of a token, but also explicitly check that the authenticated user owns the resource they are attempting to access.
**Prevention:** Always use the `requireAuth` middleware on sensitive routes and validate the request `userId` parameter against the `userId` extracted from the authenticated `getAuthContext`.
