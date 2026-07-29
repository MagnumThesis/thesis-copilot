## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.

## 2024-07-29 - SSRF Bypass via Link-Local and Internal Domains
**Vulnerability:** The metadata extraction logic validated URLs by attempting to reject private IP ranges (like 127.x, 192.168.x, 10.x, 172.x), but failed to reject loopback (`[::1]`, `0.0.0.0`), link-local addresses (`169.254.x.x`), and internal domain names (`.internal`, `.local`).
**Learning:** Basic IP blocklists in SSRF prevention often miss cloud-specific metadata routes (like AWS IMDS at 169.254.169.254) and IPv6/wildcard mappings (`0.0.0.0`), allowing attackers to request sensitive server data. Additionally, native `URL` parsing canonicalizes IPs (e.g. `0177.1` becomes `127.0.0.1`), meaning hostname checks on the canonicalized parsed `URL` object are reliable, provided the blocklist is comprehensive.
**Prevention:** When implementing SSRF blocklists, ensure coverage of `0.0.0.0`, IPv6 loopbacks, `169.254.x.x`, and internal top-level domains. Rely on the parsed `URL.hostname` for validation rather than raw string matching.
