## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-11-11 - SSRF in URL Metadata Extractor
**Vulnerability:** Weak IP filtering allowing DNS rebinding and IP obfuscation in SSRF protections
**Learning:** Checking for substrings like `.startsWith('127.')` allows bypass via DNS-based SSRF (e.g. 127.0.0.1.nip.io), obfuscated IPs (0x7f000001, 2130706433), or creates false positives (project127.com). Additionally, IPv6 localhost and AWS link-local were not blocked.
**Prevention:** Always use precise regex patterns considering both valid IPv4 boundary formats (e.g. `/(^|\.)127\.\d+\.\d+\.\d+(?:\.|$)/`) and explicit blocks for IPv6 (`[::1]`) and link-local (`169.254.*`). Node's URL object canonicalizes integers/hex IPs automatically.
