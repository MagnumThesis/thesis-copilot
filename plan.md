1. **Fix SSRF Vulnerability in URL Metadata Extractor**:
   - The `validateAndSanitizeUrl` function in `src/worker/lib/url-metadata-extractor.ts` checks for local IPs and loopbacks to prevent SSRF (Server-Side Request Forgery). However, it misses IPv6 loopback variants (e.g., `[::1]`, `::ffff:127.0.0.1`), IPv6 ULA/Link-local ranges, `0.0.0.0`, and cloud provider metadata IPs (e.g., `169.254.169.254`).
   - I will update `validateAndSanitizeUrl` to explicitly check and block `169.254.`, `0.0.0.0`, and IPv6 variants.

2. **Run tests**:
   - Run tests to verify the fix works and no regression is introduced.

3. **Verify lint**:
   - Ensure `pnpm lint` passes to verify TypeScript type checking.

4. **Complete pre-commit steps**:
   - Run `pre_commit_instructions` and follow its instructions to complete pre-commit steps.

5. **Submit PR**:
   - Once all tests and pre-commit checks pass, submit the change with a descriptive PR title and message.
