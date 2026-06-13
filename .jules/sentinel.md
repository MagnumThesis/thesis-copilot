## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-05-24 - Missing Auth & IDOR in Auth Routes
**Vulnerability:** Protected auth routes lacked authentication middleware and allowed IDOR by omitting userId validation.
**Learning:** Relying solely on UI-level constraints without enforcing server-side ownership checks leads to critical authorization bypass.
**Prevention:** Always apply authentication middleware to protected routes and validate that the requested resource ID matches the authenticated user ID.
