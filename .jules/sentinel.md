## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-25 - IDOR in Profile and Password Handlers
**Vulnerability:** The application handlers (`getUserProfileHandler`, `updateUserProfileHandler`, `changePasswordHandler`) did not verify if the authenticated user matches the `userId` requested in the route parameters.
**Learning:** This is an Insecure Direct Object Reference (IDOR) vulnerability, allowing any authenticated user to read/modify another user's profile and change their password by guessing their `userId`.
**Prevention:** Always verify that the requested resource ID matches the authenticated user's ID (e.g., via `getAuthContext(c).userId`) before processing the request on sensitive user-specific endpoints.
