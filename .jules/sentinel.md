## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - IDOR in User Profile and Password Endpoints
**Vulnerability:** The application allowed authenticated users to access and modify other users' profiles and change their passwords by simply changing the userId parameter in the URL.
**Learning:** Missing explicit validation to ensure the requested userId parameter matches the authenticated user's ID leads to Insecure Direct Object Reference (IDOR) vulnerabilities, even if the endpoint requires an authentication token.
**Prevention:** Always ensure a fail-closed approach by using `if (!authContext || authContext.userId !== userId)` to explicitly validate ownership of the requested resource against the authenticated user's ID.
