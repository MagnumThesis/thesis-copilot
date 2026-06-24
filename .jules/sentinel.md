## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-06-24 - Missing Authentication and IDOR on User Endpoints
**Vulnerability:** Protected routes in `src/worker/routes/auth-routes.ts` lacked the `requireAuth` middleware, and user endpoint handlers in `src/worker/handlers/auth.ts` did not verify if the requested `userId` matched the authenticated user.
**Learning:** Forgetting to add authentication middleware on protected endpoints and failing to validate ownership (IDOR) can allow attackers to access, modify, or manipulate other users' data (such as their profile or password).
**Prevention:** Always ensure protected routes use `requireAuth`, and enforce strict ownership checks using a fail-closed approach (`if (!authContext || authContext.userId !== userId)`) before processing requests for user-specific resources.
