const results = [];
for (let i = 0; i < 1000; i++) {
  results.push({ user_action: ['viewed', 'added', 'rejected', 'other'][Math.floor(Math.random() * 4)] });
}

console.time('filter');
for (let i = 0; i < 10000; i++) {
  const v = results.filter(r => r.user_action === 'viewed').length;
  const a = results.filter(r => r.user_action === 'added').length;
  const r = results.filter(r => r.user_action === 'rejected').length;
}
console.timeEnd('filter');

console.time('reduce');
for (let i = 0; i < 10000; i++) {
  const counts = results.reduce((acc, r) => {
    if (r.user_action === 'viewed') acc.v++;
    else if (r.user_action === 'added') acc.a++;
    else if (r.user_action === 'rejected') acc.r++;
    return acc;
  }, { v: 0, a: 0, r: 0 });
}
console.timeEnd('reduce');

console.time('for');
for (let i = 0; i < 10000; i++) {
  let v = 0, a = 0, r = 0;
  for (let j = 0; j < results.length; j++) {
    const action = results[j].user_action;
    if (action === 'viewed') v++;
    else if (action === 'added') a++;
    else if (action === 'rejected') r++;
  }
}
console.timeEnd('for');
