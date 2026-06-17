const concerns = Array.from({ length: 1000 }, (_, i) => ({
  status: ['to_be_done', 'addressed', 'rejected'][i % 3],
  category: ['grammar', 'structure', 'clarity'][i % 3],
  severity: ['low', 'medium', 'high'][i % 3]
}));

console.time('multiple-filter');
for (let i = 0; i < 1000; i++) {
  const getStatusCount = (status) => concerns.filter(c => c.status === status).length;
  getStatusCount('to_be_done');
  getStatusCount('addressed');
  getStatusCount('rejected');
}
console.timeEnd('multiple-filter');

console.time('single-pass-memo');
for (let i = 0; i < 1000; i++) {
  const counts = { status: {}, category: {}, severity: {} };
  concerns.forEach(c => {
    counts.status[c.status] = (counts.status[c.status] || 0) + 1;
    counts.category[c.category] = (counts.category[c.category] || 0) + 1;
    counts.severity[c.severity] = (counts.severity[c.severity] || 0) + 1;
  });
}
console.timeEnd('single-pass-memo');
