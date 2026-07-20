## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-07-20 - Consolidating O(K*N) `.filter()` chains into O(N) single-pass loops
**Learning:** I discovered a significant codebase-specific anti-pattern in `concern-status-manager.ts` and `proofreader-ai.ts` where large sets of nested array traversals were taking place to calculate different slices of data. Because `concerns` can theoretically grow quite large, chaining 15+ `.filter(x => ...).length` over the entire array iteratively for each category and severity drastically impacted the overall compute time (creating an $O(k*N)$ bottleneck).
**Action:** When calculating comprehensive summary metrics over arrays, do not use `Array.prototype.filter().length`. Next time, default to single-pass `for` loops (or `reduce`) where all aggregations, categories, and buckets are tallied simultaneously in $O(N)$ time.
