## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-05-19 - Redundant Array Traversals in getStatistics (ConcernList)
**Learning:** Performing multiple consecutive `.filter().length` operations on an array (like filtering a large list of `concerns` to count how many there are for each status, category, and severity) during a component's render leads to O(D*V*N) time complexity and redundant processing.
**Action:** Consolidate multiple statistics/tally calculations into a single O(N) pass using a single loop (`forEach` or `reduce`) wrapped in a `useMemo`. This minimizes traversals and avoids expensive recalculations on every render.
