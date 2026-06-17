## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-10-24 - Missing Auth & IDOR on Profile Endpoints
**Vulnerability:** Protected routes in `src/worker/routes/auth-routes.ts` lacked the `requireAuth` middleware, and handlers in `src/worker/handlers/auth.ts` did not verify if the requested `userId` matched the authenticated user, leading to a critical IDOR vulnerability.
**Learning:** Endpoints mapped by dynamic parameters (like `:userId`) require explicit ownership validation within the handler even if a global auth middleware is applied, as the middleware only verifies that a token is valid, not that it belongs to the target resource.
**Prevention:** Always apply authentication middleware to protected routes, and implement a fail-closed ownership check `if (!authContext || authContext.userId !== userId)` using the authentication context.
