## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-11-02 - Server-Side Request Forgery via Wildcard DNS
**Vulnerability:** A static string check (`.startsWith('127.')`) was used to prevent Server-Side Request Forgery against private IP addresses during URL metadata extraction.
**Learning:** This approach causes false positives (e.g. `127.com`) and can easily be bypassed by embedding private IPs inside subdomains of wildcard DNS services like `nip.io` or `xip.io` (e.g., `http://app.127.0.0.1.nip.io`). The Node URL object does not inherently resolve these.
**Prevention:** Always use carefully bounded regex matching `/(^|\.)127\.\d+\.\d+\.\d+(?:\.|$)/` on `urlObj.hostname` to correctly isolate the entire embedded IP string rather than relying on substring or prefix checks.
