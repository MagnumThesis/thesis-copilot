## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-05-18 - Single-Pass Loop Optimization for Statistics
**Learning:** Performing multiple consecutive `.filter().length` operations on identical arrays for dimensional grouping (e.g., by status, category, or severity in `ConcernList`) leads to O(D*V*N) time complexity and redundant traversals.
**Action:** Replace multiple filter traversals with a single O(N) loop (using `forEach` or `reduce`) wrapped in a `useMemo` block that tallies all dimensions concurrently using pre-initialized objects. Then return `O(1)` lookups from the memoized object.
