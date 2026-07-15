## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-05-27 - Incomplete SSRF Protections in URL Validation
**Vulnerability:** The application's `validateAndSanitizeUrl` function in `src/worker/lib/url-metadata-extractor.ts` only blocked `localhost` and standard private IP ranges (`127.*`, `192.168.*`, `10.*`, `172.16-31.*`). It failed to block `0.0.0.0`, IPv6 loopback (`[::1]`), link-local addresses (`169.254.*`, often used for cloud provider metadata APIs), and internal network TLDs (`.local`, `.internal`).
**Learning:** Checking for localhost and standard private IP blocks is insufficient for comprehensive SSRF prevention. Modern cloud environments expose highly sensitive metadata endpoints on link-local addresses (like AWS's `169.254.169.254`). Additionally, `0.0.0.0` or `[::1]` can bypass naive `127.0.0.1` checks to access local services.
**Prevention:** When validating URLs to prevent SSRF, always include a comprehensive blocklist that covers all loopback representations (IPv4 and IPv6), link-local addresses, and common internal top-level domains. Relying solely on basic IP range matching is prone to bypasses.
