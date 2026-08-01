## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** The application is using `origin: '*'` together with `credentials: true` in Hono CORS configuration (`src/worker/routes/auth-routes.ts`).
**Learning:** Using a wildcard origin with credentials enabled allows any website to make requests to the authenticated endpoints and include the user's cookies/credentials. This is a significant security risk and can lead to CSRF attacks or data theft.
**Prevention:** Avoid using `origin: '*'` with `credentials: true`. Instead, implement a dynamic origin resolver function utilizing `c.env` or `import.meta.env` to strictly validate against allowed frontend URLs and development environments.
## 2025-02-28 - Fix Incomplete SSRF Protection
**Vulnerability:** URL validation didn't block all types of internal IP addresses and hostnames. The bypasses allowed were: 0.0.0.0, IPv6 loopback ([::1]), link-local addresses (169.254.*) and local/internal domains.
**Learning:** Checking for localhost and standard private IPv4 subnets isn't sufficient for SSRF prevention. Cloud instances (AWS, GCP) expose metadata at link-local IPs and sometimes custom domains (.internal), which can be queried. Node URL parser treats 0.0.0.0 and [::1] as local as well.
**Prevention:** Always implement comprehensive SSRF blacklisting, encompassing 0.0.0.0, link-local and IPv6 equivalents, alongside domain resolution safety where applicable.
