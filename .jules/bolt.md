## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2024-05-19 - Replacing N+1 DB Queries Inside Promise.all with D1/SQLite Window Functions
**Learning:** Found a performance bottleneck where \`Promise.all(...map(...))\` was used to execute N queries against Cloudflare D1/SQLite to fetch related data (e.g., top 3 search results for each query). This pattern causes network overhead and performance drops.
**Action:** Instead of N+1 sequential/parallel queries, optimized it by writing a single SQL query utilizing the \`ROW_NUMBER() OVER(PARTITION BY ... ORDER BY ...)\` window function. This retrieves and ranks the data globally, which is then mapped in memory using a \`Map\` lookup, improving performance significantly by avoiding multiple round trips.
