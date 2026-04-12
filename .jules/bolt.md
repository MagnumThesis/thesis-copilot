## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2025-04-12 - N+1 Query Fix using SQLite Window Functions
**Learning:** Cloudflare D1 / SQLite often execute loops containing `DB.prepare().all()` sequentially (e.g. inside `Promise.all` + `map`), causing severe N+1 bottlenecks.
**Action:** Replace `Promise.all` `.map` database calls over collections with a single batched SQL query using `IN (...)` and a window function like `ROW_NUMBER() OVER(PARTITION BY ...)` to fetch and group top items per related row safely and in one roundtrip. Always explicitly set `ORDER BY` to maintain output predictability.
