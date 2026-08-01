## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2025-02-15 - Replace Multiple Array Filter Length Calls with Single-Pass Loop
**Learning:** Chaining `.filter().length` in a sequence for different conditions (especially inside `.forEach` loops) creates significant overhead because it processes the entire array repeatedly. In TypeScript/JavaScript, consolidating these into a single O(N) loop dramatically improves performance, converting O(kN) time complexity to O(N).
**Action:** When calculating grouped statistics over an array (like tallying user actions or statuses by category), look out for chained or repeated `.filter().length` statements. Optimize by replacing them with a single-pass `for` loop that categorizes elements incrementally.
