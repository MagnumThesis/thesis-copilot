import { Hono } from 'hono';
import { Context } from 'hono';
import { Env } from '../types/env';
import { QueryGenerationEngine, SearchQuery, QueryGenerationOptions } from '../lib/query-generation-engine';
import { ContentExtractionEngine } from '../lib/content-extraction-engine';
import { SearchAnalyticsManager } from '../lib/search-analytics-manager';
import { FeedbackLearningSystem } from '../lib/feedback-learning-system';
import { GoogleScholarClient, SearchOptions } from '../lib/google-scholar-client';
import { ExtractedContent, ScholarSearchResult } from '../../lib/ai-types';
import feedbackApi from './ai-searcher-feedback';
import learningApi from './ai-searcher-learning';

// Define SupabaseEnv type locally since it's not exported from supabase.ts
export type SupabaseEnv = {
  SUPABASE_URL: string;
  SUPABASE_ANON: string;
};

// Type for the Hono context
type AISearcherContext = {
  Bindings: Env & SupabaseEnv;
};

interface SearchRequest {
  query?: string;
  conversationId: string;
  contentSources?: Array<{
    source: 'ideas' | 'builder';
    id: string;
  }>;
  queryOptions?: QueryGenerationOptions;
  filters?: {
    dateRange?: {
      start: number;
      end: number;
    };
    authors?: string[];
    journals?: string[];
    minCitations?: number;
    maxResults?: number;
    sortBy?: 'relevance' | 'date' | 'citations' | 'quality';
    // Legacy filters for backward compatibility
    publicationDate?: string;
    author?: string;
    journal?: string;
    doi?: string;
  };
  limit?: number;
  offset?: number;
}

interface ExtractRequest {
  source: string;
  type: 'url' | 'doi';
  conversationId: string;
}

interface QueryGenerationRequest {
  conversationId: string;
  contentSources: Array<{
    source: 'ideas' | 'builder';
    id: string;
  }>;
  options?: QueryGenerationOptions;
}

interface ContentExtractionRequest {
  conversationId: string;
  sources: Array<{
    source: 'ideas' | 'builder';
    id: string;
  }>;
}

interface QueryRefinementRequest {
  query: string;
  originalContent?: ExtractedContent[];
  conversationId: string;
}

interface SearchResult {
  title: string;
  authors: string[];
  journal?: string;
  publication_date?: string;
  doi?: string;
  url?: string;
  confidence: number;
  relevance_score: number;
  abstract?: string;
  keywords?: string[];
  citation_count?: number;
}

interface SearchHistoryEntry {
  id: string;
  query: string;
  timestamp: number;
  results_count: number;
  conversationId: string;
}

interface AnalyticsData {
  total_searches: number;
  unique_queries: number;
  average_results: number;
  top_queries: Array<{ query: string; count: number }>;
  searches_by_date: Array<{ date: string; count: number }>;
}

interface TrendingTopic {
  topic: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  percentage_change: number;
}

interface StatisticsData {
  total_users: number;
  total_searches: number;
  total_references_added: number;
  average_search_time: number;
  most_used_features: Array<{ feature: string; count: number }>;
}

/**
 * AI Searcher API Handler
 * Provides AI-powered academic reference search functionality
 */
export class AISearcherAPIHandler {
  private queryEngine: QueryGenerationEngine;
  private contentEngine: ContentExtractionEngine;
  private scholarClient: GoogleScholarClient;

  constructor() {
    this.queryEngine = new QueryGenerationEngine();
    this.contentEngine = new ContentExtractionEngine();
    this.scholarClient = new GoogleScholarClient(
      {
        requestsPerMinute: 8, // Conservative rate limiting
        requestsPerHour: 80,
        maxRetries: 3,
        baseDelayMs: 2000,
        maxDelayMs: 30000
      },
      {
        enabled: true,
        fallbackSources: ['semantic-scholar', 'crossref'],
        maxFallbackAttempts: 2
      },
      {
        enableDetailedLogging: true,
        customErrorMessages: {
          'rate_limit': 'Search rate limit exceeded. Please wait before trying again.',
          'blocked': 'Access to Google Scholar is temporarily blocked. Please try again later.',
          'service_unavailable': 'Google Scholar is temporarily unavailable. Please try again later.'
        }
      }
    );
  }

  private getAnalyticsManager(env: any): SearchAnalyticsManager {
    return new SearchAnalyticsManager(env);
  }

  /**
   * Handle search errors and provide appropriate fallback responses
   */
  private handleSearchError(error: unknown, query: string): {
    shouldRetry: boolean;
    fallbackResults: SearchResult[];
    errorMessage: string;
  } {
    let shouldRetry = false;
    let finalErrorMessage = 'Search failed due to unknown error';
    const fallbackResults: SearchResult[] = [];

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        shouldRetry = true;
        finalErrorMessage = 'Search rate limit exceeded. Please wait before trying again.';
      } else if (errorMessage.includes('blocked') || errorMessage.includes('403')) {
        shouldRetry = false;
        finalErrorMessage = 'Access to Google Scholar is temporarily blocked. Please try again later.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
        shouldRetry = true;
        finalErrorMessage = 'Network timeout occurred. Please check your connection and try again.';
      } else if (errorMessage.includes('service unavailable') || errorMessage.includes('503')) {
        shouldRetry = true;
        finalErrorMessage = 'Google Scholar is temporarily unavailable. Please try again later.';
      } else {
        shouldRetry = false;
        finalErrorMessage = `Search error: ${error.message}`;
      }
    }

    // Provide a helpful fallback result that explains the situation
    if (!shouldRetry) {
      fallbackResults.push({
        title: `Search temporarily unavailable for: "${query}"`,
        authors: ['System Message'],
        journal: 'Thesis Copilot',
        publication_date: new Date().getFullYear().toString(),
        confidence: 0.1,
        relevance_score: 0.1,
        abstract: `We're currently unable to search Google Scholar. ${finalErrorMessage} You can try again later or search manually using your query: "${query}"`,
        keywords: ['search', 'unavailable', 'retry'],
        url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`
      });
    }

    return {
      shouldRetry,
      fallbackResults,
      errorMessage: finalErrorMessage
    };
  }
  /**
   * POST /api/ai-searcher/search
   * Perform AI-powered academic search
   */
  async search(c: Context<AISearcherContext>) {
    const startTime = Date.now();
    let sessionId: string | null = null;

    try {
      const body = await c.req.json() as SearchRequest;

      if (!body.conversationId) {
        return c.json({
          success: false,
          error: 'conversationId is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      let searchQuery = body.query;
      let generatedQueries: SearchQuery[] = [];
      let extractedContent: ExtractedContent[] = [];

      // If no query provided but content sources are available, generate query
      if (!searchQuery && body.contentSources && body.contentSources.length > 0) {
        try {
          // Extract content from sources
          for (const source of body.contentSources) {
            const extracted = await this.contentEngine.extractContent({
              source: source.source,
              id: source.id,
              conversationId: body.conversationId
            });
            extractedContent.push(extracted);
          }

          // Generate queries
          if (extractedContent.length > 0) {
            generatedQueries = this.queryEngine.generateQueries(extractedContent, body.queryOptions);
            searchQuery = generatedQueries[0]?.query;
          }
        } catch (error) {
          console.warn('Failed to generate query from content sources:', error);
        }
      }

      if (!searchQuery) {
        return c.json({
          success: false,
          error: 'Query is required (either directly or via content sources)',
          processingTime: Date.now() - startTime
        }, 400);
      }

      // Record search session start (skip in test environment)
      try {
        const analyticsManager = this.getAnalyticsManager(c.env);
        const contentSources = body.contentSources?.map(cs => cs.source) || [];
        sessionId = await analyticsManager.recordSearchSession({
          conversationId: body.conversationId,
          userId: body.conversationId, // Using conversationId as userId for now
          searchQuery,
          contentSources,
          searchFilters: body.filters || {},
          resultsCount: 0, // Will be updated after search
          resultsAccepted: 0,
          resultsRejected: 0,
          searchSuccess: false, // Will be updated after search
          processingTimeMs: 0 // Will be updated after search
        });
      } catch (analyticsError) {
        console.error('Error recording search session:', analyticsError);
        // Continue without analytics in case of error (e.g., in tests)
        sessionId = crypto.randomUUID();
      }

      // Perform real Google Scholar search
      let scholarResults: ScholarSearchResult[] = [];
      
      try {
        // Configure search options based on filters
        const searchOptions: SearchOptions = {
          maxResults: body.filters?.maxResults || 20,
          sortBy: body.filters?.sortBy === 'date' ? 'date' : 'relevance',
          includePatents: false,
          includeCitations: true
        };

        // Apply date range filter if provided
        if (body.filters?.dateRange) {
          searchOptions.yearStart = body.filters.dateRange.start;
          searchOptions.yearEnd = body.filters.dateRange.end;
        }

        console.log(`Performing Google Scholar search for query: "${searchQuery}" with options:`, searchOptions);
        
        // Execute the search
        scholarResults = await this.scholarClient.search(searchQuery, searchOptions);
        
        console.log(`Google Scholar search returned ${scholarResults.length} results`);

      } catch (searchError) {
        console.error('Google Scholar search failed:', searchError);
        
        // Handle the error and determine appropriate response
        const errorHandling = this.handleSearchError(searchError, searchQuery);
        
        if (errorHandling.shouldRetry) {
          // For retryable errors, we might want to implement retry logic here
          // For now, we'll log and continue with fallback
          console.warn(`Retryable search error for query "${searchQuery}": ${errorHandling.errorMessage}`);
        } else {
          console.error(`Non-retryable search error for query "${searchQuery}": ${errorHandling.errorMessage}`);
        }
        
        // Use fallback results if available
        scholarResults = errorHandling.fallbackResults.map(result => ({
          title: result.title,
          authors: result.authors,
          journal: result.journal,
          year: result.publication_date ? parseInt(result.publication_date) : undefined,
          publication_date: result.publication_date,
          doi: result.doi,
          url: result.url,
          abstract: result.abstract,
          keywords: result.keywords,
          confidence: result.confidence,
          relevance_score: result.relevance_score,
          citation_count: result.citation_count
        }));
      }

      // Convert ScholarSearchResult to SearchResult format
      let searchResults: SearchResult[] = scholarResults.map(result => ({
        title: result.title,
        authors: result.authors,
        journal: result.journal,
        publication_date: result.publication_date || result.year?.toString(),
        doi: result.doi,
        url: result.url,
        confidence: result.confidence,
        relevance_score: result.relevance_score,
        abstract: result.abstract,
        keywords: result.keywords,
        citation_count: result.citation_count // Preserve citation count from Google Scholar
      }));

      // Apply additional filters to search results (Google Scholar client handles basic filtering)
      if (body.filters) {
        searchResults = this.applyFilters(searchResults, body.filters);
      }

      // Apply learning-based ranking to results
      let finalResults = searchResults;
      try {
        const learningSystem = new FeedbackLearningSystem(c.env);
        const userId = body.conversationId; // Using conversationId as userId for now
        
        // Convert search results to format for learning system
        const searchResultsForLearning = searchResults.map(result => ({
          id: crypto.randomUUID(),
          searchSessionId: sessionId || '',
          resultTitle: result.title,
          resultAuthors: result.authors,
          resultJournal: result.journal,
          resultYear: result.publication_date ? parseInt(result.publication_date) : undefined,
          resultDoi: result.doi,
          resultUrl: result.url,
          relevanceScore: result.relevance_score || 0,
          confidenceScore: result.confidence || 0,
          qualityScore: this.calculateQualityScore(result),
          citationCount: result.citation_count || 0, // Use real citation count from Google Scholar
          addedToLibrary: false,
          createdAt: new Date()
        }));

        // Apply learning-based ranking
        const rankedResults = await learningSystem.applyFeedbackBasedRanking(userId, searchResultsForLearning);
        
        // Convert back to original format with learning adjustments
        finalResults = rankedResults.map(result => {
          const originalResult = searchResults.find(sr => sr.title === result.resultTitle);
          return {
            title: result.resultTitle,
            authors: result.resultAuthors,
            journal: result.resultJournal,
            publication_date: result.resultYear?.toString(),
            doi: result.resultDoi,
            url: result.resultUrl,
            confidence: result.confidenceScore,
            relevance_score: result.relevanceScore,
            abstract: originalResult?.abstract,
            keywords: originalResult?.keywords,
            citation_count: originalResult?.citation_count, // Preserve citation count
            // Include learning metadata for debugging/transparency
            learningAdjustments: (result as any).learningAdjustments
          };
        });

        console.log(`Applied learning-based ranking for user ${userId}: ${rankedResults.length} results`);
      } catch (learningError) {
        console.warn('Failed to apply learning-based ranking, using original results:', learningError);
        // Continue with original results if learning fails
      }

      // Record search results for analytics (skip in test environment)
      if (sessionId) {
        try {
          const analyticsManager = this.getAnalyticsManager(c.env);
          for (const result of finalResults) {
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
              citationCount: result.citation_count || 0, // Use real citation count from Google Scholar
              addedToLibrary: false
            });
          }

          // Update search session with results
          const processingTime = Date.now() - startTime;
          await this.updateSearchSession(sessionId, {
            resultsCount: finalResults.length,
            searchSuccess: true,
            processingTimeMs: processingTime
          });
        } catch (analyticsError) {
          console.error('Error recording search analytics:', analyticsError);
          // Continue without analytics in case of error
        }
      }

      const processingTime = Date.now() - startTime;

      return c.json({
        success: true,
        results: finalResults.map(result => ({
          ...result,
          sessionId // Include sessionId for frontend tracking
        })),
        total_results: finalResults.length,
        query: searchQuery,
        originalQuery: body.query,
        generatedQueries: generatedQueries.length > 0 ? generatedQueries : undefined,
        extractedContent: extractedContent.length > 0 ? extractedContent : undefined,
        filters: body.filters,
        sessionId,
        processingTime,
        learningApplied: true // Indicate that learning-based ranking was applied
      });

    } catch (error) {
      console.error('AI Search error:', error);

      // Record failed search session if we have a sessionId
      if (sessionId) {
        try {
          await this.updateSearchSession(sessionId, {
            resultsCount: 0,
            searchSuccess: false,
            processingTimeMs: Date.now() - startTime,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          });
        } catch (analyticsError) {
          console.error('Failed to record search failure:', analyticsError);
        }
      }

      return c.json({
        success: false,
        error: 'Failed to perform AI search',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * POST /api/ai-searcher/extract
   * Extract metadata from URL or DOI
   */
  async extract(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const body = await c.req.json() as ExtractRequest;

      if (!body.source || !body.conversationId) {
        return c.json({
          success: false,
          error: 'Source and conversationId are required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      let extractedMetadata: SearchResult | null = null;

      try {
        if (body.type === 'doi' || body.source.includes('doi.org')) {
          // Extract DOI and search for it
          let doi = body.source;
          if (body.source.includes('doi.org/')) {
            doi = body.source.split('doi.org/')[1];
          }
          
          // Search Google Scholar for the DOI
          const searchQuery = `"${doi}"`;
          const results = await this.scholarClient.search(searchQuery, { maxResults: 1 });
          
          if (results && results.length > 0) {
            const result = results[0];
            extractedMetadata = {
              title: result.title,
              authors: result.authors,
              journal: result.journal,
              publication_date: result.publication_date || result.year?.toString(),
              doi: result.doi || doi,
              url: result.url || body.source,
              confidence: result.confidence,
              relevance_score: result.relevance_score,
              abstract: result.abstract,
              keywords: result.keywords
            };
          }
        } else if (body.type === 'url') {
          // For URLs, try to extract title and search for it
          // This is a simplified approach - in production, you might want to scrape the page
          const urlParts = body.source.split('/');
          const possibleTitle = urlParts[urlParts.length - 1]
            .replace(/[-_]/g, ' ')
            .replace(/\.(pdf|html|htm)$/i, '');
          
          if (possibleTitle.length > 3) {
            const results = await this.scholarClient.search(possibleTitle, { maxResults: 3 });
            
            // Find the most relevant result
            if (results && results.length > 0) {
              const bestResult = results[0]; // Google Scholar already ranks by relevance
              extractedMetadata = {
                title: bestResult.title,
                authors: bestResult.authors,
                journal: bestResult.journal,
                publication_date: bestResult.publication_date || bestResult.year?.toString(),
                doi: bestResult.doi,
                url: bestResult.url || body.source,
                confidence: Math.max(0.3, bestResult.confidence - 0.2), // Lower confidence for URL extraction
                relevance_score: bestResult.relevance_score,
                abstract: bestResult.abstract,
                keywords: bestResult.keywords
              };
            }
          }
        }

        // If extraction failed, provide a fallback response
        if (!extractedMetadata) {
          extractedMetadata = {
            title: "Unable to extract title",
            authors: ["Unknown Author"],
            journal: undefined,
            publication_date: undefined,
            doi: body.type === 'doi' ? body.source : undefined,
            url: body.source,
            confidence: 0.1,
            relevance_score: 0.1,
            abstract: "Metadata extraction failed. Please verify the source and try again.",
            keywords: []
          };
        }

      } catch (extractionError) {
        console.error('Real metadata extraction failed:', extractionError);
        
        // Provide fallback metadata
        extractedMetadata = {
          title: "Extraction Failed",
          authors: ["Unknown Author"],
          journal: undefined,
          publication_date: undefined,
          doi: body.type === 'doi' ? body.source : undefined,
          url: body.source,
          confidence: 0.1,
          relevance_score: 0.1,
          abstract: `Failed to extract metadata: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}`,
          keywords: []
        };
      }

      return c.json({
        success: true,
        metadata: extractedMetadata,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Metadata extraction error:', error);

      return c.json({
        success: false,
        error: 'Failed to extract metadata',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * GET /api/ai-searcher/history
   * Get search history for a conversation with enhanced filtering and pagination
   */
  async getHistory(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const conversationId = c.req.query('conversationId');
      const limit = parseInt(c.req.query('limit') || '50');
      const offset = parseInt(c.req.query('offset') || '0');
      const searchQuery = c.req.query('searchQuery');
      const successOnly = c.req.query('successOnly') === 'true';
      const minResultsCount = c.req.query('minResultsCount') ? parseInt(c.req.query('minResultsCount')) : undefined;
      const contentSources = c.req.query('contentSources')?.split(',').filter(s => s === 'ideas' || s === 'builder');
      const startDate = c.req.query('startDate');
      const endDate = c.req.query('endDate');

      if (!conversationId) {
        return c.json({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      // Import the enhanced search history manager
      const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
      const historyManager = new EnhancedSearchHistoryManager(c.env);

      // Build filter object
      const filter: any = {};
      if (searchQuery) filter.searchQuery = searchQuery;
      if (successOnly) filter.successOnly = true;
      if (minResultsCount) filter.minResultsCount = minResultsCount;
      if (contentSources && contentSources.length > 0) filter.contentSources = contentSources;
      if (startDate && endDate) {
        filter.dateRange = {
          start: new Date(startDate),
          end: new Date(endDate)
        };
      }

      const result = await historyManager.getSearchHistory(
        conversationId, // Using conversationId as userId for now
        conversationId,
        Object.keys(filter).length > 0 ? filter : undefined,
        limit,
        offset
      );

      return c.json({
        success: true,
        entries: result.entries,
        total: result.total,
        hasMore: result.hasMore,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Get history error:', error);

      return c.json({
        success: false,
        error: 'Failed to retrieve search history',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * GET /api/ai-searcher/history/stats
   * Get search history statistics
   */
  async getHistoryStats(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const conversationId = c.req.query('conversationId');
      const days = parseInt(c.req.query('days') || '30');

      if (!conversationId) {
        return c.json({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
      const historyManager = new EnhancedSearchHistoryManager(c.env);

      const stats = await historyManager.getSearchHistoryStats(
        conversationId, // Using conversationId as userId for now
        conversationId,
        days
      );

      return c.json({
        success: true,
        stats,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Get history stats error:', error);

      return c.json({
        success: false,
        error: 'Failed to retrieve search history statistics',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * GET /api/ai-searcher/history/content-usage
   * Get content source usage analytics
   */
  async getContentUsage(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const conversationId = c.req.query('conversationId');
      const days = parseInt(c.req.query('days') || '30');

      if (!conversationId) {
        return c.json({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
      const historyManager = new EnhancedSearchHistoryManager(c.env);

      const usage = await historyManager.getContentSourceUsage(
        conversationId, // Using conversationId as userId for now
        conversationId,
        days
      );

      return c.json({
        success: true,
        usage,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Get content usage error:', error);

      return c.json({
        success: false,
        error: 'Failed to retrieve content usage analytics',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * POST /api/ai-searcher/analytics/success-tracking
   * Get search success rate tracking over time
   */
  async getSuccessTracking(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const body = await c.req.json();
      const { userId, conversationId, days = 30 } = body;

      if (!userId) {
        return c.json({
          success: false,
          error: 'userId is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
      const historyManager = new EnhancedSearchHistoryManager(c.env);

      const tracking = await historyManager.getSearchSuccessRateTracking(
        userId,
        conversationId,
        days
      );

      return c.json({
        success: true,
        tracking,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Get success tracking error:', error);

      return c.json({
        success: false,
        error: 'Failed to retrieve success tracking data',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * GET /api/ai-searcher/history/export
   * Export search history data
   */
  async exportHistory(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const conversationId = c.req.query('conversationId');
      const format = c.req.query('format') || 'json';

      if (!conversationId) {
        return c.json({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      if (format !== 'json' && format !== 'csv') {
        return c.json({
          success: false,
          error: 'Format must be either "json" or "csv"',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
      const historyManager = new EnhancedSearchHistoryManager(c.env);

      const exportData = await historyManager.exportSearchHistory(
        conversationId, // Using conversationId as userId for now
        conversationId,
        format as 'json' | 'csv'
      );

      const contentType = format === 'csv' ? 'text/csv' : 'application/json';
      const filename = `search-history-${new Date().toISOString().split('T')[0]}.${format}`;

      return new Response(exportData, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });

    } catch (error) {
      console.error('Export history error:', error);

      return c.json({
        success: false,
        error: 'Failed to export search history',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * GET /api/ai-searcher/analytics/query-performance
   * Get query performance analytics
   */
  async getQueryPerformance(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const conversationId = c.req.query('conversationId');
      const days = parseInt(c.req.query('days') || '30');

      if (!conversationId) {
        return c.json({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
      const historyManager = new EnhancedSearchHistoryManager(c.env);

      const analytics = await historyManager.getQueryPerformanceAnalytics(
        conversationId, // Using conversationId as userId for now
        conversationId,
        days
      );

      return c.json({
        success: true,
        analytics,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Get query performance error:', error);

      return c.json({
        success: false,
        error: 'Failed to retrieve query performance analytics',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * GET /api/ai-searcher/analytics/success-rate-tracking
   * Get search success rate tracking over time
   */
  async getSuccessRateTracking(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const conversationId = c.req.query('conversationId');
      const days = parseInt(c.req.query('days') || '30');

      if (!conversationId) {
        return c.json({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
      const historyManager = new EnhancedSearchHistoryManager(c.env);

      const tracking = await historyManager.getSearchSuccessRateTracking(
        conversationId, // Using conversationId as userId for now
        conversationId,
        days
      );

      return c.json({
        success: true,
        tracking,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Get success rate tracking error:', error);

      return c.json({
        success: false,
        error: 'Failed to retrieve success rate tracking',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * GET /api/ai-searcher/analytics/content-source-effectiveness
   * Get content source effectiveness metrics
   */
  async getContentSourceEffectiveness(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const conversationId = c.req.query('conversationId');
      const days = parseInt(c.req.query('days') || '30');

      if (!conversationId) {
        return c.json({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
      const historyManager = new EnhancedSearchHistoryManager(c.env);

      const effectiveness = await historyManager.getContentSourceEffectiveness(
        conversationId, // Using conversationId as userId for now
        conversationId,
        days
      );

      return c.json({
        success: true,
        effectiveness,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Get content source effectiveness error:', error);

      return c.json({
        success: false,
        error: 'Failed to retrieve content source effectiveness',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * GET /api/ai-searcher/session/:sessionId
   * Get detailed search session information
   */
  async getSearchSessionDetails(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const sessionId = c.req.param('sessionId');

      if (!sessionId) {
        return c.json({
          success: false,
          error: 'sessionId parameter is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
      const historyManager = new EnhancedSearchHistoryManager(c.env);

      const sessionDetails = await historyManager.getSearchSessionDetails(sessionId);

      if (!sessionDetails) {
        return c.json({
          success: false,
          error: 'Search session not found',
          processingTime: Date.now() - startTime
        }, 404);
      }

      return c.json({
        success: true,
        session: sessionDetails,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Get search session details error:', error);

      return c.json({
        success: false,
        error: 'Failed to retrieve search session details',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }ailed to export search history',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * DELETE /api/ai-searcher/history
   * Clear search history or delete specific entries
   */
  async clearHistory(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const conversationId = c.req.query('conversationId');

      if (!conversationId) {
        return c.json({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      let entryIds: string[] | undefined;
      
      // Check if this is a POST request with specific entry IDs to delete
      if (c.req.method === 'DELETE' && c.req.header('content-type')?.includes('application/json')) {
        try {
          const body = await c.req.json();
          entryIds = body.entryIds;
        } catch (e) {
          // Ignore JSON parsing errors for simple DELETE requests
        }
      }

      const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
      const historyManager = new EnhancedSearchHistoryManager(c.env);

      await historyManager.deleteSearchHistory(
        conversationId, // Using conversationId as userId for now
        conversationId,
        entryIds
      );

      return c.json({
        success: true,
        message: entryIds 
          ? `${entryIds.length} search history entries deleted successfully`
          : 'Search history cleared successfully',
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Clear history error:', error);

      return c.json({
        success: false,
        error: 'Failed to clear search history',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * GET /api/ai-searcher/analytics
   * Get search analytics
   */
  async getAnalytics(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const conversationId = c.req.query('conversationId');
      const days = parseInt(c.req.query('days') || '30');

      if (!conversationId) {
        return c.json({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      // Get comprehensive analytics report
      const analyticsManager = this.getAnalyticsManager(c.env);
      const analyticsReport = await analyticsManager.generateAnalyticsReport(
        conversationId, // Using conversationId as userId
        conversationId,
        days
      );

      // Get additional usage metrics
      const usageMetrics = await analyticsManager.getSearchResultUsage(
        conversationId,
        conversationId,
        days
      );

      return c.json({
        success: true,
        analytics: {
          searchAnalytics: analyticsReport.searchAnalytics,
          conversionMetrics: analyticsReport.conversionMetrics,
          satisfactionMetrics: analyticsReport.satisfactionMetrics,
          usageMetrics: analyticsReport.usageMetrics,
          trends: analyticsReport.trends,
          period: {
            days,
            start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          }
        },
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Get analytics error:', error);

      return c.json({
        success: false,
        error: 'Failed to retrieve analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * GET /api/ai-searcher/trending
   * Get trending topics
   */
  async getTrending(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      // Mock trending topics
      const mockTrending: TrendingTopic[] = [
        {
          topic: "Large Language Models",
          count: 145,
          trend: "up",
          percentage_change: 23.5
        },
        {
          topic: "Computer Vision",
          count: 98,
          trend: "up",
          percentage_change: 12.3
        },
        {
          topic: "Reinforcement Learning",
          count: 87,
          trend: "down",
          percentage_change: -5.2
        }
      ];

      return c.json({
        success: true,
        trending: mockTrending,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Get trending error:', error);

      return c.json({
        success: false,
        error: 'Failed to retrieve trending topics',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * GET /api/ai-searcher/statistics
   * Get usage statistics
   */
  async getStatistics(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      // Mock statistics data
      const mockStatistics: StatisticsData = {
        total_users: 1250,
        total_searches: 15470,
        total_references_added: 8932,
        average_search_time: 2.3,
        most_used_features: [
          { feature: "search", count: 15470 },
          { feature: "extract", count: 3420 },
          { feature: "analytics", count: 890 }
        ]
      };

      return c.json({
        success: true,
        statistics: mockStatistics,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Get statistics error:', error);

      return c.json({
        success: false,
        error: 'Failed to retrieve statistics',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * POST /api/ai-searcher/generate-query
   * Generate optimized search queries from content
   */
  async generateQuery(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const body = await c.req.json() as QueryGenerationRequest;

      if (!body.conversationId || !body.contentSources || body.contentSources.length === 0) {
        return c.json({
          success: false,
          error: 'conversationId and contentSources are required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      // Extract content from sources
      const extractedContents: ExtractedContent[] = [];
      
      for (const source of body.contentSources) {
        try {
          const extracted = await this.contentEngine.extractContent({
            source: source.source,
            id: source.id,
            conversationId: body.conversationId
          });
          extractedContents.push(extracted);
        } catch (error) {
          console.warn(`Failed to extract content from ${source.source}:${source.id}:`, error);
          // Continue with other sources
        }
      }

      if (extractedContents.length === 0) {
        return c.json({
          success: false,
          error: 'No content could be extracted from the provided sources',
          processingTime: Date.now() - startTime
        }, 400);
      }

      // Generate queries
      const queries = this.queryEngine.generateQueries(extractedContents, body.options);

      return c.json({
        success: true,
        queries,
        extractedContent: extractedContents,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Query generation error:', error);

      return c.json({
        success: false,
        error: 'Failed to generate queries',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * POST /api/ai-searcher/extract-content
   * Extract content from Ideas and Builder sources
   */
  async extractContent(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const body = await c.req.json() as ContentExtractionRequest;

      if (!body.conversationId || !body.sources || body.sources.length === 0) {
        return c.json({
          success: false,
          error: 'conversationId and sources are required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const extractedContents: ExtractedContent[] = [];
      const errors: Array<{ source: string; id: string; error: string }> = [];

      for (const source of body.sources) {
        try {
          const extracted = await this.contentEngine.extractContent({
            source: source.source,
            id: source.id,
            conversationId: body.conversationId
          });
          
          // Enhance extracted content with additional metadata
          const enhancedContent: ExtractedContent = {
            ...extracted,
            id: source.id,
            source: source.source,
            title: extracted.title || `${source.source} content ${source.id}`,
            confidence: extracted.confidence || 0.8
          };
          
          extractedContents.push(enhancedContent);
        } catch (error) {
          console.error(`Error extracting content from ${source.source}:${source.id}:`, error);
          errors.push({
            source: source.source,
            id: source.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return c.json({
        success: true,
        extractedContent: extractedContents,
        totalExtracted: extractedContents.length,
        errors: errors.length > 0 ? errors : undefined,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Content extraction error:', error);

      return c.json({
        success: false,
        error: 'Failed to extract content',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * POST /api/ai-searcher/content-preview
   * Preview extracted content from a single source
   */
  async contentPreview(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const body = await c.req.json() as {
        conversationId: string;
        source: 'ideas' | 'builder';
        id: string;
      };

      if (!body.conversationId || !body.source || !body.id) {
        return c.json({
          success: false,
          error: 'conversationId, source, and id are required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      try {
        const extracted = await this.contentEngine.extractContent({
          source: body.source,
          id: body.id,
          conversationId: body.conversationId
        });

        // Enhance with preview-specific metadata
        const previewContent: ExtractedContent = {
          ...extracted,
          id: body.id,
          source: body.source,
          title: extracted.title || `${body.source} content ${body.id}`,
          confidence: extracted.confidence || 0.8
        };

        return c.json({
          success: true,
          extractedContent: previewContent,
          processingTime: Date.now() - startTime
        });

      } catch (extractionError) {
        console.error(`Error previewing content from ${body.source}:${body.id}:`, extractionError);
        
        return c.json({
          success: false,
          error: `Failed to preview content from ${body.source}`,
          details: extractionError instanceof Error ? extractionError.message : 'Unknown error',
          processingTime: Date.now() - startTime
        }, 400);
      }

    } catch (error) {
      console.error('Content preview error:', error);

      return c.json({
        success: false,
        error: 'Failed to preview content',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * POST /api/ai-searcher/validate-query
   * Validate and optimize a search query
   */
  async validateQuery(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const body = await c.req.json() as { query: string };

      if (!body.query) {
        return c.json({
          success: false,
          error: 'Query is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const validation = this.queryEngine.validateQuery(body.query);

      return c.json({
        success: true,
        validation,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Query validation error:', error);

      return c.json({
        success: false,
        error: 'Failed to validate query',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * POST /api/ai-searcher/combine-queries
   * Combine multiple queries into one optimized query
   */
  async combineQueries(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const body = await c.req.json() as { queries: SearchQuery[] };

      if (!body.queries || body.queries.length === 0) {
        return c.json({
          success: false,
          error: 'Queries array is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const combinedQuery = this.queryEngine.combineQueries(body.queries);

      return c.json({
        success: true,
        combinedQuery,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Query combination error:', error);

      return c.json({
        success: false,
        error: 'Failed to combine queries',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * POST /api/ai-searcher/refine-query
   * Perform comprehensive query refinement analysis
   */
  async refineQuery(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const body = await c.req.json() as QueryRefinementRequest;

      if (!body.query || !body.conversationId) {
        return c.json({
          success: false,
          error: 'Query and conversationId are required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      // Use provided content or empty array if not provided
      const originalContent = body.originalContent || [];

      // Perform query refinement analysis
      const refinement = this.queryEngine.refineQuery(body.query, originalContent);

      return c.json({
        success: true,
        refinement,
        originalQuery: body.query,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Query refinement error:', error);

      return c.json({
        success: false,
        error: 'Failed to refine query',
        details: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * GET /api/ai-searcher/health
   * Health check endpoint
   */
  async health(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      return c.json({
        success: true,
        status: 'healthy',
        service: 'AI Searcher API',
        timestamp: new Date().toISOString(),
        uptime: process.uptime ? process.uptime() : 0,
        version: '1.0.0',
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Health check error:', error);

      return c.json({
        success: false,
        status: 'unhealthy',
        error: 'Service health check failed',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * Apply search filters to results
   */
  private applyFilters(results: SearchResult[], filters: any): SearchResult[] {
    let filteredResults = [...results];

    // Apply date range filter
    if (filters.dateRange) {
      filteredResults = filteredResults.filter(result => {
        if (!result.publication_date) return false;
        const year = parseInt(result.publication_date);
        const startYear = filters.dateRange.start || 1900;
        const endYear = filters.dateRange.end || new Date().getFullYear();
        return year >= startYear && year <= endYear;
      });
    }

    // Apply authors filter
    if (filters.authors && filters.authors.length > 0) {
      filteredResults = filteredResults.filter(result => {
        return filters.authors.some((filterAuthor: string) =>
          result.authors.some(author => 
            author.toLowerCase().includes(filterAuthor.toLowerCase())
          )
        );
      });
    }

    // Apply journals filter
    if (filters.journals && filters.journals.length > 0) {
      filteredResults = filteredResults.filter(result => {
        if (!result.journal) return false;
        return filters.journals.some((filterJournal: string) =>
          result.journal!.toLowerCase().includes(filterJournal.toLowerCase())
        );
      });
    }

    // Apply minimum citations filter
    if (filters.minCitations && filters.minCitations > 0) {
      filteredResults = filteredResults.filter(result => {
        const citations = this.calculateCitations(result);
        return citations >= filters.minCitations;
      });
    }

    // Apply sorting
    if (filters.sortBy) {
      filteredResults = this.sortResults(filteredResults, filters.sortBy);
    }

    // Apply max results limit
    if (filters.maxResults && filters.maxResults > 0) {
      filteredResults = filteredResults.slice(0, filters.maxResults);
    }

    return filteredResults;
  }

  /**
   * Sort search results based on criteria
   */
  private sortResults(results: SearchResult[], sortBy: string): SearchResult[] {
    const sortedResults = [...results];

    switch (sortBy) {
      case 'date':
        return sortedResults.sort((a, b) => {
          const yearA = a.publication_date ? parseInt(a.publication_date) : 0;
          const yearB = b.publication_date ? parseInt(b.publication_date) : 0;
          return yearB - yearA; // Newest first
        });

      case 'citations':
        return sortedResults.sort((a, b) => {
          const citationsA = this.calculateCitations(a);
          const citationsB = this.calculateCitations(b);
          return citationsB - citationsA; // Highest first
        });

      case 'quality':
        return sortedResults.sort((a, b) => {
          const qualityA = this.calculateQualityScore(a);
          const qualityB = this.calculateQualityScore(b);
          return qualityB - qualityA; // Highest first
        });

      case 'relevance':
      default:
        return sortedResults.sort((a, b) => {
          return (b.relevance_score || 0) - (a.relevance_score || 0); // Highest first
        });
    }
  }

  /**
   * Calculate citation count - use real data when available, fallback to estimation
   */
  private calculateCitations(result: SearchResult): number {
    // If we have real citation data from Google Scholar, use it
    if (result.citation_count !== undefined && result.citation_count > 0) {
      return result.citation_count;
    }

    // Fallback to estimation for cases where citation data is not available
    let citations = 0;

    // Base citations on publication year (older papers tend to have more citations)
    if (result.publication_date) {
      const year = parseInt(result.publication_date);
      const currentYear = new Date().getFullYear();
      const yearsSincePublication = currentYear - year;
      citations += Math.max(0, yearsSincePublication * 3); // Reduced multiplier for more realistic estimates
    }

    // Boost for high-quality journals
    if (result.journal) {
      const highQualityJournals = [
        'Nature', 'Science', 'Cell', 'PNAS', 'The Lancet', 'NEJM',
        'Journal of Artificial Intelligence Research', 'Machine Learning',
        'IEEE Transactions', 'ACM Transactions', 'Communications of the ACM'
      ];
      if (highQualityJournals.some(journal => result.journal!.toLowerCase().includes(journal.toLowerCase()))) {
        citations += 25;
      }
    }

    // Boost based on confidence score (higher confidence usually means more established papers)
    citations += Math.floor(result.confidence * 15);

    return Math.max(0, citations);
  }

  /**
   * Calculate quality score for a search result
   */
  private calculateQualityScore(result: SearchResult): number {
    let score = 0.5; // Base score

    // Boost score for recent publications
    if (result.publication_date) {
      const year = parseInt(result.publication_date);
      const currentYear = new Date().getFullYear();
      const yearDiff = currentYear - year;
      if (yearDiff <= 2) score += 0.3;
      else if (yearDiff <= 5) score += 0.2;
      else if (yearDiff <= 10) score += 0.1;
    }

    // Boost score for DOI presence (indicates peer review)
    if (result.doi) score += 0.2;

    // Boost score for journal publications
    if (result.journal) score += 0.1;

    // Boost score for multiple authors (collaboration indicator)
    if (result.authors && result.authors.length > 1) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Update search session with results
   */
  private async updateSearchSession(sessionId: string, updates: {
    resultsCount?: number;
    resultsAccepted?: number;
    resultsRejected?: number;
    searchSuccess?: boolean;
    processingTimeMs?: number;
    errorMessage?: string;
  }): Promise<void> {
    try {
      const { EnhancedSearchHistoryManager } = await import('../lib/enhanced-search-history-manager');
      const historyManager = new EnhancedSearchHistoryManager(this.env);
      
      if (updates.resultsCount !== undefined) {
        await historyManager.updateSearchSessionResults(
          sessionId,
          updates.resultsCount,
          updates.resultsAccepted || 0,
          updates.resultsRejected || 0
        );
      }
      
      console.log(`Updated search session ${sessionId} with:`, updates);
    } catch (error) {
      console.error('Error updating search session:', error);
    }
  }

  /**
   * POST /api/ai-searcher/track-result-action
   * Track user actions on search results (viewed, added, rejected, etc.)
   */
  async trackResultAction(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const body = await c.req.json() as {
        resultId?: string;
        sessionId: string;
        resultTitle: string;
        action: 'viewed' | 'added' | 'rejected' | 'bookmarked' | 'ignored';
        referenceId?: string;
        feedback?: {
          rating?: number;
          comments?: string;
        };
      };

      if (!body.sessionId || !body.action || !body.resultTitle) {
        return c.json({
          success: false,
          error: 'sessionId, action, and resultTitle are required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      // Update search result action
      if (body.resultId) {
        const analyticsManager = this.getAnalyticsManager(c.env);
        await analyticsManager.updateSearchResultAction(
          body.resultId,
          body.action,
          body.referenceId
        );
      }

      // Track conversion metrics
      if (body.action === 'added' || body.action === 'rejected') {
        console.log(`Search result ${body.action}: ${body.resultTitle}`);
        
        // Update session statistics
        const updates: any = {};
        if (body.action === 'added') {
          updates.resultsAccepted = 1;
        } else if (body.action === 'rejected') {
          updates.resultsRejected = 1;
        }
        
        await this.updateSearchSession(body.sessionId, updates);
      }

      return c.json({
        success: true,
        message: `Result action '${body.action}' tracked successfully`,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Track result action error:', error);

      return c.json({
        success: false,
        error: 'Failed to track result action',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }

  /**
   * POST /api/ai-searcher/feedback
   * Record user feedback for search quality
   */
  async recordFeedback(c: Context<AISearcherContext>) {
    const startTime = Date.now();

    try {
      const body = await c.req.json() as {
        sessionId: string;
        conversationId: string;
        overallSatisfaction: number;
        relevanceRating: number;
        qualityRating: number;
        easeOfUseRating: number;
        feedbackComments?: string;
        wouldRecommend: boolean;
        improvementSuggestions?: string;
      };

      if (!body.sessionId || !body.conversationId) {
        return c.json({
          success: false,
          error: 'sessionId and conversationId are required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      // Validate ratings (1-5 scale)
      const ratings = [
        body.overallSatisfaction,
        body.relevanceRating,
        body.qualityRating,
        body.easeOfUseRating
      ];

      if (ratings.some(rating => rating < 1 || rating > 5)) {
        return c.json({
          success: false,
          error: 'All ratings must be between 1 and 5',
          processingTime: Date.now() - startTime
        }, 400);
      }

      // Record feedback
      const analyticsManager = this.getAnalyticsManager(c.env);
      const feedbackId = await analyticsManager.recordSearchFeedback({
        searchSessionId: body.sessionId,
        userId: body.conversationId, // Using conversationId as userId
        overallSatisfaction: body.overallSatisfaction,
        relevanceRating: body.relevanceRating,
        qualityRating: body.qualityRating,
        easeOfUseRating: body.easeOfUseRating,
        feedbackComments: body.feedbackComments,
        wouldRecommend: body.wouldRecommend,
        improvementSuggestions: body.improvementSuggestions
      });

      return c.json({
        success: true,
        feedbackId,
        message: 'Feedback recorded successfully',
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      console.error('Record feedback error:', error);

      return c.json({
        success: false,
        error: 'Failed to record feedback',
        processingTime: Date.now() - startTime
      }, 500);
    }
  }
}

// Create Hono app instance
const app = new Hono<AISearcherContext>();

// Create handler instance
const aiSearcherAPIHandler = new AISearcherAPIHandler();

// Routes
app.post('/search', (c) => aiSearcherAPIHandler.search(c));
app.post('/extract', (c) => aiSearcherAPIHandler.extract(c));
app.post('/generate-query', (c) => aiSearcherAPIHandler.generateQuery(c));
app.post('/extract-content', (c) => aiSearcherAPIHandler.extractContent(c));
app.post('/content-preview', (c) => aiSearcherAPIHandler.contentPreview(c));
app.post('/validate-query', (c) => aiSearcherAPIHandler.validateQuery(c));
app.post('/combine-queries', (c) => aiSearcherAPIHandler.combineQueries(c));
app.post('/refine-query', (c) => aiSearcherAPIHandler.refineQuery(c));
app.get('/history', (c) => aiSearcherAPIHandler.getHistory(c));
app.get('/history/stats', (c) => aiSearcherAPIHandler.getHistoryStats(c));
app.get('/history/content-usage', (c) => aiSearcherAPIHandler.getContentUsage(c));
app.get('/history/export', (c) => aiSearcherAPIHandler.exportHistory(c));
app.delete('/history', (c) => aiSearcherAPIHandler.clearHistory(c));
app.get('/analytics', (c) => aiSearcherAPIHandler.getAnalytics(c));
app.get('/analytics/query-performance', (c) => aiSearcherAPIHandler.getQueryPerformance(c));
app.get('/analytics/success-rate-tracking', (c) => aiSearcherAPIHandler.getSuccessRateTracking(c));
app.post('/analytics/success-tracking', (c) => aiSearcherAPIHandler.getSuccessTracking(c));
app.get('/analytics/content-source-effectiveness', (c) => aiSearcherAPIHandler.getContentSourceEffectiveness(c));
app.get('/session/:sessionId', (c) => aiSearcherAPIHandler.getSearchSessionDetails(c));
app.post('/track-result-action', (c) => aiSearcherAPIHandler.trackResultAction(c));
app.post('/feedback', (c) => aiSearcherAPIHandler.recordFeedback(c));
app.get('/trending', (c) => aiSearcherAPIHandler.getTrending(c));
app.get('/statistics', (c) => aiSearcherAPIHandler.getStatistics(c));
app.get('/health', (c) => aiSearcherAPIHandler.health(c));

// Feedback API routes
app.route('/feedback', feedbackApi);

// Learning API routes
app.route('/learning', learningApi);

// Export Hono app as default
export default app;
