## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Authorization Checks (IDOR) on Chat Endpoints
**Vulnerability:** The `/api/chats/:id/messages` endpoint was fetching messages based only on `chatId` without verifying if the authenticated user actually owned that chat. This allowed any user to fetch another user's messages if they knew or guessed the `chatId`.
**Learning:** IDOR vulnerabilities can easily occur when fetching child resources (like messages) if the parent resource's ownership (the chat) is not explicitly verified against the authenticated user's ID before performing the fetch.
**Prevention:** Always verify ownership of the parent resource before performing operations on child resources. Extract `userId` from the auth token and query the parent table (e.g., `chats`) with `.eq('id', chatId).eq('user_id', userId)` to enforce strict authorization constraints.