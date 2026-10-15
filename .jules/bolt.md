## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-10-15 - Array Iteration Performance in Statistics Processing
**Learning:** Calculating category/status/severity statistics by running multiple `.filter().length` combinations inside `.forEach` loops creates `O(k * N)` time complexity, triggering hundreds of redundant traversals of the same elements on large collections.
**Action:** Always compute comprehensive metric breakdowns with a single `O(N)` loop (e.g., using `reduce` or `.forEach`) that tracks all aggregations simultaneously, especially when returning dashboard or analytics payload data.
