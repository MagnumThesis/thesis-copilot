1. **Refactor `getConcernStatistics` in `src/worker/lib/concern-status-manager.ts` to use a single-pass loop.**
   - Currently, the `getConcernStatistics` method uses multiple `Array.prototype.filter()` calls to calculate statistics for concerns.
   - For an array of size $N$ with $C$ categories and $S$ severities, the time complexity is proportional to $O(N \cdot (C + S))$.
   - I will refactor the code to use a single `.reduce()` or `.forEach()` loop to accumulate all the counts in $O(N)$ time.
   - I will pre-initialize the accumulator records (`concernsByCategory`, `concernsBySeverity`, `byCategory`, `bySeverity`, etc.) to $0$ and then iterate through the concerns to tally them.

2. **Run tests to verify the optimization.**
   - Execute the test suite (via `pnpm test` or specific file path) to ensure `getConcernStatistics` still functions correctly after the refactor.
   - Run `pnpm lint` to check for formatting or style issues.

3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Follow instructions from the `pre_commit_instructions` tool.

4. **Submit a Pull Request with the changes.**
   - Format the title as `⚡ Bolt: [performance improvement]`.
   - Update `.jules/bolt.md` if any critical learning is made, as required by the Bolt persona context. However, my previous reading of `.jules/bolt.md` already contains an entry titled "2026-03-22 - Redundant Array Traversals in getStatistics" addressing this specific issue, so I might not need to add a *new* learning, but rather just apply the action. Wait, I should add a learning if I found it. But it seems the instruction is to ONLY journal *critical* learnings. This is a standard optimization, but I'll make sure to follow the formatting rule for the PR.
