## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-06-10 - Missing Authentication and IDOR on User Endpoints
**Vulnerability:** The application was missing the `requireAuth` middleware on sensitive user endpoints (`/profile/:userId`, `/change-password/:userId`, etc.) and the handlers themselves lacked IDOR (Insecure Direct Object Reference) checks, allowing any authenticated or even unauthenticated user to view/modify other users' data by changing the `userId` parameter.
**Learning:** Relying purely on the frontend to pass the correct ID is insecure. The backend must independently verify that the requester has permission to access the requested resource. When user-specific parameters are passed in the URL, they must be validated against the authenticated context.
**Prevention:** Always apply authentication middleware (`requireAuth`) to protected routes. Within the handler, explicitly assert ownership by comparing the requested resource ID (e.g., `userId`) against the authenticated user's ID (`getAuthContext(c).userId`). Default to a fail-closed response (403 Forbidden) if the IDs do not match.
