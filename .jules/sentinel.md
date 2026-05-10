## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-05-10 - Missing Authentication and IDOR on User Routes
**Vulnerability:** Protected routes (like fetching/updating profiles or changing passwords) lacked middleware authentication and did not verify that the requested `userId` matched the authenticated user's ID, allowing Insecure Direct Object References (IDOR).
**Learning:** Using explicit route middleware (e.g., `requireAuth`) is essential for securing endpoints, and handlers must actively validate resource ownership against the current session token to prevent horizontal privilege escalation. Always implement a 'fail-closed' pattern.
**Prevention:** Always apply authentication middleware to sensitive routes and explicitly assert `if (!authContext || authContext.userId !== requestedUserId)` before performing database operations on user-specific resources.
