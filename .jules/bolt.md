## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-03-24 - O(14N) Array Traversals in Concern Status Statistics
**Learning:** Calculating category and severity breakdowns by filtering the main concerns array repeatedly inside `Object.values(Enum).forEach` loops results in roughly O(E * N) complexity (where E is number of enum values and N is number of items), creating unnecessary performance overhead.
**Action:** Replace multiple `.filter().length` array passes with a single O(N) loop that calculates all necessary status, category, and severity counts simultaneously by checking each item's properties once.
