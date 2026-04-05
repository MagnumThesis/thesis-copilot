## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-05-24 - Single Pass Optimization over Chained Array Methods
**Learning:** The codebase previously contained an anti-pattern in statistics aggregation where multiple `.filter(...).length` statements were used inside loops. This caused O(N*M) time complexity as well as high memory allocations for temporary arrays.
**Action:** When calculating statistics across multiple dimensions (e.g., severity, category, status), always use a single-pass `reduce` or `for...of` loop with pre-initialized accumulator objects to ensure O(N) traversal.
