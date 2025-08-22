# Implementation Plan

Implement AI-powered reference discovery system that extracts content from Ideas and Builder tools, searches Google Scholar for relevant academic papers, and suggests references to users.

## Overview

The AI Searcher feature will enhance the existing Referencer tool by providing intelligent academic paper discovery based on user's research content. The system will analyze content from Ideas and Builder tools, generate optimized search queries, fetch results from Google Scholar, and present ranked reference suggestions to users.

## Types

New type definitions for AI Searcher functionality:

```typescript
// Content extraction types
interface ExtractedContent {
  source: 'ideas' | 'builder';
  content: string;
  keywords: string[];
  keyPhrases: string[];
  topics: string[];
  confidence: number;
}

// Google Scholar search types
interface ScholarSearchQuery {
  query: string;
  filters: {
    yearRange?: [number, number];
    citationCount?: number;
    language?: string;
  };
}

interface ScholarSearchResult {
  title: string;
  authors: string[];
  journal?: string;
  year?: number;
  citations?: number;
  url: string;
  doi?: string;
  abstract?: string;
  fullTextUrl?: string;
}

// Reference suggestion types
interface ReferenceSuggestion {
  id: string;
  reference: ReferenceMetadata;
  relevanceScore: number;
  confidence: number;
  source: string;
  searchQuery: string;
  isDuplicate: boolean;
  reasoning: string;
}

interface SuggestionRanking {
  relevance: number;
  recency: number;
  citations: number;
  authorAuthority: number;
  overall: number;
}

// Search history and analytics types
interface SearchHistoryItem {
  id: string;
  timestamp: Date;
  query: string;
  sources: ('ideas' | 'builder')[];
  results: {
    total: number;
    accepted: number;
    rejected: number;
  };
  userId: string;
}

interface SearchAnalytics {
  totalSearches: number;
  successRate: number;
  popularTopics: string[];
  averageResults: number;
  topSources: ('ideas' | 'builder')[];
}
```

## Files

### New Files to Create

1. **Backend Components:**
   - `src/worker/lib/content-extraction-engine.ts` - Extract and analyze content from Ideas/Builder
   - `src/worker/lib/google-scholar-client.ts` - Google Scholar API integration
   - `src/worker/lib/reference-suggestion-engine.ts` - Rank and score suggestions
   - `src/worker/lib/search-history-manager.ts` - Manage search analytics
   - `src/worker/handlers/ai-searcher-api.ts` - API endpoints for AI searcher

2. **Frontend Components:**
   - `src/components/ui/ai-searcher.tsx` - Main AI searcher interface
   - `src/components/ui/content-selector.tsx` - Select Ideas/Builder content
   - `src/components/ui/search-results.tsx` - Display search results
   - `src/components/ui/suggestion-item.tsx` - Individual suggestion display
   - `src/components/ui/search-history.tsx` - View search history

3. **Utilities and Hooks:**
   - `src/hooks/useContentExtraction.ts` - Hook for content extraction
   - `src/hooks/useScholarSearch.ts` - Hook for search operations
   - `src/utils/text-analysis.ts` - Text analysis utilities
   - `src/utils/scholar-parser.ts` - Parse Google Scholar results

### Files to Modify

1. **Existing Referencer Component:**
   - `src/components/ui/referencer.tsx` - Add AI Searcher tab

2. **Type Definitions:**
   - `src/lib/ai-types.ts` - Add AI searcher types

3. **API Integration:**
   - `src/worker/index.ts` - Register new API endpoints

## Functions

### New Functions to Implement

1. **Content Extraction Engine:**
   - `extractFromIdeas(ideaId: string): Promise<ExtractedContent>`
   - `extractFromBuilder(builderId: string): Promise<ExtractedContent>`
   - `analyzeText(content: string): TextAnalysis`
   - `extractKeywords(text: string): string[]`
   - `generateSearchQuery(content: ExtractedContent): ScholarSearchQuery`

2. **Google Scholar Client:**
   - `searchScholar(query: ScholarSearchQuery): Promise<ScholarSearchResult[]>`
   - `parseSearchResults(html: string): ScholarSearchResult[]`
   - `rateLimitDelay(): Promise<void>`
   - `handleSearchErrors(error: Error): SearchError`

3. **Reference Suggestion Engine:**
   - `generateSuggestions(results: ScholarSearchResult[], originalContent: string): ReferenceSuggestion[]`
   - `calculateRelevanceScore(result: ScholarSearchResult, content: string): number`
   - `detectDuplicates(suggestions: ReferenceSuggestion[]): ReferenceSuggestion[]`
   - `rankSuggestions(suggestions: ReferenceSuggestion[]): ReferenceSuggestion[]`

4. **Search History Manager:**
   - `recordSearch(searchData: SearchHistoryItem): Promise<void>`
   - `getSearchHistory(userId: string): Promise<SearchHistoryItem[]>`
   - `getAnalytics(userId: string): Promise<SearchAnalytics>`
   - `clearHistory(userId: string): Promise<void>`

5. **Frontend Components:**
   - `AISearcher.handleSearch()` - Initiate search process
   - `ContentSelector.selectContent()` - Choose content sources
   - `SearchResults.renderSuggestions()` - Display ranked results
   - `SuggestionItem.acceptSuggestion()` - Add to references

## Classes

### New Classes to Implement

1. **ContentExtractionEngine:**
   ```typescript
   class ContentExtractionEngine {
     constructor(private ideaApi: IdeaApi, private builderApi: BuilderApi)
     async extractContent(source: 'ideas' | 'builder', id: string): Promise<ExtractedContent>
     private analyzeContent(content: string): TextAnalysis
     private extractKeyPhrases(text: string): string[]
   }
   ```

2. **GoogleScholarClient:**
   ```typescript
   class GoogleScholarClient {
     constructor(private baseUrl: string, private rateLimiter: RateLimiter)
     async search(query: ScholarSearchQuery): Promise<ScholarSearchResult[]>
     private buildSearchUrl(query: ScholarSearchQuery): string
     private parseResults(html: string): ScholarSearchResult[]
   }
   ```

3. **ReferenceSuggestionEngine:**
   ```typescript
   class ReferenceSuggestionEngine {
     constructor(private similarity: TextSimilarity)
     generateSuggestions(searchResults: ScholarSearchResult[], content: string): ReferenceSuggestion[]
     private calculateSimilarity(text1: string, text2: string): number
     private scoreResult(result: ScholarSearchResult, content: string): SuggestionRanking
   }
   ```

## Dependencies

### New Package Dependencies

1. **Text Analysis:**
   - `natural` - Natural language processing
   - `node-nlp` - NLP utilities
   - `sentiment` - Text analysis

2. **Web Scraping:**
   - `cheerio` - HTML parsing
   - `puppeteer` - Headless browser for Google Scholar
   - `got` - HTTP requests

3. **Similarity Analysis:**
   - `string-similarity` - Text similarity comparison
   - `jaccard` - Jaccard similarity coefficient

4. **Rate Limiting:**
   - `bottleneck` - Rate limiting library

### Existing Dependencies to Extend

1. **UI Components:**
   - Extend existing Shadcn components for new UI elements
   - Reuse existing modal and form components

2. **State Management:**
   - Integrate with existing conversation context
   - Use existing localStorage patterns

## Testing

### Unit Tests

1. **Content Extraction:**
   - Test text analysis and keyword extraction
   - Test content parsing from different sources
   - Test search query generation

2. **Google Scholar Integration:**
   - Test API request formatting
   - Test result parsing
   - Test error handling and rate limiting

3. **Suggestion Engine:**
   - Test relevance scoring algorithms
   - Test duplicate detection
   - Test ranking logic

4. **Frontend Components:**
   - Test search interface interactions
   - Test result display and filtering
   - Test suggestion acceptance/rejection

### Integration Tests

1. **End-to-End Search Flow:**
   - Test complete search workflow from content to suggestions
   - Test integration with existing reference system
   - Test error scenarios and recovery

2. **API Integration:**
   - Test API endpoint functionality
   - Test data persistence and retrieval
   - Test cross-component communication

## Implementation Order

1. **Setup Foundation (Week 1):**
   - Create type definitions and interfaces
   - Set up project structure and dependencies
   - Implement basic content extraction utilities

2. **Backend Core (Week 2):**
   - Implement ContentExtractionEngine
   - Create Google Scholar client
   - Build reference suggestion engine

3. **API Layer (Week 3):**
   - Create API handlers for search operations
   - Implement search history management
   - Add error handling and validation

4. **Frontend Components (Week 4):**
   - Build AI Searcher main component
   - Create content selection interface
   - Implement search results display

5. **Integration and Polish (Week 5):**
   - Integrate with existing Referencer tool
   - Add search history and analytics
   - Implement responsive design and accessibility
   - Add comprehensive testing and documentation
