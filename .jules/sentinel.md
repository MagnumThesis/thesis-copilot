## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-05-24 - IDOR in Auth Handlers
**Vulnerability:** The `getUserProfileHandler`, `updateUserProfileHandler`, and `changePasswordHandler` endpoints extracted `userId` from request parameters and performed database operations without verifying that the `userId` matched the currently authenticated user's context.
**Learning:** Even if a route is protected by an authentication middleware (`requireAuth`), failure to explicitly map the requested resource ID to the authenticated principal leads to Insecure Direct Object References (IDOR), allowing a user to manipulate or access other users' data.
**Prevention:** Always extract the authenticated user context (e.g., via `getAuthContext(c)`) in protected routes and implement a strict authorization check `if (!authContext || authContext.userId !== requestedId)` before processing the request.
