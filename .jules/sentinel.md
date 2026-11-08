## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-11-08 - Overly Permissive CORS with Credentials (revisited)
**Vulnerability:** The application was using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`) through `corsOriginResolver` falling back to `*` on missing origin header.
**Learning:** Returning a wildcard (`*`) when credentials are true is insecure and invalid under the CORS specification.
**Prevention:** Never use `origin: '*'` when `credentials: true` is enabled. Always fallback to a trusted, specifically named origin.
