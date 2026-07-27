## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2025-02-28 - SSRF bypass due to missing internal hostname checks
**Vulnerability:** The `validateAndSanitizeUrl` function missed common SSRF attack vectors, such as link-local addresses (`169.254.x.x`), null routing (`0.0.0.0`), IPv6 loopback (`[::1]`), and internal domain namespaces (`.local`, `.internal`, `.localhost`).
**Learning:** URL parsers automatically canonize IPv4 variations, which helps protect against octal/hex obfuscations when using strict exact-match or prefix-match validations on `.hostname`.
**Prevention:** Explicitly match against the normalized strings `0.0.0.0`, `[::1]`, and check for standard internal TLD suffixes using `.endsWith` in addition to IP prefix ranges.
