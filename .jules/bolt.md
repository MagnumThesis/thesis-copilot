## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2024-08-17 - Consolidate Multiple Filter Operations in React Render
**Learning:** Making multiple `.filter().length` calls inside a component's render function or hook block results in O(kN) operations, which becomes a bottleneck on every render for large arrays.
**Action:** Consolidate array traversals into a single pass using a loop or `.reduce()` inside a `useMemo` block to compute grouped statistics in O(N) time.

## 2024-08-17 - Avoid Object.values() for TypeScript Enums/Types in Runtime
**Learning:** Using `Object.values(SomeType)` to initialize records when `SomeType` might be a TypeScript type/interface rather than a runtime object (like an enum) will cause a fatal `ReferenceError` at runtime, crashing the application.
**Action:** Do not use `Object.values()` to iterate over TypeScript types. Instead, rely on runtime values (like the elements of the array being processed) or initialize the object incrementally inside the iteration loop (e.g., using logical OR `stats[key] = (stats[key] || 0) + 1`).
