## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-11-10 - SSRF via Insufficient Hostname Validation
**Vulnerability:** The URL metadata extractor's SSRF protection used broad substring checks (`.startsWith('127.')`) and omitted checks for IPv6 localhost (`[::1]`) and AWS link-local addresses (`169.254.169.254`).
**Learning:** Substring checks for IP filtering are insufficient and error-prone. They can falsely block valid domains containing IP-like sequences (e.g., `project127.com`) while failing to catch alternative IP representations or DNS-resolved local domains (like `.nip.io`).
**Prevention:** Always use precise regex patterns or dedicated IP parsing libraries to validate hostnames against private/local IP ranges. Explicitly include loopback addresses and cloud provider metadata endpoint IP ranges.
