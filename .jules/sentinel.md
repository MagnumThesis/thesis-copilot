## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Auth Middleware and IDOR in Protected Routes
**Vulnerability:** Protected endpoints in `src/worker/routes/auth-routes.ts` lacked `requireAuth` middleware, and user-specific handlers lacked explicit checks to ensure the requested `userId` matched the authenticated user.
**Learning:** Even when routes are logically grouped under "protected routes", explicit middleware and authorization checks must be enforced. Failing to do so can allow unauthenticated access or IDOR vulnerabilities where users modify others' data.
**Prevention:** Always verify that protected routes explicitly use `requireAuth`, and handlers accepting a `userId` parameter must use a fail-closed conditional (`if (!authContext || authContext.userId !== userId)`) to ensure the user owns the data.
