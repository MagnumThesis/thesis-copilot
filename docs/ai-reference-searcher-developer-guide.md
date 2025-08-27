# AI Reference Searcher Developer Documentation

This document provides technical documentation for the AI Reference Searcher feature, including API endpoints, component architecture, and implementation details.

## Architecture Overview

The AI Reference Searcher consists of several key components:

1. **Frontend Components**:
   - AISearcher: Main search interface
   - ContentSourceSelector: Content selection interface
   - SearchResultsDisplay: Results display and ranking
   - QueryRefinementPanel: Query optimization interface

2. **Backend Services**:
   - GoogleScholarClient: Web scraping client for Google Scholar
   - QueryGenerationEngine: Intelligent query creation
   - ResultScoringEngine: Relevance and quality scoring
   - ContentExtractionEngine: Content extraction from Ideas/Builder

3. **API Layer**:
   - AISearcherAPIHandler: Main API handler
   - FeedbackLearningSystem: User feedback processing
   - SearchAnalyticsManager: Analytics and tracking

## API Endpoints

### Search Operations

#### POST /api/ai-searcher/search
Perform an AI-powered academic search

**Request Body**:
```json
{
  "query": "string",
  "conversationId": "string",
  "contentSources": [
    {
      "source": "ideas|builder",
      "id": "string"
    }
  ],
  "queryOptions": {
    "maxKeywords": "number",
    "maxTopics": "number",
    "includeAlternatives": "boolean",
    "optimizeForAcademic": "boolean"
  },
  "filters": {
    "dateRange": {
      "start": "number",
      "end": "number"
    },
    "authors": ["string"],
    "journals": ["string"],
    "minCitations": "number",
    "maxResults": "number",
    "sortBy": "relevance|date|citations|quality"
  }
}
```

**Response**:
```json
{
  "success": "boolean",
  "results": [
    {
      "title": "string",
      "authors": ["string"],
      "journal": "string",
      "publication_date": "string",
      "doi": "string",
      "url": "string",
      "confidence": "number",
      "relevance_score": "number",
      "abstract": "string",
      "keywords": ["string"],
      "citation_count": "number"
    }
  ],
  "sessionId": "string",
  "processingTime": "number"
}
```

#### POST /api/ai-searcher/refine-query
Perform query refinement analysis

**Request Body**:
```json
{
  "query": "string",
  "originalContent": [
    {
      "title": "string",
      "content": "string",
      "keywords": ["string"],
      "topics": ["string"],
      "confidence": "number"
    }
  ],
  "conversationId": "string"
}
```

**Response**:
```json
{
  "success": "boolean",
  "refinement": {
    "breadthAnalysis": {
      "breadthScore": "number",
      "classification": "too_narrow|optimal|too_broad",
      "reasoning": "string",
      "termCount": "number",
      "specificityLevel": "very_specific|specific|moderate|broad|very_broad",
      "suggestions": [
        {
          "type": "broaden|narrow|refocus",
          "suggestion": "string",
          "reasoning": "string",
          "impact": "low|medium|high"
        }
      ]
    },
    "alternativeTerms": {
      "synonyms": [
        {
          "term": "string",
          "confidence": "number",
          "reasoning": "string",
          "category": "synonym|related|broader|narrower|academic",
          "originalTerm": "string"
        }
      ],
      "relatedTerms": [...],
      "broaderTerms": [...],
      "narrowerTerms": [...],
      "academicVariants": [...]
    },
    "validationResults": {
      "isValid": "boolean",
      "issues": ["string"],
      "suggestions": ["string"],
      "confidence": "number"
    },
    "optimizationRecommendations": [
      {
        "type": "add_term|remove_term|replace_term|add_operator|restructure",
        "description": "string",
        "impact": "low|medium|high",
        "priority": "number",
        "beforeQuery": "string",
        "afterQuery": "string",
        "reasoning": "string"
      }
    ],
    "refinedQueries": [
      {
        "query": "string",
        "refinementType": "broadened|narrowed|refocused|academic_enhanced|operator_optimized",
        "confidence": "number",
        "expectedResults": "fewer|similar|more",
        "description": "string",
        "changes": [
          {
            "type": "added|removed|replaced|reordered",
            "element": "string",
            "reasoning": "string"
          }
        ]
      }
    ]
  },
  "originalQuery": "string",
  "processingTime": "number"
}
```

### Content Operations

#### POST /api/ai-searcher/extract-content
Extract content from Ideas and Builder sources

**Request Body**:
```json
{
  "conversationId": "string",
  "sources": [
    {
      "source": "ideas|builder",
      "id": "string"
    }
  ]
}
```

**Response**:
```json
{
  "success": "boolean",
  "extractedContent": [
    {
      "source": "ideas|builder",
      "title": "string",
      "content": "string",
      "keywords": ["string"],
      "keyPhrases": ["string"],
      "topics": ["string"],
      "confidence": "number",
      "id": "string"
    }
  ],
  "totalExtracted": "number",
  "errors": [
    {
      "source": "string",
      "id": "string",
      "error": "string"
    }
  ],
  "processingTime": "number"
}
```

### Feedback and Analytics

#### POST /api/ai-searcher/feedback
Record user feedback for search quality

**Request Body**:
```json
{
  "sessionId": "string",
  "conversationId": "string",
  "overallSatisfaction": "number",
  "relevanceRating": "number",
  "qualityRating": "number",
  "easeOfUseRating": "number",
  "feedbackComments": "string",
  "wouldRecommend": "boolean",
  "improvementSuggestions": "string"
}
```

**Response**:
```json
{
  "success": "boolean",
  "feedbackId": "string",
  "message": "string",
  "processingTime": "number"
}
```

#### GET /api/ai-searcher/analytics
Get search analytics

**Query Parameters**:
- conversationId (required)
- days (optional, default: 30)

**Response**:
```json
{
  "success": "boolean",
  "analytics": {
    "searchAnalytics": {
      "totalSearches": "number",
      "successfulSearches": "number",
      "averageResultsPerSearch": "number",
      "topSearchTopics": ["string"],
      "mostUsedSources": ["ideas|builder"],
      "averageRelevanceScore": "number",
      "userSatisfactionScore": "number",
      "searchTrends": [
        {
          "period": "string",
          "searchCount": "number",
          "successRate": "number",
          "topTopics": ["string"]
        }
      ]
    },
    "conversionMetrics": {...},
    "satisfactionMetrics": {...},
    "usageMetrics": {...},
    "trends": {...}
  },
  "processingTime": "number"
}
```

## Component Architecture

### AISearcher Component
Located at `src/components/ui/ai-searcher.tsx`

Main props:
```typescript
interface AISearcherProps {
  conversationId: string;
  onAddReference?: (reference: Partial<Reference>) => void;
}
```

Key features:
- Content source selection
- Query generation and refinement
- Search result display with ranking
- Duplicate detection and management
- User feedback collection
- Analytics tracking

### GoogleScholarClient
Located at `src/worker/lib/google-scholar-client.ts`

Main methods:
- `search(query: string, options?: SearchOptions): Promise<ScholarSearchResult[]>`
- `parseResults(html: string): ScholarSearchResult[]`
- `validateResults(results: ScholarSearchResult[]): ScholarSearchResult[]`

Key features:
- Web scraping with proper headers
- Rate limiting and request throttling
- Error handling and retry logic
- Fallback mechanisms
- HTML parsing for metadata extraction

### QueryGenerationEngine
Located at `src/worker/lib/query-generation-engine.ts`

Main methods:
- `generateQueries(content: ExtractedContent[], options: QueryGenerationOptions = {}): SearchQuery[]`
- `optimizeQuery(query: string, keywords: string[], topics: string[]): QueryOptimization`
- `combineQueries(queries: SearchQuery[]): SearchQuery`
- `validateQuery(query: string): ValidationResult`
- `refineQuery(query: string, originalContent: ExtractedContent[]): QueryRefinement`

### ResultScoringEngine
Located at `src/worker/lib/result-scoring-engine.ts`

Main methods:
- `scoreResult(result: ScholarSearchResult, content: ExtractedContent, weights: Partial<ScoringWeights> = {}): ScoringResult`
- `scoreRelevance(result: ScholarSearchResult, content: ExtractedContent): number`
- `scoreQuality(result: ScholarSearchResult): number`
- `calculateConfidence(result: ScholarSearchResult): number`
- `rankResults(results: ScholarSearchResult[], content: ExtractedContent, weights?: Partial<ScoringWeights>): RankedResult[]`

## Performance Considerations

### Caching
The system implements multiple caching layers:
- Search result caching to avoid duplicate API calls
- Content extraction caching for repeated content access
- Query generation caching for identical content

### Background Processing
Long-running operations are processed in the background:
- Content extraction for related sources
- Query generation for alternative options
- Search preloading for related queries

### Rate Limiting
Conservative rate limits protect both the user and Google Scholar:
- 8 requests per minute
- 80 requests per hour
- Exponential backoff for retries

## Error Handling

The system implements comprehensive error handling:
- Network error recovery with retries
- Rate limit handling with blocking
- Service unavailability detection
- Graceful degradation for parsing errors
- User-friendly error messages

## Testing

### Unit Tests
Located in `src/tests/`:
- `google-scholar-client.test.ts`
- `query-generation-engine.test.ts`
- `result-scoring-engine.test.ts`
- `ai-searcher-api-comprehensive.test.ts`

### Integration Tests
- End-to-end search workflows
- Content extraction to search integration
- Feedback learning system tests
- Performance benchmarks

## Deployment

### Environment Variables
Required environment variables:
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON`: Supabase anonymous key

### Dependencies
Key dependencies:
- `hono`: Web framework
- `string-similarity`: Text similarity calculations
- Standard React and TypeScript dependencies

### Configuration
Rate limiting and error handling can be configured through:
- `RateLimitConfig` in GoogleScholarClient
- `FallbackConfig` for alternative sources
- `ErrorHandlingConfig` for custom error messages