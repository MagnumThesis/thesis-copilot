## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2026-08-25 - Redundant Array Traversals in filtering options lists
**Learning:** React elements utilizing numerous sequential loops via `.filter().length` repeatedly inside child elements rendering dynamic options lists caused a performance drag where arrays of items were needlessly traversed generating massive overhead up to O(kN).
**Action:** Replace sequential `.filter().length` functions calculating individual tallies with a central O(N) iteration populating a dictionary, returning pre-computed key counts, and memoizing the result with `useMemo`.
