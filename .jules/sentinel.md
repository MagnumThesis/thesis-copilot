## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-03-29 - [Missing IDOR protection on getMessagesHandler]
**Vulnerability:** The `/api/chats/:id/messages` endpoint retrieved chat messages without verifying if the requested `chat_id` actually belonged to the authenticated user.
**Learning:** In handlers that don't pass through a strict ownership middleware (unlike `getChatsHandler`), it's easy to miss manual resource ownership checks when querying by a resource ID, leading to Insecure Direct Object Reference (IDOR) vulnerabilities.
**Prevention:** Always extract `userId` from the token and query the parent resource (e.g., `chats` table) to verify ownership (`user_id === userId`) before fetching or modifying nested resources (e.g., `messages`). Add unit tests that specifically check for 403 Forbidden scenarios.
