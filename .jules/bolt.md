## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-05-15 - O(N*M) Multiple traversals in getConcernStatistics
**Learning:** Calculating statistics by iterating through categories and severities, and for each performing a `.filter().length` traversal on the full concerns array results in an O(N*M) bottleneck. In `concern-status-manager.ts`, this was highly inefficient for multiple distinct statuses, categories, and severities combinations.
**Action:** Replace multiple `.filter().length` queries with a single pass (O(N) traversal) over the data array. Initialize counter objects/dictionaries and increment all desired metric intersections during the single loop.
