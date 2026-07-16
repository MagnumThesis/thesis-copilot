## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-05-18 - Single-Pass Statistics Calculation
**Learning:** Calculating grouped statistics via multiple chained `.filter(condition).length` calls on a large array (like search results or user actions) requires redundant array traversals, resulting in O(kN) time complexity and unnecessary memory allocations for intermediate arrays.
**Action:** Consolidate multiple metrics calculations into a single-pass `for` loop to reduce time complexity to O(N) and avoid allocating throwaway arrays, especially in high-traffic aggregation functions like `getConversionMetrics`.
