1. **Fix CORS Vulnerability:**
   - Modify `src/worker/utils/cors-resolver.ts` to strictly validate allowed origins.
   - When `credentials: true` is enabled, returning `*` or a fallback allowed origin that wasn't requested is a security risk (allows unwanted cross-origin credentials inclusion if it defaults incorrectly in another flow or just `*` which is explicitly forbidden by browsers in this scenario but might behave unexpectedly or allow overly permissive wildcard access via Hono logic).
   - Change the resolver to return `null` if the origin is not found in `allowedOrigins`. This accurately reflects that the origin is not allowed, skipping adding the `Access-Control-Allow-Origin` header for disallowed origins.

2. **Verify changes:**
   - Check if tests run correctly and that `pnpm lint` does not fail.

3. **Complete pre-commit steps:**
   - Complete pre commit steps to ensure proper testing, verification, review, and reflection are done.

4. **Submit PR:**
   - Create a PR with title "🛡️ Sentinel: [HIGH] Fix overly permissive CORS configuration".
