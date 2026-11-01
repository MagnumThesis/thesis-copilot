## 2026-11-01 - Avoid sorting cached arrays directly
**Learning:** In `src/worker/lib/search-history-manager.ts` and similar structures, `Map.get()` returns a reference to an array. Directly calling `.sort()` on this cached array (e.g., `userHistory.sort()`) mutates the array in-place, changing the underlying cache order and potentially leading to bugs in other operations that depend on the original order.
**Action:** Always copy the array first (using `[...array]` or `Array.from(array)`) before calling `.sort()` when working with data retrieved from a cache, or use a single O(N) pass to find extremums without sorting.

## 2026-11-01 - Avoid sorting cached arrays directly
**Learning:** In `src/worker/lib/search-history-manager.ts` and similar structures, `Map.get()` returns a reference to an array. Directly calling `.sort()` on this cached array (e.g., `userHistory.sort()`) mutates the array in-place, changing the underlying cache order and potentially leading to bugs in other operations that depend on the original order.
**Action:** Always copy the array first (using `[...array]` or `Array.from(array)`) before calling `.sort()` when working with data retrieved from a cache, or use a single O(N) pass to find extremums without sorting.
