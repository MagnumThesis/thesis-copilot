1. **Enhance SSRF Prevention in `validateAndSanitizeUrl`:** The current SSRF protection in `src/worker/lib/url-metadata-extractor.ts` only blocks `localhost`, `127.*`, `192.168.*`, `10.*`, and `172.16.*` to `172.31.*`. However, it fails to block several other critical private/local IP ranges and hostnames that are commonly exploited in Server-Side Request Forgery (SSRF) attacks, especially in cloud environments:
    - Cloud metadata IP: `169.254.*`
    - IPv6 loopback: `[::1]`
    - `0.0.0.0`
    - Internal hostnames like `.internal` or `.local`

    I will use `replace_with_git_merge_diff` to update `src/worker/lib/url-metadata-extractor.ts` to include these comprehensive SSRF protections.

2. **Add corresponding tests:** I will use `replace_with_git_merge_diff` to update `src/tests/url-metadata-extractor.test.ts` to include tests that verify these additional SSRF blocks work correctly.

3. **Verify:** Run the tests for `url-metadata-extractor` using `npx vitest src/tests/url-metadata-extractor.test.ts` to ensure the new tests pass and no existing tests break. Also run `pnpm lint` and `pnpm test` (for the whole suite, accepting known failures).

4. **Pre-commit Steps:** Call `pre_commit_instructions` and follow them to ensure proper testing, verification, review, and reflection are done. I'll add an entry to the `.jules/sentinel.md` journal since this is a Sentinel vulnerability.

5. **Submit:** Submit the changes with an appropriate branch name and PR description.
