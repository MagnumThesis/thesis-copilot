## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2024-06-18 - [Fix N+1 query issue for Search Results Analytics]
**Learning:** In Cloudflare Workers using Supabase, calling single row inserts in a `Promise.all` or sequential loop creates a severe N+1 query issue, leading to poor performance and unnecessary network round trips when recording search results for analytics.
**Action:** Always implement and use bulk insert methods (like `recordSearchResults`) that utilize `supabase.from('table').insert(arrayOfRecords)` to insert all records in a single database round trip.
