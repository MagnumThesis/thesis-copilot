## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-07-13 - Fix IDOR in getMessagesHandler
**Vulnerability:** The `getMessagesHandler` endpoint in `src/worker/handlers/messages.ts` lacked authentication and authorization checks. Anyone could fetch messages for any `chatId`.
**Learning:** In Hono route handlers not protected by global auth middleware, token validation (`getUserIdFromToken`) and resource ownership queries (e.g., matching `user_id` against the parent resource) must be explicitly implemented to prevent IDOR.
**Prevention:** Ensure every endpoint fetching sub-resources verifies ownership of the parent resource via the authenticated user's ID.
