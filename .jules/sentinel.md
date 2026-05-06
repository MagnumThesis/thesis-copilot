## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing IDOR Protection in Profile Handlers
**Vulnerability:** The profile handlers (`getUserProfileHandler`, `updateUserProfileHandler`, `changePasswordHandler`) accept a `userId` parameter but do not verify that it matches the currently authenticated user's ID. This allows an attacker to access or modify other users' profiles (Insecure Direct Object Reference).
**Learning:** Always validate that the resource being requested or modified belongs to the authenticated user. Relying solely on the presence of an authentication token is not sufficient for resource-level authorization.
**Prevention:** Explicitly fetch the authenticated user's context (e.g., via `getAuthContext(c)`) and compare their ID with the requested resource's owner ID, returning a 403 Forbidden if they do not match.
