## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - Missing Authentication and IDOR on Chat Messages
**Vulnerability:** The `/api/chats/:id/messages` endpoint was missing the `requireAuth` middleware and did not verify if the requested `chatId` belonged to the authenticated user.
**Learning:** Endpoints that fetch sub-resources (like messages belonging to a chat) must explicitly verify ownership of the parent resource (the chat) to prevent Insecure Direct Object Reference (IDOR) attacks, even if the user is authenticated.
**Prevention:** Always use the `requireAuth` middleware on protected routes and explicitly validate that the requested parent resource (e.g., `chatId`) belongs to the authenticated user (e.g., via `getUserIdFromToken`) before returning sensitive data.
