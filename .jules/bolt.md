## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2024-06-25 - React.useMemo import safety
**Learning:** Using hooks like `useMemo` in a file without explicitly verifying or adding the import can cause runtime `ReferenceError` crashes, especially during refactoring where standard hooks might not already be imported.
**Action:** When introducing new hooks to an existing file via `replace_with_git_merge_diff`, always verify the imports at the top of the file or use the namespace-prefixed version (e.g., `React.useMemo`) if `React` is already imported.
