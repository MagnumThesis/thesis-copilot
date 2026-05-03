## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Authorization Checks in User Routes (IDOR)
**Vulnerability:** User-specific endpoints (`getUserProfile`, `updateUserProfile`, `changePassword`) accepted a `userId` parameter from the URL but failed to verify that it matched the authenticated user's ID, allowing Insecure Direct Object References (IDOR).
**Learning:** Even if an endpoint requires authentication (e.g., via middleware), it must explicitly authorize that the authenticated identity has permission to access the requested resource identifier.
**Prevention:** Always extract the user identity from the verified authentication context (`getAuthContext`) and compare it against requested resource IDs before performing sensitive operations.
