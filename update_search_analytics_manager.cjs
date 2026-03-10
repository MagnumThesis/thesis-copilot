const fs = require('fs');

const filePath = 'src/worker/lib/search-analytics-manager.ts';
let code = fs.readFileSync(filePath, 'utf8');

const newMethod = `
  /**
   * Batch record multiple search results in a single database operation
   * Performance optimization: Turns N database inserts into 1
   */
  async recordSearchResults(resultsData: Omit<SearchResult, 'id' | 'createdAt'>[]): Promise<string[]> {
    if (!resultsData || resultsData.length === 0) {
      return [];
    }

    try {
      const supabase = getSupabase(this.env);
      const recordsToInsert = resultsData.map(data => {
        const resultId = crypto.randomUUID();
        return {
          id: resultId,
          search_session_id: data.searchSessionId,
          reference_id: data.referenceId || null,
          result_title: data.resultTitle,
          result_authors: data.resultAuthors,
          result_journal: data.resultJournal || null,
          result_year: data.resultYear || null,
          result_doi: data.resultDoi || null,
          result_url: data.resultUrl || null,
          relevance_score: data.relevanceScore,
          confidence_score: data.confidenceScore,
          quality_score: data.qualityScore,
          citation_count: data.citationCount,
          user_action: data.userAction || null,
          user_feedback_rating: data.userFeedbackRating || null,
          user_feedback_comments: data.userFeedbackComments || null,
          added_to_library: data.addedToLibrary,
          added_at: data.addedAt?.toISOString() || null
        };
      });

      const { error } = await supabase
        .from('search_results')
        .insert(recordsToInsert);

      if (error) {
        console.error('Error batch recording search results:', error);
        throw error;
      }

      console.log(\`Batch recorded \${recordsToInsert.length} search results\`);
      return recordsToInsert.map(record => record.id);
    } catch (error) {
      console.error('Error batch recording search results:', error);
      throw error;
    }
  }
`;

const insertIndex = code.indexOf("  async recordSearchResult(resultData: Omit<SearchResult, 'id' | 'createdAt'>): Promise<string> {");
if (insertIndex !== -1) {
  code = code.slice(0, insertIndex) + newMethod + '\n' + code.slice(insertIndex);
  fs.writeFileSync(filePath, code);
  console.log('Successfully added recordSearchResults method.');
} else {
  console.log('Could not find insertion point.');
}
