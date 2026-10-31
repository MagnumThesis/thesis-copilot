1. Modify `src/worker/lib/search-history-manager.ts` using `replace_with_git_merge_diff` to avoid in-place sorting mutation of the cached array in `getSearchHistory`.
```diff
<<<<<<< SEARCH
  async getSearchHistory(userId: string, limit: number = 50): Promise<SearchHistoryItem[]> {
    const userHistory = this.history.get(userId) || [];
    return userHistory
      .sort((a, b) => {
        const aTime = safeDate(a.timestamp)?.getTime() ?? 0;
        const bTime = safeDate(b.timestamp)?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }
=======
  async getSearchHistory(userId: string, limit: number = 50): Promise<SearchHistoryItem[]> {
    const userHistory = this.history.get(userId) || [];
    // ⚡ Bolt: Prevent in-place array mutation of the cache by copying before sort
    return [...userHistory]
      .sort((a, b) => {
        const aTime = safeDate(a.timestamp)?.getTime() ?? 0;
        const bTime = safeDate(b.timestamp)?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  }
>>>>>>> REPLACE
```

2. Verify changes in `src/worker/lib/search-history-manager.ts` using `sed -n '50,65p' src/worker/lib/search-history-manager.ts`

3. Modify `src/worker/lib/search-history-manager.ts` using `replace_with_git_merge_diff` to avoid in-place sorting mutation of the cached array in `getRecentSearches`.
```diff
<<<<<<< SEARCH
  async getRecentSearches(userId: string, hours: number = 24): Promise<SearchHistoryItem[]> {
    const userHistory = this.history.get(userId) || [];
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    return userHistory
      .filter(item => {
        const timestamp = safeDate(item.timestamp);
        return timestamp && item.timestamp >= cutoff;
      })
      .sort((a, b) => {
        const aTime = safeDate(a.timestamp)?.getTime() || 0;
        const bTime = safeDate(b.timestamp)?.getTime() || 0;
        return bTime - aTime;
      });
  }
=======
  async getRecentSearches(userId: string, hours: number = 24): Promise<SearchHistoryItem[]> {
    const userHistory = this.history.get(userId) || [];
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    // ⚡ Bolt: Prevent in-place array mutation of the cache by filtering (which creates a new array) and then sorting
    return userHistory
      .filter(item => {
        const timestamp = safeDate(item.timestamp);
        return timestamp && item.timestamp >= cutoff;
      })
      .sort((a, b) => {
        const aTime = safeDate(a.timestamp)?.getTime() || 0;
        const bTime = safeDate(b.timestamp)?.getTime() || 0;
        return bTime - aTime;
      });
  }
>>>>>>> REPLACE
```

4. Verify changes in `src/worker/lib/search-history-manager.ts` using `sed -n '235,260p' src/worker/lib/search-history-manager.ts`

5. Modify `src/worker/lib/search-history-manager.ts` using `replace_with_git_merge_diff` to optimize finding the most recent search in `getActivitySummary`.
```diff
<<<<<<< SEARCH
    const lastSearchDate = userHistory
      .sort((a, b) => {
        const aTime = safeDate(a.timestamp)?.getTime() ?? 0;
        const bTime = safeDate(b.timestamp)?.getTime() ?? 0;
        return bTime - aTime;
      })[0].timestamp;
=======
    // ⚡ Bolt: Replace O(N log N) sort with O(N) reduce pass to find extremum without mutating cache
    const lastSearchDate = userHistory.reduce((latest, current) => {
      const latestTime = safeDate(latest.timestamp)?.getTime() ?? 0;
      const currentTime = safeDate(current.timestamp)?.getTime() ?? 0;
      return currentTime > latestTime ? current : latest;
    }).timestamp;
>>>>>>> REPLACE
```

6. Verify changes in `src/worker/lib/search-history-manager.ts` using `sed -n '370,395p' src/worker/lib/search-history-manager.ts`

7. Run tests `pnpm test`
8. Run type checks using `pnpm tsc --noEmit`
9. Run lint checks using `pnpm lint`
10. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
11. Submit the change with the PR title '⚡ Bolt: Fix cache mutation and replace O(N log N) sort with O(N) in SearchHistoryManager'.

PR Description:
💡 What: Replaced in-place array sorting mutation with a shallow copy in `getSearchHistory` and an O(N) reduce operation in `getActivitySummary`.
🎯 Why: Calling `.sort()` on an array retrieved from a Map cache mutates the cache in place, which caused unexpected ordering shifts. Furthermore, finding the most recent search using a full array sort was an O(N log N) bottleneck that was improved to an O(N) pass.
📊 Impact: Eliminates unintended state mutation bugs in the cache and improves the runtime complexity of finding extremums from O(N log N) to O(N).
🔬 Measurement: Verify by checking test execution times or checking that history array lengths and elements don't get inadvertently reordered on repeated fetches.
