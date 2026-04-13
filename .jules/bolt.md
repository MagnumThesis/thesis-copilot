## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2026-04-10 - N+1 Bottleneck in Cloudflare D1 / SQLite Promise.all Mapping
**Learning:** Resolving N+1 database queries that occur inside `Promise.all` loops where an expensive related query is performed per item (e.g., fetching top 3 results per query string) can be elegantly solved in Cloudflare D1 / SQLite. Using `ROW_NUMBER() OVER(PARTITION BY ...)` allows grouping and limiting the related records across multiple parent entities in a single bulk query with an `IN (...)` clause.
**Action:** When replacing N+1 `.map` loops with a bulk `IN (...)` query, always include an early return check (e.g., `if (results.length === 0) return []`) to prevent SQL syntax errors from attempting to bind an empty parameter list to the `IN` clause.
