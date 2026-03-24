## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## $(date +%Y-%m-%d) - Single-pass Iteration Over Multiple Filters
**Learning:** Found an anti-pattern in `src/worker/lib/concern-status-manager.ts` where we iterated multiple times over a potentially large array of concerns via chained `filter(c => ...).length` inside `Object.values(Category).forEach` resulting in an O(N * (Categories + Severities)) time complexity. This is particularly problematic for performance when N grows large.
**Action:** When aggregating multi-dimensional counts or statistics, refactor to process the array precisely once (`for (const c of concerns)`) and calculate all required metrics (categories, severities, overall statuses) during that single pass to reduce complexity strictly to O(N).
