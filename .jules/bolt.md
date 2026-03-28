## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-03-28 - D1 SQLite N+1 Queries in Promise.all map loops
**Learning:** Fetching aggregated "top 3" database records by looping over an array and executing a `LIMIT 3` query for each element inside a `Promise.all` loop causes a massive N+1 query burst. Cloudflare D1 (SQLite) supports window functions, allowing us to combine this logic into a single database round-trip.
**Action:** Replace `Promise.all` inside `.map` loops with a CTE `ROW_NUMBER() OVER(PARTITION BY parent_id ORDER BY score DESC)` query, then map the grouped results back to the original array in memory.