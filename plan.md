1. **Optimize `getStatistics` in `src/worker/lib/search-history-manager.ts`**
   - The current implementation iterates over the history using `forEach` and compares `Date` objects directly. Date comparison creates implicit `.valueOf()` or `.getTime()` calls for every comparison.
   - Using `getTime()` on the threshold dates just once, and calling `.getTime()` on the `safeDate` result prevents redundant method calls and object comparisons.
   - Refactor `getStatistics` to use primitive number comparisons.
2. **Verify changes and run tests**
   - Run `npx vitest run src/tests/search-history-manager.test.ts`
   - Run `pnpm test` and `pnpm lint` to ensure no functionality is broken.
3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
4. **Submit PR**
   - Title: `⚡ Bolt: Optimize Date comparisons in getStatistics`
   - Description matching Bolt's format.
