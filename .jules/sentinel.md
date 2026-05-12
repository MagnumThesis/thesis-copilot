## 2024-05-12 - Missing Authentication and IDOR in Auth Handlers
**Vulnerability:** Protected routes lacked the `requireAuth` middleware and handlers (`getUserProfileHandler`, `updateUserProfileHandler`, `changePasswordHandler`) did not validate if the requested `userId` matched the authenticated user, causing an Insecure Direct Object Reference (IDOR) vulnerability.
**Learning:** Cloudflare Workers/Hono routing doesn't enforce authentication implicitly; middleware must be explicitly attached to protected endpoints, and handlers must verify ownership before acting on parameters.
**Prevention:** Always use `requireAuth` middleware for sensitive endpoints and explicitly check `authContext.userId === requestedUserId` within handlers to ensure a fail-closed access control model.
