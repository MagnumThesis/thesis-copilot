## 2024-03-14 - Unauthorized Access to Chat Messages
**Vulnerability:** IDOR (Insecure Direct Object Reference) and Unauthenticated Access on `/api/chats/:id/messages` endpoint.
**Learning:** Endpoints that fetch associated records for a resource (like messages for a chat) MUST independently verify both authentication and authorization, even if the user interface only reveals IDs to authenticated owners. The lack of an authentication check in `getMessagesHandler` allowed complete bypassing of security.
**Prevention:** Always extract the user token, verify it, and explicitly check that the parent resource (the chat) belongs to the authenticated user (`user_id = auth_user_id`) before returning sensitive related data.
