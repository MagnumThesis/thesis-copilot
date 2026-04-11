## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-03-22 - N+1 bottlenecks in SQLite/D1 Analytics Queries
**Learning:** Performing database queries inside a `.map` loop wrapped in `Promise.all` (N+1 query problem) for fetching related rows causes significant latency over remote execution environments like Cloudflare D1.
**Action:** Always replace `Promise.all` `.map` database queries with a single query utilizing `IN (...)` with window functions like `ROW_NUMBER() OVER(PARTITION BY ...)` to group, sort, and limit data for all items in a single DB roundtrip.
