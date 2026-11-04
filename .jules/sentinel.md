## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2024-05-24 - SSRF via Weak URL Validation
**Vulnerability:** The application was vulnerable to SSRF via `validateAndSanitizeUrl` due to weak `startsWith('127.')` checks which are susceptible to bypasses (e.g., `127.example.com`, `subdomain.127.0.0.1.nip.io`) and failed to block AWS IMDS (`169.254.x.x`) and IPv6 localhost.
**Learning:** Using `startsWith` on strings is insufficient for URL validation, and while the WHATWG `URL` constructor normalizes IPs (e.g., hex/integer to string), it does not resolve or canonicalize wildcard DNS domains that embed IPs (like `.nip.io`).
**Prevention:** Use strictly anchored regexes like `/(^|\.)127\.\d+\.\d+\.\d+(?:\.|$)/` against `urlObj.hostname` to accurately prevent both direct IPs and DNS-embedded bypasses. Always ensure `[::1]` and `169.254.x.x` are included in the denylist.
