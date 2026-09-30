## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-09-30 - Redundant Array Traversals in UI Formatting
**Learning:** Performing multiple `.filter()` operations on arrays just to group or count items by their `type` leads to redundant O(kN) traversals, even on the frontend. While the array lengths might be smaller than backend datasets, it adds unnecessary overhead during re-renders.
**Action:** When grouping or counting items from a single array based on a discriminator field (like `type`), always use a single loop pass (`for...of` or `reduce`) instead of multiple `.filter()` calls.
