## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-06-04 - Insecure Direct Object Reference in Auth Routes
**Vulnerability:** The application had protected endpoints (profile, change password) mapped with dynamic path parameters (e.g., /profile/:userId), but handlers didn't explicitly ensure that the requested `userId` matched the currently authenticated `userId`, leading to IDOR.
**Learning:** Relying purely on the `requireAuth` middleware isn't sufficient for parameterized endpoints. The authenticated user must be explicitly loaded in the handler via `getAuthContext` and verified against the requested resource's owner.
**Prevention:** Apply a fail-closed check: `if (!authContext || authContext.userId !== userId) { return c.json({ success: false, error: 'Unauthorized...' }, 403); }` at the beginning of all targeted handlers.
