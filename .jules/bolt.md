## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2025-02-12 - Fixing hidden cache mutations in sorting
**Learning:** Calling `.sort()` on arrays fetched directly from a Map (e.g. `const userHistory = this.history.get(userId) || []; return userHistory.sort(...)`) mutates the cached array internally due to JavaScript's in-place array sorting. This led to accidental reorderings that corrupted the chronological sequence of elements across repeated reads. Also, doing O(N log N) sorts just to find a single extremum (e.g. the maximum date) is unnecessary work when a simple O(N) `reduce` pass is faster.
**Action:** Always use a shallow copy `[...array].sort()` when returning or sorting an internal cache array. Avoid `.sort()` entirely if you only need the min/max element; use `.reduce()` instead for O(N) time complexity.
