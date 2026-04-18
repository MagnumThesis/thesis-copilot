## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-11-20 - [IDOR in Authentication Handlers]
**Vulnerability:** Insecure Direct Object Reference (IDOR) and missing authentication on critical user endpoints (`/profile/:userId`, `/change-password/:userId`).
**Learning:** Endpoints that manipulate user data must verify that the requested resource ID matches the authenticated user's ID, even if the route expects an ID parameter. Relying solely on the presence of a user ID without verifying ownership leads to IDOR.
**Prevention:** Apply the `requireAuth` middleware explicitly at the route definition level in `auth-routes.ts`, and enforce authorization in the handler logic by comparing the requested `userId` with `getAuthContext(c)?.userId`.
