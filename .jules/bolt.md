## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-09-10 - O(k*N) iteration antipattern
**Learning:** Generating statistics (e.g., breakdown by Category and Severity) by looping through enumerations and doing multiple `array.filter(condition).length` traversals causes O(k*N) operations. When generating concern breakdown statistics in `proofreader-ai.ts` and `concern-status-manager.ts`, the code was traversing the concerns array 30+ times.
**Action:** Replace multiple `.filter().length` chains with a single `for...of` or `.reduce()` pass over the array, tallying stats incrementally (e.g. `stats[item.category].total++`). This brings time complexity down to O(N). Ensure objects are pre-initialized for type safety instead of relying on runtime undefined checks.
