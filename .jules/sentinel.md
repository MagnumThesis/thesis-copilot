## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-06-14 - Missing Authentication and IDOR in Protected Routes
**Vulnerability:** Protected routes in `src/worker/routes/auth-routes.ts` (e.g., profile and password change) did not use the `requireAuth` middleware, and their handlers in `src/worker/handlers/auth.ts` did not verify if the requested `userId` matched the authenticated user's ID.
**Learning:** This combination leads to an Insecure Direct Object Reference (IDOR) where anyone can modify or view any user's profile and change passwords by merely passing their `userId`. Handlers must fail-closed and check ownership explicitly using `authContext.userId !== userId`.
**Prevention:** Always apply the `requireAuth` middleware to protected endpoints and explicitly validate resource ownership against the authenticated user context in handlers before performing sensitive operations.
