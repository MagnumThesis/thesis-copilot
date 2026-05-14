1. **Optimize concern statistics calculations in `src/components/ui/concern-list.tsx`**
   - Replace the multiple O(N) array traversals (`concerns.filter(c => ...).length`) in `getStatusCount`, `getCategoryCount`, and `getSeverityCount` with a single `useMemo` block that calculates all counts in one pass over the `concerns` array.
   - This prevents redundant O(D*N) traversals on every render, solving the problem mentioned in `.jules/bolt.md`.
2. **Update the count functions**
   - Refactor `getStatusCount`, `getCategoryCount`, and `getSeverityCount` to simply look up the pre-calculated counts from the memoized object in O(1) time instead of recalculating via `filter`.
3. **Run Lint and Test Commands**
   - Execute `pnpm run lint` and `bun test src/tests/concern-list.test.tsx` (or the nearest related test suite) to ensure nothing was broken.
4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Run the pre commit instructions and document performance impact in `.jules/bolt.md`.
