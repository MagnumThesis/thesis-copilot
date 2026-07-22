## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2026-11-20 - Redundant Filter Operations for Enumerated Stats
**Learning:** Calculating categorical statistics by repeating `.filter(...).length` across different enumerations (e.g., ConcernCategory, ConcernSeverity, ConcernStatus) results in an inefficient O(k*N) complexity. Although not always visible on small arrays, on server workloads analyzing large datasets this unnecessarily consumes CPU cycles.
**Action:** When calculating grouped or aggregated statistics on an array of objects based on enums/categories, replace chained `.filter().length` expressions with a single-pass loop (e.g. `for` or `reduce`) that increments counts in a pre-allocated object. This transforms the operation from O(k*N) to O(N).
