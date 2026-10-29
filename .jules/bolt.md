## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2026-10-29 - Array.prototype.sort() Mutates Cached Arrays In-Place
**Learning:** In JavaScript, calling `.sort()` on an array retrieved directly from an in-memory Map mutates the underlying cached data in-place. Additionally, sorting a full array just to find an extremum (like the latest date via `.sort()[0]`) is computationally wasteful (O(N log N) instead of O(N)).
**Action:** Always use spread syntax (`[...array].sort()`) or `Array.from()` before sorting cached data. For finding extremums, use O(N) operations like `.reduce()` or a single-pass loop instead of sorting.
