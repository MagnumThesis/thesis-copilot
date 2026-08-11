## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-24 - SSRF Vulnerability in Metadata Extractor
**Vulnerability:** The `validateAndSanitizeUrl` function filtered standard local IPs but allowed access to Cloud Metadata Services (169.254.x.x), the IPv6 loopback (`[::1]`), the zero-address (`0.0.0.0`), and internal cluster domains (`.internal`, `.local`).
**Learning:** Checking for localhost and standard private ranges is insufficient. Attackers frequently use cloud metadata IPs and IPv6 variants to bypass simple SSRF filters and extract sensitive infrastructure keys.
**Prevention:** Implement comprehensive, canonicalized hostname blocklists covering IMDS IPs, IPv6 loopbacks, zero-routing addresses, and local TLDs to thoroughly mitigate SSRF risks when fetching user-supplied URLs.
