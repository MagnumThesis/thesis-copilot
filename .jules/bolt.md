## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-10-20 - Redundant Array Traversals in ConcernStatusManager
**Learning:** Using multiple consecutive `.filter().length` operations to calculate counts across different categories (e.g., status, severity, category) on a single array results in an $O(K \times N)$ time complexity, where $N$ is the array length and $K$ is the number of distinct filters applied.
**Action:** When gathering multiple distinct metrics or breakdowns from a single array, use a single $O(N)$ traversal (e.g., a `for...of` loop or `reduce`) to populate all count dictionaries and aggregate variables simultaneously, minimizing iterations.
