## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-05-14 - Optimize Cloudflare D1 N+1 queries using ROW_NUMBER()
**Learning:** Using `Promise.all(rows.map(async () => db.prepare(query).all()))` inside Cloudflare D1 handlers causes severe N+1 bottleneck and performance degradation, especially when fetching nested details like top results per query.
**Action:** Replace `Promise.all` `.map` DB loops with a single query using `ROW_NUMBER() OVER(PARTITION BY parent_id ORDER BY sorting_field) as rn` where `rn <= N`, and map the results efficiently in memory. Always add an early return `if (rows.length === 0)` to prevent SQL syntax errors from empty `IN ()` clauses.
