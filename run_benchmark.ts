import { ConcernSeverity, ConcernStatus, ConcernCategory } from "./src/lib/types/shared/common.ts";

function generateConcernStatisticsOld(concerns: any[]): any {
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
  };
}

function generateConcernStatisticsNew(concerns: any[]): any {
  const total = concerns.length;

  let toBeDone = 0;
  let addressed = 0;
  let rejected = 0;

  const byCategory: Record<string, any> = {};
  for (const cat of Object.values(ConcernCategory)) {
      byCategory[cat] = { total: 0, toBeDone: 0, addressed: 0, rejected: 0 };
  }

  const bySeverity: Record<string, any> = {};
  for (const sev of Object.values(ConcernSeverity)) {
      bySeverity[sev] = { total: 0, toBeDone: 0, addressed: 0, rejected: 0 };
  }

  for (const c of concerns) {
      if (c.status === ConcernStatus.TO_BE_DONE) {
          toBeDone++;
          if (byCategory[c.category]) byCategory[c.category].toBeDone++;
          if (bySeverity[c.severity]) bySeverity[c.severity].toBeDone++;
      } else if (c.status === ConcernStatus.ADDRESSED) {
          addressed++;
          if (byCategory[c.category]) byCategory[c.category].addressed++;
          if (bySeverity[c.severity]) bySeverity[c.severity].addressed++;
      } else if (c.status === ConcernStatus.REJECTED) {
          rejected++;
          if (byCategory[c.category]) byCategory[c.category].rejected++;
          if (bySeverity[c.severity]) bySeverity[c.severity].rejected++;
      }

      if (byCategory[c.category]) byCategory[c.category].total++;
      if (bySeverity[c.severity]) bySeverity[c.severity].total++;
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
    concernsByCategory: byCategory,
    concernsBySeverity: bySeverity,
  };
}


const mockConcerns = Array.from({ length: 10000 }).map(() => ({
    status: Object.values(ConcernStatus)[Math.floor(Math.random() * 6)],
    category: Object.values(ConcernCategory)[Math.floor(Math.random() * 10)],
    severity: Object.values(ConcernSeverity)[Math.floor(Math.random() * 4)],
}));

const start1 = performance.now();
for (let i = 0; i < 100; i++) {
    generateConcernStatisticsOld(mockConcerns);
}
const end1 = performance.now();
console.log(`Old: ${end1 - start1}ms`);

const start2 = performance.now();
for (let i = 0; i < 100; i++) {
    generateConcernStatisticsNew(mockConcerns);
}
const end2 = performance.now();
console.log(`New: ${end2 - start2}ms`);
