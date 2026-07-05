## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-05-24 - SSRF vulnerability in URL metadata extractor
**Vulnerability:** The application did not prevent local, loopback, or cloud-specific IP addresses when extracting URL metadata.
**Learning:** URL validation and sanitization for metadata retrieval features are vulnerable to Server-Side Request Forgery if they do not explicitly block local resources, such as \`0.0.0.0\`, \`[::1]\`, and \`169.254.x.x\`, which is heavily used in AWS cloud deployments.
**Prevention:** Always implement rigorous host filtering that explicitly rejects private and non-routable IPs (such as the \`169.254.x.x\` range, \`0.0.0.0\`, and IPv6 loopback addresses) to mitigate SSRF.
