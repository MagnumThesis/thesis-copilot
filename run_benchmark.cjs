const { performance } = require('perf_hooks');

const ConcernStatus = {
  OPEN: 'open',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
  ADDRESSED: 'addressed',
  REJECTED: 'rejected',
  TO_BE_DONE: 'to_be_done'
};

const ConcernCategory = {
  GRAMMAR: 'grammar',
  STYLE: 'style',
  CLARITY: 'clarity',
  STRUCTURE: 'structure'
};

const ConcernSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Generate test data
const concerns = [];
for (let i = 0; i < 10000; i++) {
  concerns.push({
    status: Object.values(ConcernStatus)[i % 6],
    category: Object.values(ConcernCategory)[i % 4],
    severity: Object.values(ConcernSeverity)[i % 4]
  });
}

function originalApproach(concerns) {
      // Calculate overall statistics
      const total = concerns.length;
      const toBeDone = concerns.filter(c => c.status === ConcernStatus.TO_BE_DONE).length;
      const addressed = concerns.filter(c => c.status === ConcernStatus.ADDRESSED).length;
      const rejected = concerns.filter(c => c.status === ConcernStatus.REJECTED).length;

      // Calculate statistics by category
      const byCategory = {};
      Object.values(ConcernCategory).forEach(category => {
        const categoryData = concerns.filter(c => c.category === category);
        const total = categoryData.length;
        const toBeDone = categoryData.filter(c => c.status === ConcernStatus.TO_BE_DONE).length;
        const addressed = categoryData.filter(c => c.status === ConcernStatus.ADDRESSED).length;
        const rejected = categoryData.filter(c => c.status === ConcernStatus.REJECTED).length;
        byCategory[category] = {
          status: category,
          count: total,
          percentage: total > 0 ? (addressed / total) * 100 : 0,
          total,
          toBeDone,
          addressed,
          rejected
        };
      });

      // Calculate statistics by severity
      const bySeverity = {};
      Object.values(ConcernSeverity).forEach(severity => {
        const severityData = concerns.filter(c => c.severity === severity);
        const total = severityData.length;
        const toBeDone = severityData.filter(c => c.status === ConcernStatus.TO_BE_DONE).length;
        const addressed = severityData.filter(c => c.status === ConcernStatus.ADDRESSED).length;
        const rejected = severityData.filter(c => c.status === ConcernStatus.REJECTED).length;
        bySeverity[severity] = {
          status: severity,
          count: total,
          percentage: total > 0 ? (addressed / total) * 100 : 0,
          total,
          toBeDone,
          addressed,
          rejected
        };
      });

      // Calculate concerns by status
      const concernsByStatus = {
        [ConcernStatus.OPEN]: concerns.filter(c => c.status === ConcernStatus.OPEN).length,
        [ConcernStatus.RESOLVED]: concerns.filter(c => c.status === ConcernStatus.RESOLVED).length,
        [ConcernStatus.DISMISSED]: concerns.filter(c => c.status === ConcernStatus.DISMISSED).length,
        [ConcernStatus.ADDRESSED]: addressed,
        [ConcernStatus.REJECTED]: rejected,
        [ConcernStatus.TO_BE_DONE]: toBeDone
      };

      // Calculate concerns by category
      const concernsByCategory = {};
      Object.values(ConcernCategory).forEach(category => {
        concernsByCategory[category] = concerns.filter(c => c.category === category).length;
      });

      // Calculate concerns by severity
      const concernsBySeverity = {};
      Object.values(ConcernSeverity).forEach(severity => {
        concernsBySeverity[severity] = concerns.filter(c => c.severity === severity).length;
      });

      return { byCategory, bySeverity, concernsByStatus, concernsByCategory, concernsBySeverity };
}

function optimizedApproach(concerns) {
      const total = concerns.length;

      // Initialize counters
      let toBeDone = 0, addressed = 0, rejected = 0;

      const concernsByStatus = {
        [ConcernStatus.OPEN]: 0,
        [ConcernStatus.RESOLVED]: 0,
        [ConcernStatus.DISMISSED]: 0,
        [ConcernStatus.ADDRESSED]: 0,
        [ConcernStatus.REJECTED]: 0,
        [ConcernStatus.TO_BE_DONE]: 0
      };

      const concernsByCategory = {};
      Object.values(ConcernCategory).forEach(cat => concernsByCategory[cat] = 0);

      const concernsBySeverity = {};
      Object.values(ConcernSeverity).forEach(sev => concernsBySeverity[sev] = 0);

      // Initialize data structures for breakdown
      const categoryData = {};
      Object.values(ConcernCategory).forEach(cat => {
        categoryData[cat] = { total: 0, toBeDone: 0, addressed: 0, rejected: 0 };
      });

      const severityData = {};
      Object.values(ConcernSeverity).forEach(sev => {
        severityData[sev] = { total: 0, toBeDone: 0, addressed: 0, rejected: 0 };
      });

      // Single pass through concerns
      for (const c of concerns) {
        // Overall status
        concernsByStatus[c.status]++;

        if (c.status === ConcernStatus.TO_BE_DONE) toBeDone++;
        else if (c.status === ConcernStatus.ADDRESSED) addressed++;
        else if (c.status === ConcernStatus.REJECTED) rejected++;

        // Category
        if (c.category) {
          concernsByCategory[c.category]++;
          if (categoryData[c.category]) {
            categoryData[c.category].total++;
            if (c.status === ConcernStatus.TO_BE_DONE) categoryData[c.category].toBeDone++;
            else if (c.status === ConcernStatus.ADDRESSED) categoryData[c.category].addressed++;
            else if (c.status === ConcernStatus.REJECTED) categoryData[c.category].rejected++;
          }
        }

        // Severity
        if (c.severity) {
          concernsBySeverity[c.severity]++;
          if (severityData[c.severity]) {
            severityData[c.severity].total++;
            if (c.status === ConcernStatus.TO_BE_DONE) severityData[c.severity].toBeDone++;
            else if (c.status === ConcernStatus.ADDRESSED) severityData[c.severity].addressed++;
            else if (c.status === ConcernStatus.REJECTED) severityData[c.severity].rejected++;
          }
        }
      }

      // Format category breakdown
      const byCategory = {};
      Object.entries(categoryData).forEach(([category, data]) => {
        byCategory[category] = {
          status: category,
          count: data.total,
          percentage: data.total > 0 ? (data.addressed / data.total) * 100 : 0,
          total: data.total,
          toBeDone: data.toBeDone,
          addressed: data.addressed,
          rejected: data.rejected
        };
      });

      // Format severity breakdown
      const bySeverity = {};
      Object.entries(severityData).forEach(([severity, data]) => {
        bySeverity[severity] = {
          status: severity,
          count: data.total,
          percentage: data.total > 0 ? (data.addressed / data.total) * 100 : 0,
          total: data.total,
          toBeDone: data.toBeDone,
          addressed: data.addressed,
          rejected: data.rejected
        };
      });

      return { byCategory, bySeverity, concernsByStatus, concernsByCategory, concernsBySeverity };
}

// Warmup
for (let i = 0; i < 100; i++) {
  originalApproach(concerns);
  optimizedApproach(concerns);
}

// Test correctness
const o1 = originalApproach(concerns);
const o2 = optimizedApproach(concerns);
console.log('Results match:', JSON.stringify(o1) === JSON.stringify(o2));

// Benchmark
const iterations = 1000;

let start = performance.now();
for (let i = 0; i < iterations; i++) {
  originalApproach(concerns);
}
const timeOriginal = performance.now() - start;

start = performance.now();
for (let i = 0; i < iterations; i++) {
  optimizedApproach(concerns);
}
const timeOptimized = performance.now() - start;

console.log(`Original: ${timeOriginal.toFixed(2)}ms`);
console.log(`Optimized: ${timeOptimized.toFixed(2)}ms`);
console.log(`Speedup: ${(timeOriginal / timeOptimized).toFixed(2)}x`);
