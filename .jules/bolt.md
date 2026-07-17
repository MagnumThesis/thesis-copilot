## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-07-17 - Array filtering traversal overhead
**Learning:** In highly nested or complex statistical calculation functions (like `getConcernStatistics`), using multiple `.filter(c => c.status === ...).length` calls within a `.forEach` loop over an enum creates an O(k*N) complexity bottleneck, where it iterates over the entire `concerns` array dozens of times redundantly.
**Action:** Always replace chained/multiple `.filter().length` calculations on the same array with a single-pass `for` loop that accumulates all necessary tallies simultaneously in a dictionary/object structure, reducing time complexity to O(N).
