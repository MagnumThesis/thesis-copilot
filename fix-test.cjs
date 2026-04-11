const fs = require('fs');
let content = fs.readFileSync('src/tests/enhanced-search-history-manager.test.ts', 'utf8');

content = content.replace(
  `const mockTopResults = [
        {
          result_title: 'Deep Learning for NLP',
          relevance_score: 0.95,
          added_to_library: true
        }
      ];`,
  `const mockTopResults = [
        {
          result_title: 'Deep Learning for NLP',
          relevance_score: 0.95,
          added_to_library: true,
          search_query: 'machine learning'
        }
      ];`
);

content = content.replace(
  `const mockTopResults = [
          {
            result_title: 'Deep Learning for NLP',
            relevance_score: 0.95,
            added_to_library: true
          },
          {
            result_title: 'Transformers explained',
            relevance_score: 0.92,
            added_to_library: false
          }
        ];`,
  `const mockTopResults = [
          {
            result_title: 'Deep Learning for NLP',
            relevance_score: 0.95,
            added_to_library: true,
            search_query: 'machine learning research'
          },
          {
            result_title: 'Transformers explained',
            relevance_score: 0.92,
            added_to_library: false,
            search_query: 'machine learning research'
          }
        ];`
);

fs.writeFileSync('src/tests/enhanced-search-history-manager.test.ts', content);
console.log('Fixed test mocks');
