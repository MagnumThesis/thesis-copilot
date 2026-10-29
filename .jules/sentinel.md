## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-10-29 - SSRF Vulnerability via URL Validation Bypass
**Vulnerability:** The `validateAndSanitizeUrl` function in `src/worker/lib/url-metadata-extractor.ts` used weak `startsWith` checks (e.g., `.startsWith('127.')`) to block local IP addresses, which could be bypassed using DNS-based SSRF (e.g., `127.0.0.1.nip.io`) and failed to block IPv6 localhost (`[::1]`) and AWS metadata IPs (`169.254.*`). It also caused false positives for valid domains (e.g., `10.com`).
**Learning:** Naive string-matching like `startsWith` or `.includes` on hostnames is insufficient for SSRF protection because it ignores DNS rebinding/wildcards and IP permutations, and can inadvertently block legitimate traffic.
**Prevention:** Use precise regex patterns that enforce proper IP octet boundaries (e.g., `/(^|\.)127\.\d+\.\d+\.\d+(?:\.|$)/`) to prevent both bypasses and false positives, and ensure all cloud/link-local spaces and IPv6 loopbacks are explicitly denied.
