1. **Analyze Security Need**:
The application has SSRF protections in `src/worker/lib/url-metadata-extractor.ts`. However, its SSRF check is flawed.
It checks:
```typescript
    if (urlObj.hostname === 'localhost' ||
        urlObj.hostname.startsWith('127.') ||
        urlObj.hostname.startsWith('192.168.') ||
        urlObj.hostname.startsWith('10.') ||
        urlObj.hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
```
This is vulnerable to SSRF via IPv6 representations (e.g. `[::1]`, `[::ffff:127.0.0.1]`), octal representations that don't start with these values, and metadata IPs like `169.254.169.254`. The `startsWith` checks can also be bypassed or accidentally block legitimate hostnames like `10.com` or `127.example.com`.
The `10.com` case is actually blocked, which is a false positive!

Wait, `10.example.com` would NOT start with `10.`?
If the hostname is `10.example.com`, `startsWith('10.')` is `true`. So valid domains like `10.example.com` are blocked!

I need to fix the SSRF protection in `src/worker/lib/url-metadata-extractor.ts` to be more robust.

2. **Fix `src/worker/lib/url-metadata-extractor.ts`**:
Update `validateAndSanitizeUrl` function's check.
Replace it with robust regular expressions that correctly identify private IPv4 and IPv6 addresses, as well as the AWS metadata IP `169.254.169.254`, and check for exact matches rather than `startsWith`.

3. **Verify Fix**:
Use a local script to verify the regex.
Run the test suite `pnpm test`.

4. **Document**:
Update `.jules/sentinel.md` with the learning about SSRF regex bypasses and false positives.

5. **Pre-commit**:
Run pre commit steps.

6. **Submit**:
Create PR.
