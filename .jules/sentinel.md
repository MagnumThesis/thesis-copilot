## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Auth Middleware and IDOR in User Profile Routes
**Vulnerability:** The protected routes in `src/worker/routes/auth-routes.ts` (`/profile/:userId`, `/change-password/:userId`, `/logout`) lack the `requireAuth` middleware, and the handlers in `src/worker/handlers/auth.ts` do not validate if the requested `userId` matches the authenticated user.
**Learning:** Relying solely on the presence of a `userId` parameter without enforcing ownership creates an IDOR vulnerability, allowing unauthenticated or unauthorized users to view, modify profiles, or change passwords.
**Prevention:** Always apply authentication middleware to protected routes and explicitly validate ownership by comparing the requested resource ID against the authenticated `userId` from the context.
