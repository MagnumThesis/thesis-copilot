## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-05-09 - Insecure Randomness in Identifiers
**Vulnerability:** The codebase relies on predictable identifiers using `Math.random()` and `Date.now()`, which can lead to de-anonymization and predictable request IDs.
**Learning:** Using `Math.random()` for any security-related or privacy-sensitive identifiers is a vulnerability because the V8 PRNG is not cryptographically secure and can be reverse-engineered.
**Prevention:** Always use `crypto.randomUUID()` when generating unique identifiers to ensure they are cryptographically secure and unpredictable.
