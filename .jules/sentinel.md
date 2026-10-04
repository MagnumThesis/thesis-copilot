## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2026-10-04 - SSRF protection string check bypass
**Vulnerability:** Incomplete SSRF protection via naive `.startsWith()` IP matching in `url-metadata-extractor.ts`.
**Learning:** Using string matching like `urlObj.hostname.startsWith('10.')` fails insecurely by blocking legitimate domains like `10.com`, and simultaneously fails to prevent bypasses like `0.0.0.0` or `169.254.169.254`.
**Prevention:** Use exact Regex matches matching all 4 octets (`/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/`) or proper IP parsing libraries instead of naive `.startsWith` when doing network validations to block internal subnets.
