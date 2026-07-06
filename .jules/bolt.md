## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation leads to O(kN) time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single O(N) pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each transformation is performed exactly once per element.
When rewriting array property checks (`if (c.property)`), make sure to explicitly check for `undefined` if the property could be an enum or a falsy value (e.g. `0` or `""`), so that it isn't skipped.
