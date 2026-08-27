## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-08-27 - Consolidate Redundant Array Filtering
**Learning:** In React components like `ConcernList`, calculating summary statistics by chaining multiple `.filter().length` calls for different categories (status, severity, category) leads to redundant `O(kN)` traversals on every render.
**Action:** Consolidate array statistics aggregation into a single `.reduce()` pass or loop, caching the results via `useMemo` to improve performance to O(N). Ensure objects used for statistics are manually built via string keys rather than blindly referencing TypeScript enums to avoid ReferenceErrors.
