## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-04-04 - Fixed Missing Auth and IDOR in Auth Profile Handlers
**Vulnerability:** Protected routes (`/profile/:userId` GET/PUT, `/change-password/:userId` POST) were missing the `requireAuth` middleware and their handlers explicitly trusted the `userId` passed as a URL parameter without validating it against the authenticated user context. This permitted an attacker to trivially bypass authorization (IDOR) and modify/view other users' profiles.
**Learning:** Middleware application relies on manual wiring in Hono routers, and custom header validation loops in route handlers omit mandatory token presence requirements. Explicitly setting `requireAuth` and asserting identity via `getAuthContext` are required to maintain strict boundaries.
**Prevention:** Always apply the `requireAuth` middleware securely on the route definition (e.g. `authApi.get('/path', requireAuth, handler)`) for any user-bound resources. Always extract `authContext` via `getAuthContext(c)` in the handlers and assert ownership logic (`authContext.userId === userId`).
