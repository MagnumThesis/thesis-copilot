const fs = require('fs');

const content = fs.readFileSync('src/worker/lib/enhanced-search-history-manager.ts', 'utf8');

const searchStr = `
      // Get top results for each query
      const queryAnalytics = await Promise.all(
        (result.results || []).map(async (row: any) => {
          const topResultsQuery = \`
            SELECT sr.result_title, sr.relevance_score, sr.added_to_library
            FROM search_results sr
            JOIN search_sessions ss ON sr.search_session_id = ss.id
            WHERE ss.search_query = ? AND ss.user_id = ?
            \${conversationId ? 'AND ss.conversation_id = ?' : ''}
            ORDER BY sr.relevance_score DESC
            LIMIT 3
          \`;

          const topResultsParams = [row.search_query, userId];
          if (conversationId) {
            topResultsParams.push(conversationId);
          }

          const topResultsResult = await this.getEnvironment().DB.prepare(topResultsQuery).bind(...topResultsParams).all();
          const topResults = (topResultsResult.results || []).map((r: any) => ({
            title: r.result_title,
            relevanceScore: r.relevance_score,
            addedToLibrary: r.added_to_library
          }));

          return {
            query: row.search_query,
            searchCount: row.search_count,
            averageResults: row.avg_results || 0,
            successRate: row.success_rate || 0,
            averageProcessingTime: row.avg_processing_time || 0,
            lastUsed: new Date(row.last_used),
            topResults
          };
        })
      );

      return queryAnalytics;
`;

const replaceStr = `
      // Get top results for all queries in a single DB roundtrip (fixes N+1 issue)
      const queries = (result.results || []).map((r: any) => r.search_query);
      if (queries.length === 0) return [];

      const placeholders = queries.map(() => '?').join(',');
      const topResultsQuery = \`
        SELECT * FROM (
          SELECT
            sr.result_title,
            sr.relevance_score,
            sr.added_to_library,
            ss.search_query,
            ROW_NUMBER() OVER(PARTITION BY ss.search_query ORDER BY sr.relevance_score DESC) as rn
          FROM search_results sr
          JOIN search_sessions ss ON sr.search_session_id = ss.id
          WHERE ss.search_query IN (\${placeholders}) AND ss.user_id = ?
          \${conversationId ? 'AND ss.conversation_id = ?' : ''}
        )
        WHERE rn <= 3
      \`;

      const topResultsParams = [...queries, userId];
      if (conversationId) {
        topResultsParams.push(conversationId);
      }

      const topResultsResult = await this.getEnvironment().DB.prepare(topResultsQuery).bind(...topResultsParams).all();

      // Map results back to queries
      const topResultsByQuery = (topResultsResult.results || []).reduce((acc: Record<string, any[]>, r: any) => {
        if (!acc[r.search_query]) acc[r.search_query] = [];
        acc[r.search_query].push({
          title: r.result_title,
          relevanceScore: r.relevance_score,
          addedToLibrary: r.added_to_library
        });
        return acc;
      }, {});

      const queryAnalytics = (result.results || []).map((row: any) => ({
        query: row.search_query,
        searchCount: row.search_count,
        averageResults: row.avg_results || 0,
        successRate: row.success_rate || 0,
        averageProcessingTime: row.avg_processing_time || 0,
        lastUsed: new Date(row.last_used),
        topResults: topResultsByQuery[row.search_query] || []
      }));

      return queryAnalytics;
`;

if (content.includes(searchStr.trim())) {
  const newContent = content.replace(searchStr.trim(), replaceStr.trim());
  fs.writeFileSync('src/worker/lib/enhanced-search-history-manager.ts', newContent);
  console.log('Replaced successfully');
} else {
  console.log('Search string not found');
}
