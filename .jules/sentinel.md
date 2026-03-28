## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-03-28 - IDOR in getMessagesHandler
**Vulnerability:** The `getMessagesHandler` in `src/worker/handlers/messages.ts` fetched messages for any given `chat_id` without verifying if the requested `chat_id` belonged to the authenticated user requesting it.
**Learning:** This is a classic Insecure Direct Object Reference (IDOR) vulnerability. Any authenticated user could guess or enumerate `chat_id`s and view private conversations belonging to other users. Route parameters representing sensitive resources must always be strictly validated against the currently authenticated user's ID.
**Prevention:** When fetching nested resources (like messages belonging to a chat), always verify ownership of the parent resource (the chat) first by querying the database (e.g., `.eq('user_id', userId)`) before proceeding to fetch the child records.
