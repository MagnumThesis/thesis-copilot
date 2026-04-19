## 2026-04-19 - Consolidating multiple array filters into a single pass
**Learning:** Performing multiple consecutive `.filter().length` operations on an array (e.g. tracking multiple enum-based statuses and categories) leads to O(kN) time complexity and redundant processing.
**Action:** Consolidate these calculations into a single O(N) pass using a reduce initialization followed by a single `for...of` loop to process all statistics simultaneously.
