## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-28 - Missing Authentication and IDOR Vulnerability in Auth Routes
**Vulnerability:** Protected routes in `src/worker/routes/auth-routes.ts` (e.g., getting/updating profiles, changing passwords) lacked the `requireAuth` middleware, and handlers in `src/worker/handlers/auth.ts` failed to validate that the authenticated `userId` matched the requested `userId`, creating an Insecure Direct Object Reference (IDOR) vulnerability.
**Learning:** Endpoints managing sensitive user data must enforce both authentication (verifying identity via middleware) and authorization (verifying ownership via fail-closed ID checks: `if (!authContext || authContext.userId !== userId)`). Without both, attackers can hijack accounts.
**Prevention:** Always apply authentication middleware to protected routes and explicitly validate parameter-based identifiers against the authenticated user's context using a fail-closed approach rather than a conditional fail-open one.
