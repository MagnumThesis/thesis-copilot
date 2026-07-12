## 2024-05-24 - IDOR in Sub-resource Fetching
**Vulnerability:** IDOR in `/api/chats/:id/messages` where any user could read messages from any chat ID.
**Learning:** Route handlers fetching sub-resources didn't inherit ownership checks from parent resources or use the `requireAuth` middleware by default.
**Prevention:** Always apply `requireAuth` middleware to protected routes and explicitly verify ownership of parent resources (e.g., `chats` table) before returning sub-resources (e.g., `messages` table).