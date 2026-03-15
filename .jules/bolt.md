## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2024-03-15 - Supabase Bulk Insert Optimization
**Learning:** Running `supabase.from(...).insert(...)` inside a `for` loop or `Promise.all` for multiple records creates an N+1 query problem, severely blocking the Cloudflare Worker and introducing high database latency.
**Action:** Always combine array operations into a single Supabase query using `.insert([...arrayData])` natively. Ensure unique IDs are generated for each record (e.g., using `crypto.randomUUID()`) during the mapping phase.
