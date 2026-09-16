## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-09-16 - SSRF via Weak URL Validation
**Vulnerability:** The URL validation logic used `urlObj.hostname.startsWith('127.')` to block loopbacks. This naive string matching incorrectly allowed SSRF attacks, and incorrectly blocked valid domains like `127.com`.
**Learning:** Native `URL` object canonicalizes representations (e.g., `0`, `0x7f.0.0.1` -> `0.0.0.0`, `127.0.0.1`), but we still need strict regular expressions to evaluate `urlObj.hostname`. IPv6 representations of IPv4 loopbacks (e.g. `[::ffff:127.0.0.1]`) must also be handled.
**Prevention:** Always use precise regex boundaries or dedicated IP parsing libraries to evaluate canonicalized IP hosts against Private, Loopback, Link-Local, and Cloud Metadata ranges.
