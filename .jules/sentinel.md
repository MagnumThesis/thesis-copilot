## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-06-09 - Overly Permissive CORS wildcard fallback
**Vulnerability:** The `corsOriginResolver` returned `*` when an origin wasn't provided, which violates security best practices when used with `credentials: true`.
**Learning:** Using `origin: '*'` with `credentials: true` can allow CSRF attacks and is inherently insecure.
**Prevention:** Avoid returning a wildcard `*` from the CORS resolver when `credentials: true` is configured. Return a secure fallback origin (e.g. `allowedOrigins[0]`) instead.
