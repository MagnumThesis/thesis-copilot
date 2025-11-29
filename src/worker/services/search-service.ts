// src/worker/services/search-service.ts
// Service for search and extract operations (modular refactor)

import { QueryGenerationEngine, SearchQuery, QueryGenerationOptions } from '../lib/query-generation-engine';
import { ContentExtractionEngine } from '../lib/content-extraction-engine';
import { SearchAnalyticsManager } from '../lib/search-analytics-manager';
import { FeedbackLearningSystem } from '../lib/feedback-learning-system';
import { EnhancedGoogleScholarClient } from '../lib/enhanced-google-scholar-client';
import { ExtractedContent, ScholarSearchResult, SearchFilters } from '../../lib/ai-types';
import { AISearcherPerformanceOptimizer } from '../../lib/ai-searcher-performance-optimizer';
import { 
  AISearcherErrorHandler, 
  AISearcherError, 
  AISearcherErrorType 
} from '../../lib/ai-searcher-error-handling';
import { AISearcherMonitoringService } from '../../lib/ai-searcher-monitoring';

interface SearchRequest {
  query?: string;
  conversationId: string;
  userId?: string;
  contentSources?: Array<{
    source: "ideas" | "builder";
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
    sortBy?: "relevance" | "date" | "citations" | "quality";
    publicationDate?: string;
    author?: string;
    journal?: string;
    doi?: string;
  };
}

interface ExtractRequest {
  source: string;
  type: "doi" | "url";
  conversationId: string;
}

interface SearchResult {
  title: string;
  authors: string[];
  journal?: string;
  publication_date?: string;
  doi?: string;
  url?: string;
  confidence?: number;
  relevance_score?: number;
  abstract?: string;
  keywords?: string[];
  citation_count?: number;
  learningAdjustments?: any;
}

export interface SearchServiceRequest {
  query: string;
  conversationId: string;
  userId?: string;
  filters?: Record<string, any>;
  options?: Record<string, any>;
}

export interface SearchServiceResponse {
  results: any[];
  metadata: Record<string, any>;
  analytics?: Record<string, any>;
}

export class SearchService {
  private static queryEngine: QueryGenerationEngine;
  private static contentEngine: ContentExtractionEngine;
  private static performanceOptimizer: AISearcherPerformanceOptimizer;
  private static errorHandler: AISearcherErrorHandler;
  private static monitoringService: AISearcherMonitoringService;
  private static scholarClient: EnhancedGoogleScholarClient;

  private static initializeServices(env: any) {
    if (!this.queryEngine) {
      this.queryEngine = new QueryGenerationEngine();
      this.contentEngine = new ContentExtractionEngine(env);
      this.performanceOptimizer = new AISearcherPerformanceOptimizer();
      this.errorHandler = AISearcherErrorHandler.getInstance();
      this.monitoringService = AISearcherMonitoringService.getInstance({
        enabled: true,
        logLevel: 'info',
        retentionPeriod: 7,
        batchSize: 100,
        flushInterval: 5000,
        enablePerformanceTracking: true,
        enableUserTracking: true,
        enableAlerts: true,
        maxEventsInMemory: 1000
      });
      this.scholarClient = new EnhancedGoogleScholarClient();
    }
  }

  private static getAnalyticsManager(env: any): SearchAnalyticsManager {
    return new SearchAnalyticsManager(env);
  }

  private static calculateQualityScore(result: SearchResult): number {
    let score = 0.5; // Base score
    
    if (result.citation_count && result.citation_count > 0) {
      score += Math.min(0.3, result.citation_count / 100);
    }
    
    if (result.journal) {
      score += 0.1;
    }
    
    if (result.doi) {
      score += 0.1;
    }
    
    return Math.min(1.0, score);
  }

  private static applyFilters(results: SearchResult[], filters: any): SearchResult[] {
    let filteredResults = results;

    if (filters.authors && filters.authors.length > 0) {
      filteredResults = filteredResults.filter(result =>
        result.authors.some(author =>
          filters.authors.some((filterAuthor: string) =>
            author.toLowerCase().includes(filterAuthor.toLowerCase())
          )
        )
      );
    }

    if (filters.journals && filters.journals.length > 0) {
      filteredResults = filteredResults.filter(result =>
        result.journal &&
        filters.journals.some((filterJournal: string) =>
          result.journal!.toLowerCase().includes(filterJournal.toLowerCase())
        )
      );
    }

    if (filters.minCitations) {
      filteredResults = filteredResults.filter(result =>
        result.citation_count && result.citation_count >= filters.minCitations
      );
    }

    return filteredResults;
  }

  private static async updateSearchSession(env: any, sessionId: string, updates: any) {
    try {
      const analyticsManager = this.getAnalyticsManager(env);
      // Implementation would depend on your analytics manager API
      console.log(`Updating search session ${sessionId}:`, updates);
    } catch (error) {
      console.error('Failed to update search session:', error);
    }
  }

  private static async handleSearchError(error: any, query: string, context: any) {
    // Simplified error handling - return basic fallback
    return {
      fallbackResults: [] as any[],
      aiSearcherError: {
        type: 'SEARCH_FAILED' as AISearcherErrorType,
        severity: 'medium' as any,
        userMessage: 'Search temporarily unavailable. Please try again.',
        message: error?.message || 'Search failed',
        technicalMessage: error?.stack || 'Unknown error',
        timestamp: new Date(),
        operation: 'search',
        recoveryActions: [],
        retryable: true,
        fallbackAvailable: false
      } as any
    };
  }

  /**
   * Processes a search request
   */
  static async search(req: SearchServiceRequest, env?: any): Promise<SearchServiceResponse> {
    const startTime = Date.now();
    let sessionId: string | null = null;

    try {
      this.initializeServices(env);

      // Convert SearchServiceRequest to SearchRequest with proper mapping and type guards
      const options = req.options ?? {};
      const body: SearchRequest = {
        query: req.query,
        conversationId: req.conversationId,
        userId: req.userId,
        contentSources: Array.isArray(options.contentSources) ? options.contentSources : [],
        queryOptions: typeof options.queryOptions === 'object' && options.queryOptions !== null ? options.queryOptions : undefined,
        filters: req.filters
      };

      if (!body.conversationId) {
        throw new Error("conversationId is required");
      }

      let searchQuery = body.query;
      let generatedQueries: SearchQuery[] = [];
      let extractedContent: ExtractedContent[] = [];

      // If no query provided but content sources are available, generate query
      if (!searchQuery && body.contentSources && body.contentSources.length > 0) {
        try {
          // Extract content from sources with caching
          for (const source of body.contentSources) {
            let extracted = this.performanceOptimizer.getCachedContentExtraction(
              body.conversationId,
              source.source,
              source.id
            );

            if (!extracted) {
              extracted = await this.contentEngine.extractContent({
                source: source.source,
                id: source.id,
                conversationId: body.conversationId,
              });

              this.performanceOptimizer.cacheContentExtraction(
                body.conversationId,
                source.source,
                source.id,
                extracted
              );
            }

            extractedContent.push(extracted);
          }

          // Generate queries with caching
          if (extractedContent.length > 0) {
            const queryOptions = body.queryOptions || {};
            
            let cachedQueries = this.performanceOptimizer.getCachedQueryGeneration(
              extractedContent,
              queryOptions
            );

            if (cachedQueries) {
              generatedQueries = cachedQueries;
            } else {
              generatedQueries = this.queryEngine.generateQueries(
                extractedContent,
                queryOptions
              );
              this.performanceOptimizer.cacheQueryGeneration(
                extractedContent,
                queryOptions,
                generatedQueries
              );
            }

            searchQuery = generatedQueries[0]?.query;
          }
        } catch (error) {
          console.warn("Failed to generate query from content sources:", error);
        }
      }

      if (!searchQuery) {
        throw new Error("Query is required (either directly or via content sources)");
      }

      // Record search session start
      try {
        if (env) {
          const analyticsManager = this.getAnalyticsManager(env);
          const contentSources = body.contentSources?.map((cs) => cs.source) || [];
          const effectiveUserId = body.userId || body.conversationId;
          console.log("[ANALYTICS DEBUG] Recording search session:", {
            conversationId: body.conversationId,
            userId: effectiveUserId,
            providedUserId: body.userId,
            searchQuery
          });
          sessionId = await analyticsManager.recordSearchSession({
            conversationId: body.conversationId,
            userId: effectiveUserId,
            searchQuery,
            contentSources,
            searchFilters: body.filters || {},
            resultsCount: 0,
            resultsAccepted: 0,
            resultsRejected: 0,
            searchSuccess: false,
            processingTimeMs: 0,
          });
          console.log("[ANALYTICS DEBUG] Recorded session with ID:", sessionId);
        }
      } catch (analyticsError) {
        console.error("Error recording search session:", analyticsError);
        sessionId = crypto.randomUUID();
      }

      // Perform enhanced Google Scholar search
      let scholarResults: ScholarSearchResult[] = [];
      let searchSource = 'google_scholar';
      let fallbackUsed = false;
      let degradedMode = false;
      let searchError: AISearcherError | undefined;

      try {
        const enhancedSearchOptions = {
          maxResults: body.filters?.maxResults || 20,
          sortBy: (body.filters?.sortBy === "date" ? "date" : "relevance") as "date" | "relevance",
          includePatents: false,
          includeCitations: true,
          yearStart: body.filters?.dateRange?.start,
          yearEnd: body.filters?.dateRange?.end,
          enableFallback: true,
          enableDegradedMode: true,
          context: {
            conversationId: body.conversationId,
            sessionId: sessionId || undefined,
            requestId: crypto.randomUUID()
          }
        };

        this.monitoringService?.logInfo(
          `Starting search for query: "${searchQuery}"`,
          'search',
          { options: enhancedSearchOptions },
          { conversationId: body.conversationId, sessionId: sessionId || undefined }
        );

        const searchStartTime = Date.now();
        const searchResult = await this.scholarClient.search(searchQuery, enhancedSearchOptions);
        const searchDuration = Date.now() - searchStartTime;

        scholarResults = searchResult.results;
        searchSource = searchResult.source;
        fallbackUsed = searchResult.fallbackUsed;
        degradedMode = searchResult.degradedMode;
        searchError = searchResult.error;

        // Cache successful results
        if (!degradedMode && scholarResults.length > 0) {
          const searchFilters: SearchFilters = body.filters || {};
          this.performanceOptimizer.cacheSearchResults(
            searchQuery,
            searchFilters,
            scholarResults,
            searchDuration
          );
        }

        console.log(
          `Enhanced search completed: ${scholarResults.length} results from ${searchSource} in ${searchDuration}ms`
        );

      } catch (error) {
        console.error("Enhanced search failed:", error);

        const errorHandling = await this.handleSearchError(
          error,
          searchQuery,
          {
            conversationId: body.conversationId,
            sessionId,
            requestId: crypto.randomUUID()
          }
        );

        scholarResults = errorHandling.fallbackResults.map((result: any) => ({
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
          citation_count: result.citation_count,
        }));

        searchSource = 'error_fallback';
        degradedMode = true;
        searchError = errorHandling.aiSearcherError;
      }

      // Convert ScholarSearchResult to SearchResult format
      let searchResults: SearchResult[] = scholarResults.map((result) => ({
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
        citation_count: result.citation_count,
      }));

      // Apply additional filters
      if (body.filters) {
        searchResults = this.applyFilters(searchResults, body.filters);
      }

      // Apply learning-based ranking to results
      let finalResults = searchResults;
      try {
        if (env) {
          const learningSystem = new FeedbackLearningSystem(env);
          const userId = body.conversationId;

          const searchResultsForLearning = searchResults.map((result) => ({
            id: crypto.randomUUID(),
            searchSessionId: sessionId || "",
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
            createdAt: new Date(),
          }));

          const rankedResults = await learningSystem.applyFeedbackBasedRanking(
            userId,
            searchResultsForLearning
          );

          finalResults = rankedResults.map((result) => {
            const originalResult = searchResults.find((sr) => sr.title === result.resultTitle);
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
              citation_count: originalResult?.citation_count,
              learningAdjustments: (result as any).learningAdjustments,
            };
          });

          console.log(`Applied learning-based ranking for user ${userId}: ${rankedResults.length} results`);
        }
      } catch (learningError) {
        console.warn("Failed to apply learning-based ranking, using original results:", learningError);
      }

      // Record search results for analytics
      if (sessionId && env) {
        try {
          const analyticsManager = this.getAnalyticsManager(env);
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
              citationCount: result.citation_count || 0,
              addedToLibrary: false,
            });
          }

          const processingTime = Date.now() - startTime;
          await this.updateSearchSession(env, sessionId, {
            resultsCount: finalResults.length,
            searchSuccess: true,
            processingTimeMs: processingTime,
          });
        } catch (analyticsError) {
          console.error("Error recording search analytics:", analyticsError);
        }
      }

      const processingTime = Date.now() - startTime;

      // Initialize progressive loading if results are large
      let progressiveLoadingState = null;
      let initialResults = finalResults;

      if (finalResults.length > 10) {
        progressiveLoadingState = this.performanceOptimizer.initializeProgressiveLoading(
          sessionId || crypto.randomUUID(),
          finalResults.length,
          10
        );

        const firstBatch = this.performanceOptimizer.getNextBatch(
          progressiveLoadingState.sessionId,
          finalResults
        );

        initialResults = firstBatch.batch;
      }

      return {
        results: initialResults.map((result) => ({
          ...result,
          sessionId,
        })),
        metadata: {
          success: true,
          total_results: finalResults.length,
          loaded_results: initialResults.length,
          has_more: progressiveLoadingState?.hasMore || false,
          progressive_loading_session: progressiveLoadingState?.sessionId,
          query: searchQuery,
          originalQuery: body.query,
          generatedQueries: generatedQueries.length > 0 ? generatedQueries : undefined,
          extractedContent: extractedContent.length > 0 ? extractedContent : undefined,
          filters: body.filters,
          sessionId,
          processingTime,
          learningApplied: true,
          performance_metrics: this.performanceOptimizer.getMetrics(),
          search_metadata: {
            source: searchSource,
            fallback_used: fallbackUsed,
            degraded_mode: degradedMode,
            error_handled: searchError ? {
              type: searchError.type,
              severity: searchError.severity,
              user_message: searchError.userMessage,
              recovery_actions: searchError.recoveryActions.map(action => ({
                type: action.type,
                label: action.label,
                description: action.description,
                priority: action.priority
              }))
            } : undefined
          }
        }
      };
    } catch (error) {
      console.error("AI Search error:", error);

      if (sessionId && env) {
        try {
          await this.updateSearchSession(env, sessionId, {
            resultsCount: 0,
            searchSuccess: false,
            processingTimeMs: Date.now() - startTime,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          });
        } catch (updateError) {
          console.error("Error updating failed search session:", updateError);
        }
      }

      throw error;
    }
  }

  /**
   * Processes an extract request
   */
  static async extract(req: SearchServiceRequest, env?: any): Promise<SearchServiceResponse> {
    const startTime = Date.now();

    try {
      this.initializeServices(env);

      const body = req as any as ExtractRequest;

      if (!body.source || !body.conversationId) {
        throw new Error("Source and conversationId are required");
      }

      let extractedMetadata: SearchResult | null = null;

      try {
        if (body.type === "doi" || body.source.includes("doi.org")) {
          // Extract DOI and search for it
          let doi = body.source;
          if (body.source.includes("doi.org/")) {
            doi = body.source.split("doi.org/")[1];
          }

          const searchQuery = `"${doi}"`;
          const results = await this.scholarClient.search(searchQuery, {
            maxResults: 1,
          });

          if (results && results.results.length > 0) {
            const result = results.results[0];
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
              keywords: result.keywords,
            };
          }
        } else if (body.type === "url") {
          // For URLs, try to extract title and search for it
          const urlParts = body.source.split("/");
          const possibleTitle = urlParts[urlParts.length - 1]
            .replace(/[-_]/g, " ")
            .replace(/\.(pdf|html|htm)$/i, "");

          if (possibleTitle.length > 3) {
            const results = await this.scholarClient.search(possibleTitle, {
              maxResults: 3,
            });

            if (results && results.results.length > 0) {
              const bestResult = results.results[0];
              extractedMetadata = {
                title: bestResult.title,
                authors: bestResult.authors,
                journal: bestResult.journal,
                publication_date: bestResult.publication_date || bestResult.year?.toString(),
                doi: bestResult.doi,
                url: bestResult.url || body.source,
                confidence: Math.max(0.3, bestResult.confidence - 0.2),
                relevance_score: bestResult.relevance_score,
                abstract: bestResult.abstract,
                keywords: bestResult.keywords,
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
            doi: body.type === "doi" ? body.source : undefined,
            url: body.source,
            confidence: 0.1,
            relevance_score: 0.1,
            abstract: "Metadata extraction failed. Please verify the source and try again.",
            keywords: [],
          };
        }
      } catch (extractionError) {
        console.error("Real metadata extraction failed:", extractionError);

        extractedMetadata = {
          title: "Extraction Failed",
          authors: ["Unknown Author"],
          journal: undefined,
          publication_date: undefined,
          doi: body.type === "doi" ? body.source : undefined,
          url: body.source,
          confidence: 0.1,
          relevance_score: 0.1,
          abstract: `Failed to extract metadata: ${
            extractionError instanceof Error ? extractionError.message : "Unknown error"
          }`,
          keywords: [],
        };
      }

      return {
        results: [extractedMetadata],
        metadata: {
          success: true,
          processingTime: Date.now() - startTime,
        }
      };
    } catch (error) {
      console.error("Metadata extraction error:", error);
      throw error;
    }
  }
}
