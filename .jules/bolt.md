## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2025-02-23 - Avoid In-Place Sort on Cached Arrays
**Learning:** Directly calling `.sort()` on arrays retrieved from a memory cache (like a Map) mutates the cached array in place. This can cause unintended side effects across the application and degrades performance when repeatedly sorting large histories O(N log N) instead of finding extremums in O(N).
**Action:** Always copy cached arrays (e.g., using `[...cachedArray]`) before sorting, or use a single O(N) `.reduce()` pass when only the maximum/minimum value (like latest date) is needed.
