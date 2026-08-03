## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-08-03 - Incomplete URL Sanitization leading to SSRF
**Vulnerability:** The `validateAndSanitizeUrl` function in `src/worker/lib/url-metadata-extractor.ts` only blocked `localhost` and standard private IP ranges (`127.x.x.x`, `192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`). It failed to block link-local addresses (`169.254.x.x`), `0.0.0.0`, IPv6 loopback (`[::1]`), and internal domains (`.internal`, `.local`).
**Learning:** SSRF protections must comprehensively cover all forms of local routing and cloud-specific internal addresses, especially the link-local range (`169.254.x.x`) used for AWS/GCP instance metadata services. Also, native URL objects automatically canonicalize IPv4 addresses, which means checking for the standard format `169.254.` is sufficient to catch decimal and hex encodings.
**Prevention:** Always use exhaustive blocklists for internal and local routing when parsing URLs, and rely on standard URL parsing libraries to handle obfuscated IP formats (like hex or decimal) before validation.
