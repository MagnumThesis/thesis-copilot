## 2024-03-09 - AppSidebar Unnecessary Recalculations
**Learning:** React sidebars that manage their own local state (like editing states) and also filter parent-provided arrays (like `items`) must memoize the filtering operation, otherwise every local state change triggers an O(N) recalculation.
**Action:** Always wrap array filtering and derived object creation in `useMemo` when they depend on props in a component that frequently re-renders due to unrelated local state changes.

## 2026-03-22 - Redundant Array Traversals in getStatistics
**Learning:** Performing multiple consecutive `.filter().length` operations on an array of objects where each filter condition involves an expensive operation (like `safeDate` parsing) leads to (kN)$ time complexity and redundant processing.
**Action:** Consolidate multiple statistics calculations into a single (N)$ pass using a single loop (e.g., `forEach` or `reduce`). This minimizes traversals and ensures each expensive transformation (like date parsing) is performed exactly once per element.
## 2024-05-18 - Avoid breaking package.json for test environment
**Learning:** Adding new runtime dependencies like \`sqlite3\` directly to \`package.json\` in order to run isolated test scripts can break the Cloudflare worker build and cause CI failures. The worker environment relies on \`@cloudflare/workers-types\` or specific bindings instead.
**Action:** Never add dependencies to \`package.json\` just for scratchpad scripts; instead, either mock the behavior, run the existing unit tests with \`bun test\`, or clean up test scripts without saving them to the lockfile.
