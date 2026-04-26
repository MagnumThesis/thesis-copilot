## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-25 - Missing Authentication and IDOR on User Profile Routes
**Vulnerability:** Several user profile routes (`/profile/:userId`, `/change-password/:userId`) were missing authentication checks. Furthermore, even if authenticated, there were no IDOR (Insecure Direct Object Reference) checks to ensure that the user modifying or accessing the profile was actually the owner of the profile.
**Learning:** Always apply authentication middleware to sensitive endpoints. More importantly, simply being authenticated is not enough—always verify that the authenticated user matches the owner of the resource being accessed or modified (authorization).
**Prevention:** Apply `requireAuth` middleware consistently on all protected routes. In handlers, extract the authenticated `userId` (e.g., via `getAuthContext`) and compare it against the requested resource `userId` before proceeding with the operation.
