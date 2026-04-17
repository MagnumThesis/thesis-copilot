## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-04-17 - N+1 Queries in Promise.all loops
**Learning:** Using `Promise.all(array.map(...))` to execute N database queries (e.g., fetching top results for N search queries) creates an N+1 bottleneck, consuming excess database connections and increasing latency.
**Action:** Replace N+1 queries by executing a single batched query using `IN (...)` with window functions like `ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)` to group and filter results in SQL, then reconstruct the map in memory. Always ensure an early return for empty result sets to prevent SQL syntax errors from empty `IN ()` clauses.
