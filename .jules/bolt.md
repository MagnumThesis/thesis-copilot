## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-10-22 - Redundant Array Traversals in Concern Statistics
**Learning:** Performing multiple consecutive `.filter().length` operations inside of `forEach` loops over categories and severities (like in `getConcernStatistics`) leads to O(K*N) time complexity where K is the number of categories/severities and N is the number of items. This causes severe performance degradation for large datasets.
**Action:** Replace multiple nested filtering operations with a single O(N) pass (`for` loop or `forEach`) over the data array. Pre-initialize tracking objects and increment the necessary counts (overall, category-specific, and severity-specific) during that single traversal to minimize execution time and CPU overhead.
