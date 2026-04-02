## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2025-04-02 - IDOR and Missing Authentication in User Profile and Password Routes
**Vulnerability:** The sensitive user profile endpoints (`GET /profile/:userId`, `PUT /profile/:userId`, and `POST /change-password/:userId`) in `src/worker/routes/auth-routes.ts` lacked the `requireAuth` middleware. Additionally, their respective handlers in `src/worker/handlers/auth.ts` blindly trusted the `userId` passed in the URL path parameters without cross-checking against the authenticated user's context.
**Learning:** This is a classic Insecure Direct Object Reference (IDOR) pattern coupled with missing authentication checks. Although these routes were commented as "Protected routes (authentication required)", the protection was missing from the router bindings, and the handlers lacked the defensive assertion that the user requesting or modifying the data is the actual owner of the resource.
**Prevention:**
1. Always apply the `requireAuth` middleware on sensitive user-specific API routes.
2. Inside the handler, explicitly extract the `authContext` using `getAuthContext(c)` and compare `authContext.userId` with the requested resource's owner (e.g., `c.req.param('userId')`), returning `403 Forbidden` if they mismatch.
