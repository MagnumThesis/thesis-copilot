## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-11-04 - Search History O(N) Optimization
**Learning:** Performing multiple `.forEach()` passes and `.sort()` calls on an array of objects to extract metrics (like most active day and favorite source) leads to O(N log N) time complexity and mutates the underlying cache array in place.
**Action:** Consolidate array metrics calculations into a single O(N) pass, avoiding sorts and array mutations. Also use integer index lookups (e.g. `date.getDay()`) instead of string localization (e.g. `date.toLocaleDateString()`) inside large loops to minimize overhead.
