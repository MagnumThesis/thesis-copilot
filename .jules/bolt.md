## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-05-19 - Redundant Array Traversals in Stats Calculation
**Learning:** Avoid using multiple consecutive `.filter().length` operations on an array to calculate statistics, as it leads to O(k*N) complexity. Furthermore, avoid defining filter logic that repeats in loops without memoization as that leads to O(N*M) where N is the items and M is the categories/filters.
**Action:** Replace multiple multiple `.filter().length` with single loop and accumulate counters via `useMemo`.
