## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - IDOR in Nested Resource Fetching (Message History)
**Vulnerability:** The `/api/chats/:id/messages` endpoint lacked proper authorization checks. It assumed that if a `chat_id` was provided, the user had the right to read it, allowing any user (or unauthenticated attacker, if not guarded by middleware) to read the message history of any other user's chat just by guessing the `chat_id`.
**Learning:** In endpoints that fetch nested resources (e.g., messages inside a chat), we cannot simply trust the provided parent ID (`chat_id`). We must always query the parent table (`chats`) to verify that the requested resource explicitly belongs to the authenticated user's ID before returning sensitive data.
**Prevention:** Always extract the authenticated `userId` and use it in a `WHERE user_id = ?` clause when looking up the parent resource before performing the nested query, even if the parent ID is known. Or better yet, enforce this check globally via Row Level Security (RLS) in Supabase.
