## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-06-29 - O(N) Array Reductions in generateConcernStatistics
**Learning:** Performing multiple `.filter().length` chains on an array (e.g., inside loops iterating over categories or severities) creates `O(k * N)` time complexity and redundant array processing, which scales poorly for large datasets.
**Action:** Consolidate array statistics calculations into a single `O(N)` pass using a single loop (`for` or `forEach`), ensuring that each array element is processed exactly once to derive all necessary aggregate statistics.
