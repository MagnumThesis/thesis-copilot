## 2023-10-25 - Avoid O(N^2) array traversals in statistical aggregations
**Learning:** Performing multiple consecutive `.filter().length` operations on arrays of objects leads to redundant traversals. If an array has `N` items, and we compute properties over `D` dimensions (like status, category, severity), we end up doing multiple passes.
**Action:** Consolidate these calculations into a single O(N) loop that updates all necessary statistical tallies simultaneously using pre-initialized counters.
