## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2025-02-28 - Optimizing grouped statistics operations
**Learning:** Identified a performance bottleneck where grouped statistics over an array (e.g., tallying user actions or concern statuses) were calculated using chained multiple `.filter().length` calls inside `forEach` loops, leading to O(kN) redundant traversals.
**Action:** Replaced chained `.filter().length` operations with single-pass `for` loops for calculating concern statistics, improving time complexity from O(kN) to O(N) and significantly reducing redundant iterations.
