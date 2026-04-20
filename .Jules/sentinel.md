
## 2024-05-30 - Fix IDOR and Auth Bypass in Auth Routes
**Vulnerability:** The profile (`/profile/:userId`) and password (`/change-password/:userId`) endpoints did not verify if the authenticated user matched the `userId` in the URL (IDOR). Furthermore, the authentication middleware (`requireAuth`) was not actually attached to the protected endpoints in the route definitions.
**Learning:** Always ensure that route parameters indicating a resource owner are cross-checked against the `getAuthContext()` payload, and explicitly enforce middleware on restricted routes.
**Prevention:** For any user-specific operation, validate `authContext?.userId === requestedUserId`. Verify that routing files explicitly attach `requireAuth` to sensitive endpoints instead of relying solely on the handler.
