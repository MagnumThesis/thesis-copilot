## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-08-25 - IDOR in Chat Messages API
**Vulnerability:** The `/api/chats/:id/messages` endpoint accepted any `chatId` parameter without checking if the authenticated user owned the chat, allowing malicious actors to read anyone's conversation history (IDOR).
**Learning:** Endpoints that fetch resources using a URL parameter must always cross-reference that resource's ownership with the authenticated `userId`. Even if the parent resource creation is secure, retrieval can be bypassed if explicitly called.
**Prevention:** Always extract `userId` from the JWT token and include `.eq('user_id', userId)` in database queries when accessing sensitive user-owned records.
