1. **Optimize `getStatistics` in `src/worker/lib/concern-status-manager.ts`**
   - Replace the multiple redundant `.filter().length` array traversals with a single pass using the `replace_with_git_merge_diff` tool.
   - Using the exact text below:
   ```
   <<<<<<< SEARCH
      // Calculate overall statistics
      const total = concerns.length;
      const toBeDone = concerns.filter(c => c.status === ConcernStatus.TO_BE_DONE).length;
      const addressed = concerns.filter(c => c.status === ConcernStatus.ADDRESSED).length;
      const rejected = concerns.filter(c => c.status === ConcernStatus.REJECTED).length;

      // Calculate statistics by category
      const byCategory: Record<ConcernCategory, ConcernStatusBreakdown> = {} as Record<ConcernCategory, ConcernStatusBreakdown>;

      Object.values(ConcernCategory).forEach(category => {
        const categoryData = concerns.filter(c => c.category === category);
        const total = categoryData.length;
        const toBeDone = categoryData.filter(c => c.status === ConcernStatus.TO_BE_DONE).length;
        const addressed = categoryData.filter(c => c.status === ConcernStatus.ADDRESSED).length;
        const rejected = categoryData.filter(c => c.status === ConcernStatus.REJECTED).length;
        byCategory[category] = {
          status: category as unknown as ConcernStatus, // This is a workaround - category is a ConcernCategory, not ConcernStatus
          count: total,
          percentage: total > 0 ? (addressed / total) * 100 : 0,
          total,
          toBeDone,
          addressed,
          rejected
        };
      });

      // Calculate statistics by severity
      const bySeverity: Record<ConcernSeverity, ConcernStatusBreakdown> = {} as Record<ConcernSeverity, ConcernStatusBreakdown>;

      Object.values(ConcernSeverity).forEach(severity => {
        const severityData = concerns.filter(c => c.severity === severity);
        const total = severityData.length;
        const toBeDone = severityData.filter(c => c.status === ConcernStatus.TO_BE_DONE).length;
        const addressed = severityData.filter(c => c.status === ConcernStatus.ADDRESSED).length;
        const rejected = severityData.filter(c => c.status === ConcernStatus.REJECTED).length;
        bySeverity[severity] = {
          status: severity as unknown as ConcernStatus, // This is a workaround - severity is a ConcernSeverity, not ConcernStatus
          count: total,
          percentage: total > 0 ? (addressed / total) * 100 : 0,
          total,
          toBeDone,
          addressed,
          rejected
        };
      });

      // Calculate concerns by status
      const concernsByStatus: Record<ConcernStatus, number> = {
        [ConcernStatus.OPEN]: concerns.filter(c => c.status === ConcernStatus.OPEN).length,
        [ConcernStatus.RESOLVED]: concerns.filter(c => c.status === ConcernStatus.RESOLVED).length,
        [ConcernStatus.DISMISSED]: concerns.filter(c => c.status === ConcernStatus.DISMISSED).length,
        [ConcernStatus.ADDRESSED]: addressed,
        [ConcernStatus.REJECTED]: rejected,
        [ConcernStatus.TO_BE_DONE]: toBeDone
      };

      // Calculate concerns by category
      const concernsByCategory: Record<ConcernCategory, number> = {} as Record<ConcernCategory, number>;
      Object.values(ConcernCategory).forEach(category => {
        concernsByCategory[category] = concerns.filter(c => c.category === category).length;
      });

      // Calculate concerns by severity
      const concernsBySeverity: Record<ConcernSeverity, number> = {} as Record<ConcernSeverity, number>;
      Object.values(ConcernSeverity).forEach(severity => {
        concernsBySeverity[severity] = concerns.filter(c => c.severity === severity).length;
      });
   =======
      // ⚡ Bolt: Consolidated multiple array traversals into a single O(N) pass to calculate statistics
      const total = concerns.length;
      let toBeDone = 0;
      let addressed = 0;
      let rejected = 0;
      let open = 0;
      let resolved = 0;
      let dismissed = 0;

      const byCategory: Record<ConcernCategory, ConcernStatusBreakdown> = {} as Record<ConcernCategory, ConcernStatusBreakdown>;
      const bySeverity: Record<ConcernSeverity, ConcernStatusBreakdown> = {} as Record<ConcernSeverity, ConcernStatusBreakdown>;
      const concernsByCategory: Record<ConcernCategory, number> = {} as Record<ConcernCategory, number>;
      const concernsBySeverity: Record<ConcernSeverity, number> = {} as Record<ConcernSeverity, number>;

      // Initialize data structures
      Object.values(ConcernCategory).forEach(category => {
        byCategory[category] = {
          status: category as unknown as ConcernStatus,
          count: 0, percentage: 0, total: 0, toBeDone: 0, addressed: 0, rejected: 0
        };
        concernsByCategory[category] = 0;
      });

      Object.values(ConcernSeverity).forEach(severity => {
        bySeverity[severity] = {
          status: severity as unknown as ConcernStatus,
          count: 0, percentage: 0, total: 0, toBeDone: 0, addressed: 0, rejected: 0
        };
        concernsBySeverity[severity] = 0;
      });

      // Single pass to accumulate counts
      for (const c of concerns) {
        // Global counts
        if (c.status === ConcernStatus.TO_BE_DONE) toBeDone++;
        else if (c.status === ConcernStatus.ADDRESSED) addressed++;
        else if (c.status === ConcernStatus.REJECTED) rejected++;
        else if (c.status === ConcernStatus.OPEN) open++;
        else if (c.status === ConcernStatus.RESOLVED) resolved++;
        else if (c.status === ConcernStatus.DISMISSED) dismissed++;

        // Category counts
        const cat = byCategory[c.category as ConcernCategory];
        if (cat) {
          cat.total++;
          cat.count++;
          concernsByCategory[c.category as ConcernCategory]++;
          if (c.status === ConcernStatus.TO_BE_DONE) cat.toBeDone++;
          else if (c.status === ConcernStatus.ADDRESSED) cat.addressed++;
          else if (c.status === ConcernStatus.REJECTED) cat.rejected++;
        }

        // Severity counts
        const sev = bySeverity[c.severity as ConcernSeverity];
        if (sev) {
          sev.total++;
          sev.count++;
          concernsBySeverity[c.severity as ConcernSeverity]++;
          if (c.status === ConcernStatus.TO_BE_DONE) sev.toBeDone++;
          else if (c.status === ConcernStatus.ADDRESSED) sev.addressed++;
          else if (c.status === ConcernStatus.REJECTED) sev.rejected++;
        }
      }

      // Calculate percentages
      Object.values(ConcernCategory).forEach(category => {
        const cat = byCategory[category];
        cat.percentage = cat.total > 0 ? (cat.addressed / cat.total) * 100 : 0;
      });

      Object.values(ConcernSeverity).forEach(severity => {
        const sev = bySeverity[severity];
        sev.percentage = sev.total > 0 ? (sev.addressed / sev.total) * 100 : 0;
      });

      const concernsByStatus: Record<ConcernStatus, number> = {
        [ConcernStatus.OPEN]: open,
        [ConcernStatus.RESOLVED]: resolved,
        [ConcernStatus.DISMISSED]: dismissed,
        [ConcernStatus.ADDRESSED]: addressed,
        [ConcernStatus.REJECTED]: rejected,
        [ConcernStatus.TO_BE_DONE]: toBeDone
      };
   >>>>>>> REPLACE
   ```

2. **Verify `src/worker/lib/concern-status-manager.ts` update**
   - Run `sed -n '114,200p' src/worker/lib/concern-status-manager.ts` in the bash session to verify the update.

3. **Optimize `generateConcernStatistics` in `src/worker/handlers/proofreader-ai.ts`**
   - Replace the redundant traversals with a single pass in `src/worker/handlers/proofreader-ai.ts` using the `replace_with_git_merge_diff` tool.
   - Using the exact text below:
   ```
   <<<<<<< SEARCH
function generateConcernStatistics(concerns: any[]): ConcernStatistics {
  const total = concerns.length;
  const toBeDone = concerns.filter(c => c.status === ConcernStatus.TO_BE_DONE).length;
  const addressed = concerns.filter(c => c.status === ConcernStatus.ADDRESSED).length;
  const rejected = concerns.filter(c => c.status === ConcernStatus.REJECTED).length;

  // Generate breakdown by category
  const byCategory = {} as Record<ConcernCategory, any>;
  Object.values(ConcernCategory).forEach(category => {
    const categoryData = concerns.filter(c => c.category === category);
    byCategory[category] = {
      total: categoryData.length,
      toBeDone: categoryData.filter(c => c.status === ConcernStatus.TO_BE_DONE).length,
      addressed: categoryData.filter(c => c.status === ConcernStatus.ADDRESSED).length,
      rejected: categoryData.filter(c => c.status === ConcernStatus.REJECTED).length
    };
  });

  // Generate breakdown by severity
  const bySeverity = {} as Record<ConcernSeverity, any>;
  Object.values(ConcernSeverity).forEach(severity => {
    const severityData = concerns.filter(c => c.severity === severity);
    bySeverity[severity] = {
      total: severityData.length,
      toBeDone: severityData.filter(c => c.status === ConcernStatus.TO_BE_DONE).length,
      addressed: severityData.filter(c => c.status === ConcernStatus.ADDRESSED).length,
      rejected: severityData.filter(c => c.status === ConcernStatus.REJECTED).length
    };
  });

  return {
    totalConcerns: total,
    concernsByStatus: {
      [ConcernStatus.OPEN]: 0, // Placeholder values
      [ConcernStatus.RESOLVED]: 0,
      [ConcernStatus.DISMISSED]: 0,
      [ConcernStatus.ADDRESSED]: addressed,
      [ConcernStatus.REJECTED]: rejected,
      [ConcernStatus.TO_BE_DONE]: toBeDone
    },
    concernsByCategory: byCategory as Record<ConcernCategory, number>,
    concernsBySeverity: bySeverity as Record<ConcernSeverity, number>,
    resolutionRate: total > 0 ? (addressed + rejected) / total : 0,
    averageResolutionTime: 0, // Placeholder value
    total,
    toBeDone,
    addressed,
    rejected,
    byCategory,
    bySeverity
  };
}
   =======
function generateConcernStatistics(concerns: any[]): ConcernStatistics {
  // ⚡ Bolt: Consolidated multiple array traversals into a single O(N) pass to calculate statistics
  const total = concerns.length;
  let toBeDone = 0;
  let addressed = 0;
  let rejected = 0;

  const byCategory = {} as Record<ConcernCategory, any>;
  const bySeverity = {} as Record<ConcernSeverity, any>;

  Object.values(ConcernCategory).forEach(category => {
    byCategory[category] = { total: 0, toBeDone: 0, addressed: 0, rejected: 0 };
  });

  Object.values(ConcernSeverity).forEach(severity => {
    bySeverity[severity] = { total: 0, toBeDone: 0, addressed: 0, rejected: 0 };
  });

  for (const c of concerns) {
    if (c.status === ConcernStatus.TO_BE_DONE) toBeDone++;
    else if (c.status === ConcernStatus.ADDRESSED) addressed++;
    else if (c.status === ConcernStatus.REJECTED) rejected++;

    const cat = byCategory[c.category as ConcernCategory];
    if (cat) {
      cat.total++;
      if (c.status === ConcernStatus.TO_BE_DONE) cat.toBeDone++;
      else if (c.status === ConcernStatus.ADDRESSED) cat.addressed++;
      else if (c.status === ConcernStatus.REJECTED) cat.rejected++;
    }

    const sev = bySeverity[c.severity as ConcernSeverity];
    if (sev) {
      sev.total++;
      if (c.status === ConcernStatus.TO_BE_DONE) sev.toBeDone++;
      else if (c.status === ConcernStatus.ADDRESSED) sev.addressed++;
      else if (c.status === ConcernStatus.REJECTED) sev.rejected++;
    }
  }

  return {
    totalConcerns: total,
    concernsByStatus: {
      [ConcernStatus.OPEN]: 0, // Placeholder values
      [ConcernStatus.RESOLVED]: 0,
      [ConcernStatus.DISMISSED]: 0,
      [ConcernStatus.ADDRESSED]: addressed,
      [ConcernStatus.REJECTED]: rejected,
      [ConcernStatus.TO_BE_DONE]: toBeDone
    },
    concernsByCategory: byCategory as Record<ConcernCategory, number>,
    concernsBySeverity: bySeverity as Record<ConcernSeverity, number>,
    resolutionRate: total > 0 ? (addressed + rejected) / total : 0,
    averageResolutionTime: 0, // Placeholder value
    total,
    toBeDone,
    addressed,
    rejected,
    byCategory,
    bySeverity
  };
}
   >>>>>>> REPLACE
   ```

4. **Verify `src/worker/handlers/proofreader-ai.ts` update**
   - Run `sed -n '570,620p' src/worker/handlers/proofreader-ai.ts` in the bash session to verify the update.

5. **Run Linting**
   - Execute exactly `pnpm lint` in the bash session.

6. **Run Full Test Suite**
   - Execute exactly `pnpm test` in the bash session.

7. **Complete pre commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

8. **Submit the PR**
   - Create a PR using the submit tool with the following exactly:
     - **Title**: "⚡ Bolt: [performance improvement]"
     - **Branch Name**: `bolt/optimize-concern-statistics`
     - **Commit Message**: "⚡ Bolt: Consolidated multiple array traversals into single O(N) passes to calculate statistics"
     - **Description**:
       💡 What: Consolidated multiple redundant array filtering operations into single O(N) traversals in `getStatistics` and `generateConcernStatistics`.
       🎯 Why: Repeatedly filtering the `concerns` array per status, category, and severity was computationally expensive, resulting in O(kN) performance where k is the number of permutations.
       📊 Impact: Reduces array traversals significantly for concern statistics, reducing memory allocation and improving processing time.
       🔬 Measurement: Run the test suites for concern statistics and proofreader handlers.
