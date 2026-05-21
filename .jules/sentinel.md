## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Auth and IDOR Vulnerabilities in Auth Routes
**Vulnerability:** Protected routes in `src/worker/routes/auth-routes.ts` lacked the `requireAuth` middleware. Handlers in `src/worker/handlers/auth.ts` (`getUserProfileHandler`, `updateUserProfileHandler`, `changePasswordHandler`) lacked validation ensuring the requested `userId` matched the authenticated `userId`, allowing Insecure Direct Object Reference (IDOR).
**Learning:** Even if routes are logically "protected" by their path names, they must explicitly enforce authentication via middleware and authorization via context validation.
**Prevention:** Always apply the `requireAuth` middleware to protected endpoints and validate resource ownership against the `authContext.userId`.
