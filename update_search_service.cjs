const fs = require('fs');

const filePath = 'src/worker/services/search-service.ts';
let code = fs.readFileSync(filePath, 'utf8');

const search = `          for (const result of finalResults) {
            await analyticsManager.recordSearchResult({
              searchSessionId: sessionId,
              resultTitle: result.title,
              resultAuthors: result.authors,
              resultJournal: result.journal,
              resultYear: result.publication_date ? parseInt(result.publication_date) : undefined,
              resultDoi: result.doi,
              resultUrl: result.url,
              relevanceScore: result.relevance_score || 0,
              confidenceScore: result.confidence || 0,
              qualityScore: this.calculateQualityScore(result),
              citationCount: result.citation_count || 0,
              addedToLibrary: false,
            });
          }`;

const replace = `          // Use batch insert to fix N+1 query problem
          await analyticsManager.recordSearchResults(finalResults.map(result => ({
            searchSessionId: sessionId,
            resultTitle: result.title,
            resultAuthors: result.authors,
            resultJournal: result.journal,
            resultYear: result.publication_date ? parseInt(result.publication_date) : undefined,
            resultDoi: result.doi,
            resultUrl: result.url,
            relevanceScore: result.relevance_score || 0,
            confidenceScore: result.confidence || 0,
            qualityScore: this.calculateQualityScore(result),
            citationCount: result.citation_count || 0,
            addedToLibrary: false,
          })));`;

if (code.includes(search)) {
  code = code.replace(search, replace);
  fs.writeFileSync(filePath, code);
  console.log('Successfully updated search-service.ts to use batch insert.');
} else {
  console.log('Could not find search block in search-service.ts.');
}
