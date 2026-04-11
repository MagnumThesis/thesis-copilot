## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2025-04-11 - Missing Authentication and IDOR on User Profile Endpoints
**Vulnerability:** Several sensitive authentication routes (`/profile/:userId` and `/change-password/:userId`) were lacking `requireAuth` middleware at the route level. In addition, the handlers for these routes did not verify that the authenticated user (`authContext.userId`) matched the target resource `userId` parameter, leading to an Insecure Direct Object Reference (IDOR) vulnerability.
**Learning:** Adding authentication middleware is not enough; handlers must always enforce ownership checks when accessing or modifying resources by ID, ensuring users can only interact with their own data.
**Prevention:** Always apply authentication middleware at the route definition level for protected endpoints, and in the handler, explicitly extract the user ID from the verified token/context and validate it against the requested resource's identifier.
