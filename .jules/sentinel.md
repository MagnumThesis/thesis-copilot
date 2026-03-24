## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2025-02-28 - Missing IDOR Protection on Chat Messages Endpoint
**Vulnerability:** The `/api/chats/:id/messages` endpoint (`getMessagesHandler`) did not verify if the requested `chatId` belonged to the authenticated user, allowing any user with a valid chat ID to fetch its messages.
**Learning:** Common pattern of fetching associated records (messages) using only the foreign key (`chatId`) without joining or verifying the parent record's ownership against the authenticated user's ID.
**Prevention:** Always verify ownership of the parent entity before allowing access to its sub-resources, either via a direct query with `.eq('user_id', userId)` or an authorization middleware that checks ownership.
