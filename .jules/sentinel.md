## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-08-29 - Fix overly permissive CORS resolver default fallback
**Vulnerability:** The CORS resolver in Hono was returning the first allowed origin instead of denying the request when an unauthorized origin was detected. Since some routes configure `credentials: true`, this creates a serious security risk.
**Learning:** In Hono, returning an allowed origin fallback for disallowed origins fails insecurely, potentially allowing Cross-Origin Resource Sharing bypasses.
**Prevention:** Always return `null` in the dynamic origin resolver to explicitly deny CORS requests from unauthorized origins.
