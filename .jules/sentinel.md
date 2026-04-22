## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Auth Middleware and IDOR in Auth Routes
**Vulnerability:** Protected routes like `/profile/:userId` and `/change-password/:userId` in `src/worker/routes/auth-routes.ts` were missing the `requireAuth` middleware, and the corresponding handlers in `src/worker/handlers/auth.ts` did not verify that the requested `userId` matched the authenticated user's ID, leading to an Insecure Direct Object Reference (IDOR) vulnerability.
**Learning:** Routes defined under "Protected routes" comments are not automatically protected; middleware must be explicitly applied per-route or via a route group. Even with middleware, handlers must still authorize that the authenticated user has permission to access/modify the specific resource ID requested.
**Prevention:** Always apply `requireAuth` directly to sensitive route definitions. Inside handlers receiving a `userId` parameter, always fetch the auth context and enforce `authContext.userId === requestedUserId`.
