## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-04-16 - N+1 Bottleneck in Cloudflare D1
**Learning:** Resolving N+1 query bottlenecks in SQLite/Cloudflare D1 by fetching dynamically batched arrays requires explicitly guarding the resulting `IN()` clause. An empty batch will crash the SQL parser due to empty placeholders `IN ()`.
**Action:** Always include an early return check (e.g., `if (results.length === 0) return []`) before constructing the `IN()` clause strings and placeholders.
