## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-28 - Missing IDOR Protection in Auth Handlers
**Vulnerability:** The `getUserProfileHandler`, `updateUserProfileHandler`, and `changePasswordHandler` in `src/worker/handlers/auth.ts` do not verify if the `userId` requested matches the currently authenticated user.
**Learning:** This is an Insecure Direct Object Reference (IDOR) vulnerability. Any authenticated user can modify or view another user's profile simply by changing the `userId` in the URL. Handlers for protected resources must always validate authorization (ownership), not just authentication.
**Prevention:** Always extract the authenticated user context (e.g., via `getAuthContext(c)`) and compare it against the requested resource ID. Use a fail-closed approach (`if (!authContext || authContext.userId !== userId) { return 403; }`).
