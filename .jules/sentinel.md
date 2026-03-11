## 2024-05-24 - Missing Authorization on getMessages Endpoint
**Vulnerability:** The `/api/chats/:id/messages` endpoint lacks an authorization check, meaning anyone can retrieve messages for any chat ID if they know or guess the ID (Insecure Direct Object Reference / IDOR).
**Learning:** Even if `chats` endpoints require authorization, the related `messages` endpoint must also verify that the authenticated user owns the parent chat.
**Prevention:** Always verify ownership of the parent resource before returning related sensitive data, especially on detail endpoints that receive an ID as a parameter.
