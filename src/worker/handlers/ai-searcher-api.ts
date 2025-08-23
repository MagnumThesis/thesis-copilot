import { Hono } from 'hono';
import { Context } from 'hono';
import { Env } from '../types/env';
import { QueryGenerationEngine, SearchQuery, QueryGenerationOptions } from '../lib/query-generation-engine';
import { ContentExtractionEngine } from '../lib/content-extraction-engine';
import { SearchAnalyticsManager } from '../lib/search-analytics-manager';
import { ExtractedContent } from '../../lib/ai-types';

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

  constructor() {
    this.queryEngine = new QueryGenerationEngine();
    this.contentEngine = new ContentExtractionEngine();
  }

  private getAnalyticsManager(env: any): SearchAnalyticsManager {
    return new SearchAnalyticsManager(env);
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

      // Record search session start
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

      // Simulate AI search - in a real implementation, this would call an AI service
      // For now, we'll return mock results that match the expected format
      const mockResults: SearchResult[] = [
        {
          title: "Machine Learning Approaches to Natural Language Processing",
          authors: ["Smith, J.", "Johnson, A.", "Williams, B."],
          journal: "Journal of Artificial Intelligence Research",
          publication_date: "2023",
          doi: "10.1234/jair.2023.12345",
          url: "https://doi.org/10.1234/jair.2023.12345",
          confidence: 0.92,
          relevance_score: 0.88,
          abstract: "This paper explores various machine learning approaches for natural language processing tasks...",
          keywords: ["machine learning", "NLP", "artificial intelligence"]
        },
        {
          title: "Deep Learning for Academic Writing Enhancement",
          authors: ["Brown, C.", "Davis, E."],
          journal: "International Journal of Computational Linguistics",
          publication_date: "2022",
          doi: "10.5678/ijcl.2022.67890",
          url: "https://doi.org/10.5678/ijcl.2022.67890",
          confidence: 0.87,
          relevance_score: 0.76,
          abstract: "A comprehensive study on using deep learning models to enhance academic writing quality...",
          keywords: ["deep learning", "academic writing", "writing enhancement"]
        },
        {
          title: "AI-Powered Reference Management Systems",
          authors: ["Wilson, M.", "Taylor, R.", "Anderson, S."],
          journal: "ACM Transactions on Information Systems",
          publication_date: "2024",
          doi: "10.9012/acm.2024.90123",
          url: "https://doi.org/10.9012/acm.2024.90123",
          confidence: 0.95,
          relevance_score: 0.91,
          abstract: "This research examines the design and implementation of AI-powered reference management systems...",
          keywords: ["reference management", "AI", "academic tools"]
        }
      ];

      // Record search results for analytics
      if (sessionId) {
        const analyticsManager = this.getAnalyticsManager(c.env);
        for (const result of mockResults) {
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
            citationCount: Math.floor(Math.random() * 100), // Mock citation count
            addedToLibrary: false
          });
        }

        // Update search session with results
        const processingTime = Date.now() - startTime;
        await this.updateSearchSession(sessionId, {
          resultsCount: mockResults.length,
          searchSuccess: true,
          processingTimeMs: processingTime
        });
      }

      const processingTime = Date.now() - startTime;

      return c.json({
        success: true,
        results: mockResults.map(result => ({
          ...result,
          sessionId // Include sessionId for frontend tracking
        })),
        total_results: mockResults.length,
        query: searchQuery,
        originalQuery: body.query,
        generatedQueries: generatedQueries.length > 0 ? generatedQueries : undefined,
        extractedContent: extractedContent.length > 0 ? extractedContent : undefined,
        filters: body.filters,
        sessionId,
        processingTime
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

      // Simulate metadata extraction
      const mockMetadata: SearchResult = {
        title: "Extracted Paper Title",
        authors: ["Author, A.", "Author, B."],
        journal: "Sample Journal",
        publication_date: "2023",
        doi: body.source.includes('doi.org') ? body.source.split('doi.org/')[1] : undefined,
        url: body.source,
        confidence: 0.85,
        relevance_score: 0.7,
        abstract: "This is a simulated abstract extracted from the provided source.",
        keywords: ["extracted", "metadata", "academic"]
      };

      return c.json({
        success: true,
        metadata: mockMetadata,
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
   * Get search history for a conversation
   */
  async getHistory(c: Context<AISearcherContext>) {
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

      // Mock search history
      const mockHistory: SearchHistoryEntry[] = [
        {
          id: "search_1",
          query: "machine learning",
          timestamp: Date.now() - 86400000, // 1 day ago
          results_count: 25,
          conversationId
        },
        {
          id: "search_2",
          query: "natural language processing",
          timestamp: Date.now() - 3600000, // 1 hour ago
          results_count: 18,
          conversationId
        }
      ];

      return c.json({
        success: true,
        history: mockHistory,
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
   * DELETE /api/ai-searcher/history
   * Clear search history
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

      // Simulate clearing history
      return c.json({
        success: true,
        message: 'Search history cleared successfully',
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
          extractedContents.push(extracted);
        } catch (error) {
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
      // This would typically update the database record
      // For now, we'll just log the update
      console.log(`Updating search session ${sessionId}:`, updates);
      
      // In a real implementation, this would call the analytics manager
      // to update the search session record in the database
    } catch (error) {
      console.error('Failed to update search session:', error);
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
app.post('/validate-query', (c) => aiSearcherAPIHandler.validateQuery(c));
app.post('/combine-queries', (c) => aiSearcherAPIHandler.combineQueries(c));
app.post('/refine-query', (c) => aiSearcherAPIHandler.refineQuery(c));
app.get('/history', (c) => aiSearcherAPIHandler.getHistory(c));
app.delete('/history', (c) => aiSearcherAPIHandler.clearHistory(c));
app.get('/analytics', (c) => aiSearcherAPIHandler.getAnalytics(c));
app.post('/track-result-action', (c) => aiSearcherAPIHandler.trackResultAction(c));
app.post('/feedback', (c) => aiSearcherAPIHandler.recordFeedback(c));
app.get('/trending', (c) => aiSearcherAPIHandler.getTrending(c));
app.get('/statistics', (c) => aiSearcherAPIHandler.getStatistics(c));
app.get('/health', (c) => aiSearcherAPIHandler.health(c));

// Export Hono app as default
export default app;
