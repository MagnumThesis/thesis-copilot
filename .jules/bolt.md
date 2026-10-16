## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-10-16 - Redundant Array Traversals in getConcernStatistics
**Learning:** Computing grouped statistics (e.g., grouping by category and severity and calculating statuses for each group) using multiple chained `.filter().length` calls results in O(k * N) time complexity where k is the number of permutations. In `getConcernStatistics`, there were over 30 full array traversals for each analysis.
**Action:** Replace multiple independent `.filter().length` array traversals with a single `for...of` loop that accumulates all groupings and sub-groupings in O(N) time complexity to drastically reduce computation overhead, especially when there are many permutations (e.g., categories * statuses).
