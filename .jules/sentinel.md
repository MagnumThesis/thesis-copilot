## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-05-26 - Missing Access Control on Chat Messages API
**Vulnerability:** The `/api/chats/:id/messages` endpoint was missing both authentication checks and authorization checks (IDOR), allowing anyone to read messages from any chat.
**Learning:** Routes fetching sub-resources (like messages) must verify both authentication via middleware (`requireAuth`) and ownership of the parent resource (the chat) via database query.
**Prevention:** Always apply `requireAuth` to sensitive endpoints and verify parent resource ownership (`user_id = authContext.userId`) before returning nested resources.
