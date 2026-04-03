## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2025-01-30 - Refactor Multi-Dimensional Data Aggregation loops to a single-pass loop
**Learning:** When generating complex analytics across different dimensions (e.g., aggregating counts by status, category, and severity simultaneously), using consecutive `.filter(condition).length` calls within `Object.values(category).forEach` structures creates an `O(N * C + N * S)` algorithmic bottleneck where `N` is items, `C` is categories, and `S` is severities.
**Action:** Always prefer a single-pass `for...of` or `.reduce()` loop over the dataset. Pre-initialize tracking structures, iterate over the data exactly once (e.g., `for (const c of concerns)`), and update all counters/dictionaries inline. Calculate percentages only after the aggregation loop finishes.
