
## 2024-03-20 - Restrict permissive wildcard CORS across API routes
**Vulnerability:** API routes (including auth, billing, and search management) used `origin: '*'` with `credentials: true`. This allowed potentially any website to make authenticated requests, which is a major security risk for Cross-Origin Resource Sharing (CORS).
**Learning:** Hardcoded wildcard origins often circumvent security in Cloudflare Workers and Hono apps, particularly when `credentials: true` is involved (which is technically invalid with `*` but sometimes improperly enforced by clients).
**Prevention:** Implement a dynamic origin validation function using `c.env` or `import.meta.env` to strictly whitelist allowed frontend URLs and localhost environments, instead of relying on `*`.
