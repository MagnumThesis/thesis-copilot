## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-05-07 - Fix IDOR in Auth Handlers
**Vulnerability:** IDOR vulnerability in protected auth handlers (profile and password change) allowing access to other user's data.
**Learning:** Protected handlers must not only rely on route-level authentication but explicitly validate that the requested `userId` parameter matches the authenticated `userId` retrieved via `getAuthContext(c)`.
**Prevention:** Use a 'fail-closed' approach by using `if (!authContext || authContext.userId !== userId)` instead of a 'fail-open' condition.
