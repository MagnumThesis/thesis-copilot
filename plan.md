1. **Fix overly permissive CORS configuration**:
   - In `src/worker/utils/cors-resolver.ts`, modify the fallback from `*` to `allowedOrigins[0]` (or null/empty) when `!origin`.
   - Returning `*` alongside `credentials: true` is a critical security vulnerability that allows cross-site requests to include credentials if the browser somehow skips sending an Origin header, or if the origin logic fails. As per `sentinel.md` learning, we must fall back to a trusted allowed origin.

2. **Verify changes**:
   - Run the modified `test-cors3.ts` to ensure `*` is not returned.
   - Test with `pnpm lint` and `pnpm test` (with exact vitest command or wait, wait, the environment might be failing, we just need to ensure our changes don't break the build).

3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
4. **Submit PR**: Title "🛡️ Sentinel: [CRITICAL/HIGH] Fix overly permissive CORS wildcard with credentials".
