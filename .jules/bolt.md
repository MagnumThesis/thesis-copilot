## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to O(kN) time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single O(N) pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-03-23 - getConcernStatistics performance improvement
**Learning:** By eliminating multiple `.filter(c => ...).length` array traversals and substituting them with one simple `for (const c of concerns)` block, we reduced an O(kN) computation down to a single pass O(N) operation. This also required explicitly initialising empty structs beforehand to make assignments in loops performant.
**Action:** When performing aggregations across multiple groupings of identical data (like finding counts by category, severity, status), always use a single loop to tally all groupings at once instead of separate `.filter().length` passes.
