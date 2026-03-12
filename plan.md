1. **Optimize `getQueryPerformanceAnalytics` in `EnhancedSearchHistoryManager`**
   - The current implementation has an N+1 query problem where it first fetches up to 20 grouped search queries and then fires a separate database query to fetch top results for *each* query.
   - Using window functions (`ROW_NUMBER()`) or combining the query using a join, we can fetch all the top results in a single database round trip, removing the `Promise.all` loop and improving backend performance.
2. **Pre-commit Steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
3. **Submit**
   - Submit the performance improvement as a PR titled "⚡ Bolt: Resolve N+1 query in query performance analytics".
