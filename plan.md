1. **Fix SSRF vulnerability in `src/worker/lib/url-metadata-extractor.ts`**
   - The current SSRF protection is inadequate because it uses `startsWith` for IP checks which has false positives (e.g. `project127.com`) and misses encoded IPs (e.g. integer `2130706433` -> `127.0.0.1`). It also doesn't check for IPv6 localhost (`[::1]`) or AWS metadata endpoint (`169.254.*`).
   - We will replace it with a more robust regex-based check and explicitly parse the hostname from the URL object.

2. **Fix CORS misconfiguration in `src/worker/utils/cors-resolver.ts`**
   - The current CORS resolver returns `*` if the `origin` header is not present. Returning a wildcard (`*`) with `credentials: true` (which is set on auth routes) is a security vulnerability and violates the CORS specification.
   - We will change the resolver to return `allowedOrigins[0]` instead of `*` when `!origin` is true.

3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - We will run the full test suite (`pnpm test`), type check (`pnpm tsc --noEmit`), and lint (`pnpm lint`) to verify our fixes don't introduce regressions.

4. **Submit PR**
   - We will submit a PR with the title '🛡️ Sentinel: [CRITICAL/HIGH] Fix SSRF and CORS vulnerabilities' and appropriate security descriptions.
