## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2024-11-13 - Redundant Array Traversals in UI Components
**Learning:** Performing multiple consecutive `.filter().length` operations for UI metrics (like status/category/severity counts in `ConcernList`) on an array of objects leads to O(k*N) time complexity and redundant traversals. This is especially problematic when counts are calculated on every render.
**Action:** Replace multiple `.filter().length` calls with a single O(N) array pass that accumulates all necessary counts in a single object/record. Wrap this pre-calculation in `useMemo` to ensure it only runs when the underlying data changes, avoiding redundant recalculations during UI updates.
