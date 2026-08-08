## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-08-08 - Missing Ownership Check in Message Retrieval (IDOR)
**Vulnerability:** The `/api/chats/:id/messages` endpoint retrieved all messages for a given `chatId` without verifying if the authenticated user owned the chat, leading to an Insecure Direct Object Reference (IDOR) vulnerability.
**Learning:** Always verify resource ownership against the authenticated user's ID before returning sensitive data, even if the ID is considered hard to guess (UUIDs). Never rely solely on the existence of an object.
**Prevention:** Implement explicit database queries that include `user_id` filters (e.g., `.eq("user_id", userId)`) for all resource access handlers. Apply authentication middleware to sensitive routes.
