## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-09-04 - Overly Broad SSRF Blocklist and Missing Metadata IP Blocking
**Vulnerability:** The SSRF protection mechanism used naive string prefix checks (`.startsWith('10.')`, `.startsWith('127.')`) on hostnames, which inadvertently blocked legitimate domains (e.g., `10.example.com`). It also failed to block cloud provider metadata IPs (`169.254.169.254`), `0.0.0.0`, and IPv6 loopback variants (`[::1]`).
**Learning:** Native `URL` object canonicalization doesn't protect against all IP variants. Simple string matching on hostnames can cause collateral damage by blocking valid subdomains while missing edge cases like mapped IPs (`.nip.io`).
**Prevention:** Implement precise regex boundaries checking if the host is explicitly in an IPv4 format before checking octet ranges. Explicitly include cloud metadata and IPv6 variants in blocklists.
