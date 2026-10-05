## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-10-05 - Redundant Array Traversals in getConcernStatistics
**Learning:** Performing nested/repeated `.filter().length` operations over an entire array multiple times (e.g., inside `Object.values(enum).forEach`) leads to $O(N \times (C + S))$ time complexity, which causes unnecessary CPU overhead.
**Action:** Consolidate multiple statistics and breakdown calculations (by status, category, severity) into a single $O(N)$ pass over the data array.
