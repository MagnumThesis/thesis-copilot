## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2026-08-29 - Optimize concern statistics calculation from O(k*N) to O(N)
**Learning:** Calculating grouped statistics sequentially over a large array of objects using multiple `.filter().length` calls leads to O(k*N) time complexity and redundant processing.
**Action:** When aggregating multiple statistics (e.g., global, category-specific, and severity-specific counts), consolidate the logic into a single-pass O(N) iteration loop. This minimizes array traversals and significantly reduces processing time, especially for large datasets.
