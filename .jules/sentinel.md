## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-06-29 - Insecure Direct Object Reference (IDOR) in Messages Endpoint
**Vulnerability:** The `getMessagesHandler` in `src/worker/handlers/messages.ts` lacked authentication and authorization checks. Anyone with a `chatId` could retrieve messages for that chat.
**Learning:** Sub-resources (like chat messages) that belong to a parent resource (chat) which belongs to a user must also verify the parent resource's ownership to prevent IDOR vulnerabilities. Endpoints must validate the user is authenticated and authorized to access the requested data.
**Prevention:** Ensure all endpoints fetching sub-resources implicitly or explicitly verify the ownership of the parent resource before returning the data. Always use the user's ID from an authenticated token in database queries.
