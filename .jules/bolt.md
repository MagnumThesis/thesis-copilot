## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-19 - Supabase N+1 Queries during Analytics Insert
**Learning:** Iterating over arrays (like search results) and performing individual `supabase.from('table').insert()` operations causes severe N+1 query bottlenecks in Cloudflare Workers.
**Action:** Always map the data array beforehand with pre-generated UUIDs and use a single `supabase.from('table').insert(arrayOfRecords)` call for bulk insertions.
