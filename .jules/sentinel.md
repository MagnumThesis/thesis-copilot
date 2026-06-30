## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2025-01-20 - Unauthenticated Sub-resource Access (IDOR)
**Vulnerability:** The `getMessagesHandler` endpoint for fetching chat messages lacked authentication and ownership verification, allowing IDOR.
**Learning:** When fetching sub-resources (like messages) associated with a parent resource (like a chat), failing to verify the ownership of the parent resource can lead to unauthorized data exposure.
**Prevention:** To prevent IDOR vulnerabilities when fetching sub-resources, ensure the route requires authentication and the handler explicitly verifies ownership of the parent resource by querying the database (e.g., `supabase.from('chats').eq('id', chatId).eq('user_id', userId)`).
