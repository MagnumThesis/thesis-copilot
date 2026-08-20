## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-08-20 - Missing Authorization in Messages Handler
**Vulnerability:** The GET /api/chats/:id/messages endpoint lacked authorization and ownership validation, allowing anyone to retrieve messages for any chat by ID (IDOR).
**Learning:** Explicit ownership validation needs to be consistently applied across all endpoints fetching user-related objects.
**Prevention:** Always extract user context from tokens and append `.eq('user_id', userId)` to ownership checks before querying related child resources.
