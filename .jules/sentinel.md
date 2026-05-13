## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Auth & IDOR in User Profile Endpoints
**Vulnerability:** The `/profile/:userId` and `/change-password/:userId` endpoints lacked authentication (`requireAuth`) in their route definitions and did not enforce authorization (checking `authContext.userId === userId`) in the handlers.
**Learning:** Even if client-side logic hides buttons or pages, server-side APIs must independently enforce authentication (are you logged in?) and authorization (are you allowed to edit *this* specific user?). Without this, attackers can bypass the UI and directly manipulate other users' data via direct API calls (IDOR).
**Prevention:** Always apply the `requireAuth` middleware to protected routes in `src/worker/routes/auth-routes.ts` and explicitly check `const authContext = getAuthContext(c); if (!authContext || authContext.userId !== userId) { return c.json({ error: 'Forbidden' }, 403); }` in handler logic where the `userId` is passed as a URL parameter.
