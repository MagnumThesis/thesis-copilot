1. **Optimize `src/worker/lib/concern-status-manager.ts` (`getStatistics` method)**
   - Replace the multiple `.filter(...).length` operations (O(N) each, resulting in ~14N operations per call) with a single O(N) loop that calculates all counts simultaneously.
   - Use the `replace_with_git_merge_diff` tool.

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
      // Optimize: Single pass O(N) calculation instead of multiple O(N) filters
      const total = concerns.length;
      let toBeDone = 0;
      let addressed = 0;
      let rejected = 0;
      let open = 0;
      let resolved = 0;
      let dismissed = 0;

      const byCategory: Record<ConcernCategory, ConcernStatusBreakdown> = {} as Record<ConcernCategory, ConcernStatusBreakdown>;
      const concernsByCategory: Record<ConcernCategory, number> = {} as Record<ConcernCategory, number>;
      Object.values(ConcernCategory).forEach(category => {
        byCategory[category] = {
          status: category as unknown as ConcernStatus,
          count: 0,
          percentage: 0,
          total: 0,
          toBeDone: 0,
          addressed: 0,
          rejected: 0
        };
        concernsByCategory[category] = 0;
      });

      const bySeverity: Record<ConcernSeverity, ConcernStatusBreakdown> = {} as Record<ConcernSeverity, ConcernStatusBreakdown>;
      const concernsBySeverity: Record<ConcernSeverity, number> = {} as Record<ConcernSeverity, number>;
      Object.values(ConcernSeverity).forEach(severity => {
        bySeverity[severity] = {
          status: severity as unknown as ConcernStatus,
          count: 0,
          percentage: 0,
          total: 0,
          toBeDone: 0,
          addressed: 0,
          rejected: 0
        };
        concernsBySeverity[severity] = 0;
      });

      // Single pass through all concerns
      for (let i = 0; i < total; i++) {
        const c = concerns[i];
        const stat = c.status;
        const cat = c.category;
        const sev = c.severity;

        if (stat === ConcernStatus.TO_BE_DONE) toBeDone++;
        else if (stat === ConcernStatus.ADDRESSED) addressed++;
        else if (stat === ConcernStatus.REJECTED) rejected++;
        else if (stat === ConcernStatus.OPEN) open++;
        else if (stat === ConcernStatus.RESOLVED) resolved++;
        else if (stat === ConcernStatus.DISMISSED) dismissed++;

        if (cat && byCategory[cat]) {
          const catStats = byCategory[cat];
          catStats.total++;
          catStats.count++;
          concernsByCategory[cat]++;

          if (stat === ConcernStatus.TO_BE_DONE) catStats.toBeDone++;
          else if (stat === ConcernStatus.ADDRESSED) catStats.addressed++;
          else if (stat === ConcernStatus.REJECTED) catStats.rejected++;
        }

        if (sev && bySeverity[sev]) {
          const sevStats = bySeverity[sev];
          sevStats.total++;
          sevStats.count++;
          concernsBySeverity[sev]++;

          if (stat === ConcernStatus.TO_BE_DONE) sevStats.toBeDone++;
          else if (stat === ConcernStatus.ADDRESSED) sevStats.addressed++;
          else if (stat === ConcernStatus.REJECTED) sevStats.rejected++;
        }
      }

      // Calculate percentages after counting
      Object.values(ConcernCategory).forEach(category => {
          const catStats = byCategory[category];
          catStats.percentage = catStats.total > 0 ? (catStats.addressed / catStats.total) * 100 : 0;
      });

      Object.values(ConcernSeverity).forEach(severity => {
          const sevStats = bySeverity[severity];
          sevStats.percentage = sevStats.total > 0 ? (sevStats.addressed / sevStats.total) * 100 : 0;
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

2. **Verify changes in `src/worker/lib/concern-status-manager.ts`**
   - Run `cat src/worker/lib/concern-status-manager.ts` to ensure modifications were applied correctly.

3. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Run formatting and linting.
   - Run tests.

4. **Submit Pull Request**
   - Submit the PR with the required Bolt PR format and details.
