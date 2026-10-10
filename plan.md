1. Modify `formatAttachedItemsContext` in `src/react-app/pages/Chatbot.tsx`
   - Refactor to use a single loop to group items by type instead of four separate `.filter()` calls. This eliminates redundant array traversals and prevents O(N) performance degradation with a large number of items.

2. Modify `formatAttachedItemsSummary` in `src/react-app/pages/Chatbot.tsx`
   - Refactor to use a single loop to count items by type instead of four separate `.filter()` calls.

3. Complete pre commit steps
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

4. Submit the change
   - Submit the PR with the performance optimization for array traversals.
