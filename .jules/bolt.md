## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2023-10-24 - Hoist static sets and reduce array allocations in text-analysis.ts
**Learning:** Inside intensive loops, reallocating `Set` objects and splitting strings on every iteration creates massive memory overhead and blocks the main thread. Hoisting static sets to module scope and avoiding redundant `String.split()` calls drastically improves performance.
**Action:** Always hoist static `Set`, `Map`, or Array initializations to module scope rather than recreating them inside functions that are called frequently.
