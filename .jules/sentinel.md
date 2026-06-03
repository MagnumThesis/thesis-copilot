## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-05-24 - IDOR in Auth Handlers
**Vulnerability:** IDOR in protected user profile and password change routes.
**Learning:** Protected routes fetching sub-resources or actions acting on resources requiring user identities failed to validate if the user doing the action `authContext.userId` corresponds with the user requested `userId`.
**Prevention:** Use `getAuthContext(c)` inside handlers acting on a `userId` route param to ensure `authContext.userId === userId`.
