## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2026-09-18 - Single-Pass Loop Optimization in getConcernStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on a large array (like iterating over all combinations of categories and severities for statistics) leads to an O(k*N) time complexity and massive processing overhead.
**Action:** Replace redundant `filter` array traversals with a single O(N) `for` loop that iterates over the elements once and aggregates all necessary category/severity properties into an initialized dictionary in one pass.
