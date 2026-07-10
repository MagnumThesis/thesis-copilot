1. **Consolidate array traversals in `getConversionMetrics` in `src/worker/lib/search-analytics-manager.ts`**:
   - Replace the multiple `.filter().length` and `.reduce()` operations with a single `for` loop to compute `totalResults`, `resultsViewed`, `resultsAdded`, and `resultsRejected`.
   - This prevents redundant array traversals and reduces time complexity.

2. **Consolidate array traversals in `getSearchAnalytics` in `src/worker/lib/search-analytics-manager.ts`**:
   - Replace the `.filter().length` and multiple `.reduce()` operations with a single `for` loop to compute `successfulSearches`, `totalResultsCount` (for `avgResults`), and `totalProcessingTime` (for `avgProcessingTime`).
   - This ensures each session is processed only once, optimizing performance.

3. **Verify Changes**:
   - Run `pnpm lint` and `pnpm test src/tests/search-analytics-manager.test.ts` to ensure everything works fine.

4. **Complete Pre-Commit Steps**:
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

5. **Submit**:
   - Create a PR with title `⚡ Bolt: Optimize SearchAnalyticsManager performance` and appropriate descriptive sections.
