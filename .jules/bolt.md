## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2026-09-05 - Avoid Object.values() for TypeScript Enums/Types in Runtime Iterations
**Learning:** When trying to initialize a record object by iterating over a TypeScript type or interface, using `Object.values(SomeType)` will cause a fatal `ReferenceError` at runtime because TypeScript types do not exist in the compiled JavaScript. This can crash the application during render.
**Action:** Always dynamically build record objects incrementally inside the iteration loop (e.g., `stats[key] = (stats[key] || 0) + 1`) rather than trying to pre-initialize keys using `Object.values()` on type definitions.
