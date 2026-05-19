## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Authentication and IDOR in Auth Endpoints
**Vulnerability:** The `/profile/:userId`, `/change-password/:userId`, and `/verify` routes were missing the `requireAuth` middleware. Additionally, the corresponding handlers did not verify if the authenticated user matched the requested `userId`, leading to a potential Insecure Direct Object Reference (IDOR) vulnerability.
**Learning:** Protected routes must always include authentication middleware. Handlers that operate on user-specific resources must explicitly validate that the requested `userId` matches the authenticated `userId` to prevent IDOR attacks. A 'fail-closed' approach ensures that any mismatch results in an immediate authorization failure.
**Prevention:** Always use `requireAuth` on protected routes. In the handlers, retrieve the authenticated user via `getAuthContext(c)` and perform a strict equality check (`if (!authContext || authContext.userId !== userId)`) against the requested resource ID.
