## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2024-03-16 - Optimize runAutomaticCleanup using Postgres RPC
**Learning:** Performing multiple independent database mutations sequentially or concurrently (via `Promise.all`) in a Cloudflare Worker environment can lead to N+1 query problems, exhausting connection limits, network overhead, and overall slow performance.
**Action:** When performing bulk updates/deletes in Supabase for many users, prefer pushing the iteration/logic into a single Postgres RPC function instead of fetching all records into the Worker and iterating over them with `Promise.all`.
