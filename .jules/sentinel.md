## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-04-08 - Auth Handlers Missing IDOR Protection
**Vulnerability:** The `/profile/:userId` and `/change-password/:userId` endpoints allowed any authenticated user to retrieve or modify another user's profile and password by providing a different user ID in the URL. Also, they lacked proper explicit `requireAuth` middleware protection.
**Learning:** Auth endpoints that perform operations based on user ID in the path need not only generic token verification (often implicitly done inside service functions or middleware elsewhere), but explicitly must enforce that the caller's JWT user ID matches the target user ID for resource access.
**Prevention:** Always extract `authContext` via `getAuthContext(c)` in Cloudflare Worker/Hono handlers and compare `authContext.userId` with `c.req.param('userId')`. Additionally, verify `requireAuth` middleware is explicitly applied on all protected endpoints in the route definition.
