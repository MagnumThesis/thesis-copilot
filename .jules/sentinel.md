## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-10-25 - Fix SSRF Vulnerability in URL Metadata Extractor
**Vulnerability:** The `validateAndSanitizeUrl` method used weak substring checks (e.g., `startsWith('127.')`) to prevent Server-Side Request Forgery. This was easily bypassable via IP-encoded subdomains (like `127.0.0.1.nip.io`), IPv6 localhost addresses, and AWS link-local metadata endpoints (`169.254.169.254`).
**Learning:** Checking for substrings like `127.` at the beginning of a string is insufficient because attackers can embed IP strings in subdomains or use alternative formats that the Node `URL` constructor accepts.
**Prevention:** Implement a robust regular expression for IPv4 subnets ensuring full word boundaries (using `(^|\.)` and `(?:\.|$)`), and explicitly block localhost variants and metadata IPs, rather than relying on loose string prefix matches.
