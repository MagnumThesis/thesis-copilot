## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-10-08 - Object Instantiation and Date Evaluation in Loops
**Learning:** Calling functions that return objects inside loops (like `safeDate`) and implicitly triggering `.valueOf()` or `.getTime()` during array iteration methods like `forEach` adds massive overhead.
**Action:** When filtering objects by `Date` conditions in a tight loop, pre-calculate the primitive time values (using `.getTime()`) outside the loop, use a standard `for` loop, and compare numeric values rather than `Date` objects to eliminate unnecessary closure and object allocation overhead.
