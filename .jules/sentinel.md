## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2025-05-18 - [Fix IDOR in Search Result Management]
**Vulnerability:** IDOR (Insecure Direct Object Reference) in `/api/search-result-management/*` endpoints. Several endpoints trusted a `userId` supplied in the request body or path parameters without validating it against the authenticated user's ID.
**Learning:** Cloudflare worker API routes need consistent authorization checks using an authentication context retrieved from middleware (`requireAuth` + `getAuthContext`), ensuring the requested `userId` matched the token `userId`.
**Prevention:** Apply `requireAuth` middleware to all resource modification endpoints, and extract the `authContext` via `getAuthContext(c)` to explicitly verify `authContext.userId === userId` before performing sensitive operations.
