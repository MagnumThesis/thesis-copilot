## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-08-13 - Authentication Bypass via Try/Catch Swallow
**Vulnerability:** The Stripe webhook handler was swallowing signature validation errors in its catch block and falling back to unauthenticated processing when STRIPE_WEBHOOK_SECRET was configured. Additionally, crypto.timingSafeEqual was used without validating buffer lengths, throwing exceptions for length mismatches that were then similarly swallowed.
**Learning:** Never swallow validation errors in authentication flows. An exception in a security check must halt execution and return an error response, not fall through to unauthenticated fallback paths. Additionally, always check buffer lengths before calling timingSafeEqual.
**Prevention:** If an environment requires a secret, enforce a hard failure (e.g., HTTP 400 or 401) on any signature validation error.
