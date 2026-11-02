## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-11-02 - Mutating Cache with Array.sort()
**Learning:** Calling `.sort()` directly on a cached array returned from a `Map.get()` mutates the underlying cache in place. If this is done in a method like `getSearchHistory`, the cached history becomes permanently sorted, which could cause bugs if other parts of the system expect chronologically appended order or if multiple sorts conflict. Also, multiple `.sort()` calls for extremal values (like most recent date) is O(N log N) when it can be found in O(N).
**Action:** Use array spreading `[...arr]` or `Array.from()` to create a shallow copy before sorting, or use a single O(N) pass loop (like `reduce` or `forEach`) to find extremums without sorting or mutating the original cached array.
