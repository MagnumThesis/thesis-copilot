## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-05-05 - Insecure Randomness in Error Middleware
**Vulnerability:** The application uses `Math.random()` to generate request IDs in `ErrorMiddleware.generateRequestId`.
**Learning:** `Math.random()` is cryptographically insecure and predictable, which could theoretically be exploited in specific contexts (like session fixation or tracking). The project prefers `crypto.randomUUID()` for ephemeral IDs.
**Prevention:** Avoid `Math.random()` for generating secure or globally unique IDs. Use `crypto.randomUUID()` which is standard and secure in Cloudflare Workers.
