## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2026-09-04 - O(kN) Array Filter Chaining in React Renders
**Learning:** Chaining `.filter().length` calls for computing statistical counts across multiple categorical states (status, category, severity) within a React component body triggers redundant O(N) traversals on every render, resulting in an O(kN) bottleneck (where N=items, k=filter options).
**Action:** When calculating grouped counts/statistics, always consolidate the array traversal into a single-pass `reduce()` iteration and cache the computed frequency maps using `useMemo` to downgrade the complexity to O(N).
