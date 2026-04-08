## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.

## 2024-03-24 - Resolve N+1 Bottleneck in Query Performance Analytics
**Learning:** Found a major N+1 database query pattern in `src/worker/lib/enhanced-search-history-manager.ts` where fetching top search results for each query involved mapping over a `Promise.all` set of queries for individual `search_query` entries. This scales poorly in Cloudflare D1/SQLite.
**Action:** When resolving N+1 database query bottlenecks within Cloudflare D1 / SQLite (such as those occurring inside `Promise.all` `.map` loops), optimize by executing a single parameterized query utilizing window functions like `ROW_NUMBER() OVER(PARTITION BY ...)` to group and rank results, and process the results into a JavaScript `Map` memory cache for association.
