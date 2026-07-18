1. **Optimize `getTrackingStats` in `src/hooks/useSearchAnalytics.ts`**
   - The current implementation iterates through the `tracking` array multiple times using `.filter().length` (4 times total for `viewed`, `added`, `rejected`, `bookmarked`).
   - I will refactor this to use a single `reduce` pass over the `tracking` array, reducing the time complexity from O(4N) to O(N).
2. **Verify changes**
   - Run `pnpm test useSearchAnalytics.test.ts` to ensure the hook's behavior remains identical.
3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
4. **Submit PR**
   - Title: "⚡ Bolt: [performance improvement]"
