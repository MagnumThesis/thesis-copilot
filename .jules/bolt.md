## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-10-27 - O(N log N) Sorting and Unintended Mutations
**Learning:** Calling `.sort()` on arrays merely to find maximum or minimum values leads to unnecessary O(N log N) computations. Furthermore, since `.sort()` mutates arrays in-place in JavaScript, sorting cached arrays (e.g. from `this.history.get(userId)`) modifies the shared memory state unexpectedly, causing potential bugs.
**Action:** Always use an O(N) pass (e.g., `reduce`, `for` loop, or `Math.max`) to find extremums. If an array must be sorted, explicitly spread it `[...arr]` first to avoid mutating a shared cache.
