1. **Add `aria-label` to buttons without text content in `src/components/ui/reference-detail.tsx`**:
   - `Close button` in the header (lines 333-339) -> `aria-label="Close"`
   - `DOI External link button` (lines 443-450) -> `aria-label="Open DOI link"`
   - `URL External link button` (lines 467-474) -> `aria-label="Open external link"`
   - `Remove tag button` (lines 503-508) -> `aria-label={`Remove tag ${tag}`}`
   - `Add tag button` (lines 526-528) -> `aria-label="Add tag"`
   - `Copy citation button` (lines 567-574) -> `aria-label="Copy citation"`

2. **Run tests**:
   - Run `pnpm test src/tests/reference-detail.test.tsx` to ensure tests still pass.

3. **Pre-commit checks**:
   - Complete pre-commit steps to make sure proper testing, verifications, reviews and reflections are done.

4. **Create PR**:
   - Create PR with title `🎨 Palette: Improve accessibility in ReferenceDetail component`
