## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2026-09-03 - Consolidate multiple filter.length calls into a single loop
**Learning:** Calling `.filter().length` multiple times inside a React render function or getter functions used during render causes O(k*N) complexity. Using an object like `Object.values(ConcernCategory)` and assuming it is a runtime array without checking can cause crashes if it's a TypeScript type.
**Action:** Consolidate array traversal into a single pass using a `for` loop or `.reduce()` to tally counts into a plain object, and wrap it in `useMemo` to cache the result, improving time complexity to O(N). Always build the object dynamically inside the iteration instead of relying on TypeScript enums which might not exist at runtime.
