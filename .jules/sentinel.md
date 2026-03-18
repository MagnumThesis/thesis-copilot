## 2024-05-14 - Overly Permissive CORS Configuration

**Vulnerability:** The application was using `origin: '*'` in its CORS configuration across multiple routes (`auth-routes.ts`, `billing-routes.ts`, `search-result-management.ts`, and `index.ts`), notably alongside `credentials: true` in the authentication endpoints.
**Learning:** Using a wildcard `*` with `credentials: true` is a critical security vulnerability and is blocked by modern browsers. However, even when credentials aren't explicitly enabled, a wildcard origin permits any site to make requests and read responses from the API, which exposes the application to unauthorized cross-origin requests and data leakage.
**Prevention:** Always use a dynamic origin validation function that checks the incoming `origin` against a whitelist of allowed origins defined in environment variables (e.g., `ALLOWED_ORIGINS`). This provides defense-in-depth and ensures that only trusted frontends can interact with the API.
