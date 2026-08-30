## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-08-30 - Single Pass Aggregation Performance Win
**Learning:** Chaining multiple `.filter().length` calls for total calculations, category-based statistics, and severity-based statistics requires O(N + C*N + S*N) traversals over the array, causing unnecessary multiple O(N) loops. This can be significantly optimized into a single O(N) pass.
**Action:** When calculating grouped statistics over an array (e.g., tallying different user actions), avoid chaining multiple `.filter().length` calls. Instead, consolidate the logic into a single-pass `for` loop or `.reduce()` iteration to reduce redundant traversals and improve time complexity from O(kN) to O(N). Also avoid using `Object.values(SomeType)` to initialize records if `SomeType` might be a TypeScript type, interface, or union rather than a runtime enum.
