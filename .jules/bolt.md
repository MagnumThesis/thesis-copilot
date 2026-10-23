## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2026-10-23 - In-place Array Mutations and O(N log N) Overhead on Cache Objects
**Learning:** Using `.sort()` directly on arrays retrieved from a Map (like `this.history.get(userId)`) mutates the underlying cached array in place. Furthermore, using `.sort()` merely to find the extremum (e.g. latest date) introduces unnecessary O(N log N) overhead.
**Action:** Use `[...array]` or `Array.from(array)` to copy arrays before sorting if they are fetched from a shared cache, or better yet, use a single O(N) pass (like `reduce`) when only finding extremums.
