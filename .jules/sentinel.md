## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - IDOR in Chat Messages
**Vulnerability:** The `/api/chats/:id/messages` endpoint lacked authentication and authorization checks, allowing any user to read messages of any chat ID (IDOR).
**Learning:** The route was missing `requireAuth` middleware and the handler failed to explicitly verify that the parent `chatId` resource belonged to the authenticated user.
**Prevention:** Ensure all sub-resource queries verify ownership of the parent resource by querying the database (`.eq('user_id', userId)`) and always enforce authentication middleware on sensitive routes.
