## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-27 - IDOR in Profile API Endpoints
**Vulnerability:** User profile and change-password endpoints lacked IDOR protection, trusting the `userId` passed in parameters or body without verifying the authenticated user token matches the `userId`.
**Learning:** Cloudflare worker API routes need explicit authorization checks at the handler level to ensure the token context corresponds to the requested resource.
**Prevention:** Always compare `userId` params or resource ownership in the database with the `userId` in `authContext` obtained from `getAuthContext(c)`.
