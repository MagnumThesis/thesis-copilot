const sessions = Array.from({length: 1000}, (_, i) => ({ results_count: i % 10, search_success: i % 2 === 0, processing_time_ms: i * 10 }));
const results = Array.from({length: 5000}, (_, i) => ({ user_action: ['viewed', 'added', 'rejected', null][i % 4] }));

console.time('old_method');
for(let i = 0; i < 100; i++) {
    const totalSearches = sessions.length;
    const totalResults = sessions.reduce((sum, session) => sum + (session.results_count || 0), 0);
    const resultsViewed = results.filter(result => result.user_action === 'viewed').length;
    const resultsAdded = results.filter(result => result.user_action === 'added').length;
    const resultsRejected = results.filter(result => result.user_action === 'rejected').length;
}
console.timeEnd('old_method');

console.time('new_method');
for(let i = 0; i < 100; i++) {
    const totalSearches = sessions.length;
    let totalResults = 0;
    for (let i = 0; i < sessions.length; i++) {
      totalResults += sessions[i].results_count || 0;
    }
    let resultsViewed = 0;
    let resultsAdded = 0;
    let resultsRejected = 0;

    for (let i = 0; i < results.length; i++) {
      const action = results[i].user_action;
      if (action === 'viewed') resultsViewed++;
      else if (action === 'added') resultsAdded++;
      else if (action === 'rejected') resultsRejected++;
    }
}
console.timeEnd('new_method');
