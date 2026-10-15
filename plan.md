1. **Optimize `getConcernStatistics` in `src/worker/lib/concern-status-manager.ts`**
   - The current implementation of `getConcernStatistics` uses multiple `filter()` calls inside `.forEach()` loops, resulting in an O(k*N) complexity (where k is the number of categories + severities + statuses).
   - I will use the `replace_with_git_merge_diff` tool to replace this logic with a single O(N) pass over the `concerns` array that tallies all required statistics simultaneously.

2. **Verify changes using testing tools**
   - Run `pnpm test src/tests/concern-status-manager.test.ts` to ensure the core logic still passes. Note: there are some pre-existing failures in this test related to data mapping, type safety (different enum lengths), and mocked DB operations (Supabase `.delete().eq().eq()`). As instructed by `.jules/bolt.md` guidelines and agent memory, we will just ensure no *new* regressions are introduced by checking the "Statistics Calculation" suite.
   - Run `pnpm lint` to ensure code syntax is valid.

3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Run `pre_commit_instructions` and follow them to review PR text, ensure no unintended dependencies, etc.

4. **Submit PR**
   - Submit the PR with standard title format: `⚡ Bolt: [performance improvement]`
