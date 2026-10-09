## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-10-09 - Avoid redundant array traversals and in-place sorting
**Learning:** `SearchHistoryManager` performed multiple passes over the `userHistory` array (e.g. `filter`, `forEach`, `reduce`, `sort`) and used an in-place sort with expensive O(N log N) `safeDate` parsing. This causes redundant calculations and accidental mutations.
**Action:** Always consolidate multiple array passes into a single loop when aggregating statistics. Avoid sorting an entire array when only the maximum/minimum value is needed; instead, track it during the single traversal.
