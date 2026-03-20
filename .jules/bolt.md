## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2025-03-20 - N+1 Query Optimization in Cloudflare D1
**Learning:** Using \`Promise.all\` to iterate over results and dispatch individual queries to Cloudflare D1 (e.g. fetching top 3 results per search query) creates a massive N+1 bottleneck, multiplying network latency across multiple roundtrips to the database. D1 supports advanced SQLite window functions like \`ROW_NUMBER() OVER(PARTITION BY ...)\`, making it entirely possible to batch what would be N queries into a single SQL statement.
**Action:** When fetching related data for a list of items (like "top N results per item"), avoid \`Promise.all\` loops with database queries. Instead, aggregate the IDs, use a \`IN (...)\` clause, and rely on CTEs with \`ROW_NUMBER()\` to group and limit the results in one database call.
