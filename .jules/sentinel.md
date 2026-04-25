## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2025-03-08 - Missing Auth Middleware & IDOR on User Routes
**Vulnerability:** Sensitive routes (e.g. /profile/:userId, /change-password) lacked route-level requireAuth middleware, and their handlers did not validate that the requested userId matched the authenticated token's userId, leading to Insecure Direct Object References (IDOR).
**Learning:** Even if a handler performs an operation that relies on an ID parameter, we must ensure that the user actually owns that ID. Authentication only proves who they are, but authorization verifies what they can access.
**Prevention:** Always apply the requireAuth middleware to protected routes. For operations on specific resources (like user profiles), always retrieve the authenticated userId via getAuthContext(c) and assert it matches the requested resource ID before proceeding.
