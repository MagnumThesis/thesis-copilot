1. **Optimize concern statistics calculations in `src/components/ui/concern-list.tsx`**
   - Replace multiple `O(N)` `concerns.filter().length` calls inside the render loop with a single `O(N)` `.reduce()` pass wrapped in `useMemo`.
   - Update `getStatusCount`, `getCategoryCount`, and `getSeverityCount` to read from the memoized object.
   - Include the explicit `// ⚡ Bolt: Performance optimization...` comment to explain the O(kN) to O(N) improvement.

2. **Verify Changes**
   - Run the full test suite (`pnpm test`) and lint checks (`pnpm lint`) to ensure the optimization is safe and doesn't break functionality.

3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**

4. **Submit Pull Request**
   - Submit the PR with the branch name `bolt-optimize-concern-list-counts` and title `⚡ Bolt: Optimize concern list statistics calculation`.
   - Use the specific description format required for Bolt containing `💡 What:`, `🎯 Why:`, `📊 Impact:`, and `🔬 Measurement:`.
