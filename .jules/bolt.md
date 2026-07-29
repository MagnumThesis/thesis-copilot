## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-07-29 - Optimize Grouped Statistics in Render Logic
**Learning:** Using multiple chained `.filter(c => c.field === value).length` calls inside render functions or getters creates an O(k * N) bottleneck (where k is the number of enum values). This redundant array traversal can degrade UI performance, especially in list components handling hundreds of elements like `ConcernList`.
**Action:** Always refactor multiple boolean `.filter()` count lookups into a single-pass loop utilizing `useMemo` to tally frequencies into a dictionary/record, which reduces the time complexity to O(N).
