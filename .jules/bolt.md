## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-06-25 - Redundant Traversals in Proofreading Stats
**Learning:** In handlers processing datasets (like `generateConcernStatistics`), performing multiple `.filter().length` calculations across numerous enum combinations (e.g., categories and severities) creates $O(C \times N + S \times N)$ operations, degrading performance linearly as enums grow.
**Action:** When computing multi-dimensional grouped statistics, always initialize accumulator objects/maps and iterate exactly once $O(N)$ using a single loop to increment the respective counters.
