## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-10-30 - Overly Permissive CORS with Credentials (Fixed)
**Vulnerability:** The application was using `origin: '*'` together with `credentials: true` in the Hono CORS configuration (`src/worker/routes/auth-routes.ts`), which is a known vulnerability and violation of the CORS specification.
**Learning:** Even for requests where the `Origin` header is missing (`!origin`), the resolver must fall back to a specific, trusted allowed origin instead of returning `*` to ensure the configuration remains secure and compliant with modern browsers.
**Prevention:** Avoid returning `*` when `credentials: true` is configured. Always fall back to a specific trusted origin (e.g., the first item in the allowed list) when the Origin header is absent.
