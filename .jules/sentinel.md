## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2026-09-12 - Incomplete SSRF Protection in URL Metadata Extractor
**Vulnerability:** The URL metadata extractor's SSRF protection used overly broad `.startsWith` checks (e.g., `127.`, `192.168.`) which could block valid domains like `127.com`, and completely missed IPv6 loopback variants (e.g. `[::1]`), the `0.0.0.0` meta-address, and cloud metadata IPs like `169.254.169.254`.
**Learning:** Basic string matching is insufficient for comprehensive IP validation. Node.js `URL` object canonicalization maps variants like `::ffff:127.0.0.1` to `::ffff:7f00:1` in IPv6 representations which also must be explicitly handled. Cloud provider metadata instances are a massive risk if accessed via SSRF.
**Prevention:** Use strictly bounded regular expressions to validate IPv4 loopback/private ranges instead of `startsWith()`. Explicitly deny `[::1]`, `0.0.0.0`, cloud metadata endpoints, and IPv6 Link-Local/ULA prefixes when parsing external URLs for data fetching.
