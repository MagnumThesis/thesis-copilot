## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2024-05-18 - Eliminating N+1 database queries with Window Functions
**Learning:** In Cloudflare D1 / SQLite environments, executing sequential database queries within a \`Promise.all(...\map())\` loop introduces a significant N+1 performance bottleneck that blocks backend thread resolution.
**Action:** When gathering nested top-N relationships for a set of items, always utilize window functions like \`ROW_NUMBER() OVER(PARTITION BY ...)\` to group, rank, and fetch results in a single consolidated database query, matching by a grouped identifier like \`IN (?)\`.
