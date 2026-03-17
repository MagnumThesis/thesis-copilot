## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2024-03-24 - N+1 Promises over Network Boundaries (D1/SQLite)
**Learning:** Using `Promise.all` to execute parameterized SQL queries in a loop creates an N+1 performance bottleneck. In this codebase's architecture (Cloudflare D1), network round-trips for each DB call are exceptionally expensive compared to local SQLite.
**Action:** When fetching related top-N records for multiple entities (e.g. top 3 search results for 20 search queries), replace `Promise.all` loops with a single batched query using Common Table Expressions (CTEs) and the `ROW_NUMBER() OVER (PARTITION BY ...)` window function. Then group the data in memory. This drastically reduces network calls (from N+1 to 2).
