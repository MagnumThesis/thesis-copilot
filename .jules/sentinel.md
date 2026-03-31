## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-03-31 - Fix IDOR in getMessagesHandler
**Vulnerability:** Insecure Direct Object Reference (IDOR) where `/api/chats/:id/messages` did not verify if the requested `chat_id` belonged to the authenticated user.
**Learning:** Nested resource access (like messages under a chat) without explicit parent authorization checks allows unauthorized data access. Always check ownership of the parent resource.
**Prevention:** In Cloudflare Worker handlers that don't use the `requireAuth` middleware, explicitly extract the token, retrieve the `userId`, and query the parent resource table (e.g., `chats`) against the `userId` before returning nested data.
