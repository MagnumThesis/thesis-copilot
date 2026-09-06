## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2026-09-06 - O(kN) Filter Anti-pattern in ConcernList
**Learning:** Found a severe performance anti-pattern in the codebase where grouped statistics over arrays (e.g., tallying different Concern categories) are calculated by chaining multiple `.filter().length` calls directly inside render functions, resulting in O(kN) re-computations on every render.
**Action:** Avoid this anti-pattern. Instead, consolidate the logic into a single-pass `for` loop or `.reduce()` iteration and cache the result using `useMemo` to reduce time complexity to O(N). When building stats records dynamically, avoid `Object.values(Type)` initialization and build incrementally to prevent crashes.
