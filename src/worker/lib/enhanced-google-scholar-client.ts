/**
 * Enhanced Google Scholar Client with Comprehensive Error Handling
 * 
 * This enhanced version integrates with the AI Searcher Error Handling system
 * to provide graceful degradation, fallback mechanisms, and comprehensive
 * error recovery for Google Scholar search operations.
 */

import { GoogleScholarClient, SearchOptions, SearchError } from './google-scholar-client';
import { ScholarSearchResult } from '../../lib/ai-types';
import {
  AISearcherErrorHandler,
  AISearcherErrorType,
  AISearcherError,
  FallbackService,
  DEFAULT_FALLBACK_CONFIG
} from '../../lib/ai-searcher-error-handling';

export interface EnhancedSearchOptions extends SearchOptions {
  enableFallback?: boolean;
  enableDegradedMode?: boolean;
  maxFallbackAttempts?: number;
  fallbackTimeout?: number;
  context?: {
    conversationId?: string;
    sessionId?: string;
    requestId?: string;
  };
}

export interface SearchResult {
  results: ScholarSearchResult[];
  source: 'google_scholar' | 'semantic_scholar' | 'crossref' | 'degraded_mode';
  success: boolean;
  error?: AISearcherError;
  fallbackUsed: boolean;
  degradedMode: boolean;
  processingTime: number;
  retryCount: number;
}

/**
 * Enhanced Google Scholar Client with comprehensive error handling
 */
export class EnhancedGoogleScholarClient {
  private baseClient: GoogleScholarClient;
  private errorHandler: AISearcherErrorHandler;
  private fallbackServices: Map<string, FallbackService> = new Map();

  constructor(
    rateLimitConfig?: any,
    fallbackConfig?: any,
    errorHandlingConfig?: any
  ) {
    this.baseClient = new GoogleScholarClient(
      rateLimitConfig,
      fallbackConfig,
      errorHandlingConfig
    );
    
    this.errorHandler = AISearcherErrorHandler.getInstance();
    this.initializeFallbackServices();
  }

  /**
   * Enhanced search with comprehensive error handling and fallback mechanisms
   * NOW USES FREE APIs (Semantic Scholar, CrossRef, arXiv) AS PRIMARY SOURCES
   */
  async search(
    query: string,
    options: EnhancedSearchOptions = {}
  ): Promise<SearchResult> {
    const startTime = Date.now();
    let retryCount = 0;
    let fallbackUsed = false;
    let degradedMode = false;
    let lastError: AISearcherError | undefined;

    const context = {
      conversationId: options.context?.conversationId,
      sessionId: options.context?.sessionId,
      requestId: options.context?.requestId || this.generateRequestId(),
      query,
      searchFilters: options
    };

    // NEW: Try free APIs first (no rate limits!)
    try {
      console.log('[Enhanced Search] Using free APIs (Semantic Scholar + CrossRef + arXiv)');
      
      // Search all three APIs in parallel
      const [semanticResults, crossrefResults, arxivResults] = await Promise.allSettled([
        this.executeSemanticScholarSearch(query, options).catch(() => []),
        this.executeCrossRefSearch(query, options).catch(() => []),
        this.executeArXivSearch(query, options).catch(() => [])
      ]);

      // Combine results
      let combinedResults: ScholarSearchResult[] = [];
      
      if (semanticResults.status === 'fulfilled') {
        combinedResults.push(...semanticResults.value);
      }
      if (crossrefResults.status === 'fulfilled') {
        combinedResults.push(...crossrefResults.value);
      }
      if (arxivResults.status === 'fulfilled') {
        combinedResults.push(...arxivResults.value);
      }

      // If we got results from free APIs, return them
      if (combinedResults.length > 0) {
        // Deduplicate by title and sort by confidence
        combinedResults = this.deduplicateResults(combinedResults);
        
        return {
          results: combinedResults.slice(0, options.maxResults || 20),
          source: 'semantic_scholar', // Primary source indicator
          success: true,
          fallbackUsed: false,
          degradedMode: false,
          processingTime: Date.now() - startTime,
          retryCount: 0
        };
      }
      
    } catch (freeApiError) {
      console.warn('[Enhanced Search] Free APIs failed, trying Google Scholar:', freeApiError);
    }

    // FALLBACK: Try Google Scholar only if free APIs failed
    try {
      const results = await this.errorHandler.executeWithRetry(
        async () => {
          retryCount++;
          return await this.baseClient.search(query, options);
        },
        'search',
        context
      );

      return {
        results,
        source: 'google_scholar',
        success: true,
        fallbackUsed: false,
        degradedMode: false,
        processingTime: Date.now() - startTime,
        retryCount
      };

    } catch (primaryError) {
      // Handle primary search failure
      lastError = await this.errorHandler.handleError(
        primaryError,
        'search',
        context
      );

      // Attempt fallback if enabled and available
      if (options.enableFallback !== false && lastError.fallbackAvailable) {
        try {
          const fallbackResult = await this.attemptFallbackSearch(
            query,
            options,
            context
          );
          
          if (fallbackResult.results && fallbackResult.results.length > 0) {
            return {
              ...fallbackResult,
              success: true,
              fallbackUsed: true,
              processingTime: Date.now() - startTime,
              retryCount
            } as any;
          }
        } catch (fallbackError) {
          console.warn('Fallback search failed:', fallbackError);
        }
      }

      // Attempt degraded mode if enabled
      if (options.enableDegradedMode !== false) {
        try {
          const degradedResult = await this.executeDegradedMode(
            query,
            options,
            context
          );

          return {
            results: degradedResult.results,
            source: 'degraded_mode',
            success: true,
            error: lastError,
            fallbackUsed,
            degradedMode: true,
            processingTime: Date.now() - startTime,
            retryCount
          };
        } catch (degradedError) {
          console.warn('Degraded mode failed:', degradedError);
        }
      }

      // If all recovery mechanisms failed, return error result
      return {
        results: [],
        source: 'google_scholar',
        success: false,
        error: lastError,
        fallbackUsed,
        degradedMode,
        processingTime: Date.now() - startTime,
        retryCount
      };
    }
  }

  /**
   * Attempt fallback search using alternative services
   */
  private async attemptFallbackSearch(
    query: string,
    options: EnhancedSearchOptions,
    context: any
  ): Promise<Partial<SearchResult>> {
    const fallbackServices = Array.from(this.fallbackServices.values())
      .filter(service => service.enabled && service.type === 'search')
      .sort((a, b) => a.priority - b.priority);

    for (const service of fallbackServices) {
      try {
        // Check service health
        const isHealthy = await Promise.race([
          service.healthCheck(),
          this.timeoutPromise(5000, false)
        ]);

        if (!isHealthy) {
          console.warn(`Fallback service ${service.name} failed health check`);
          continue;
        }

        console.log(`Attempting fallback search with ${service.name}`);

        // Execute fallback search
        const results = await Promise.race([
          service.execute({ query, options, context }),
          this.timeoutPromise(options.fallbackTimeout || 15000, null)
        ]);

        if (results && results.length > 0) {
          console.log(`Fallback service ${service.name} returned ${results.length} results`);
          
          return {
            results: this.normalizeResults(results, service.name),
            source: service.name as any
          };
        }

      } catch (error) {
        console.warn(`Fallback service ${service.name} failed:`, error);
        continue;
      }
    }

    throw new Error('All fallback services failed');
  }

  /**
   * Execute degraded mode when all other options fail
   */
  private async executeDegradedMode(
    query: string,
    options: EnhancedSearchOptions,
    context: any
  ): Promise<{ results: ScholarSearchResult[] }> {
    console.log('Executing degraded mode for search');

    // Create a helpful fallback result that guides the user
    const degradedResults: ScholarSearchResult[] = [{
      title: `Search temporarily unavailable: "${query}"`,
      authors: ['System Message'],
      journal: 'Thesis Copilot',
      year: new Date().getFullYear(),
      publication_date: new Date().getFullYear().toString(),
      confidence: 0.1,
      relevance_score: 0.1,
      abstract: `We're currently unable to search academic databases. You can try again later or search manually using your query: "${query}". Alternative options: 1) Try a simpler search query, 2) Search directly on Google Scholar, 3) Use your institution's library database.`,
      keywords: ['search', 'unavailable', 'retry', 'manual'],
      url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
      citation_count: 0
    }];

    // Add additional helpful results if we have context
    if (context.contentSources && context.contentSources.length > 0) {
      degradedResults.push({
        title: 'Alternative: Manual Reference Entry',
        authors: ['Thesis Copilot'],
        journal: 'System Suggestion',
        year: new Date().getFullYear(),
        publication_date: new Date().getFullYear().toString(),
        confidence: 0.2,
        relevance_score: 0.2,
        abstract: 'Consider manually entering references you already know are relevant to your research. You can add them directly to your reference library.',
        keywords: ['manual', 'entry', 'alternative'],
        citation_count: 0
      });
    }

    return { results: degradedResults };
  }

  /**
   * Initialize fallback services for alternative search sources
   */
  private initializeFallbackServices(): void {
    // Semantic Scholar fallback
    this.fallbackServices.set('semantic_scholar', {
      name: 'semantic_scholar',
      type: 'search',
      priority: 1,
      enabled: true,
      healthCheck: async () => {
        try {
          // Simple health check - try to reach the API
          const response = await fetch('https://api.semanticscholar.org/graph/v1/paper/search?query=test&limit=1', {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });
          return response.ok;
        } catch {
          return false;
        }
      },
      execute: async (params) => {
        return await this.executeSemanticScholarSearch(params.query, params.options);
      }
    });

    // CrossRef fallback
    this.fallbackServices.set('crossref', {
      name: 'crossref',
      type: 'search',
      priority: 2,
      enabled: true,
      healthCheck: async () => {
        try {
          const response = await fetch('https://api.crossref.org/works?query=test&rows=1', {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });
          return response.ok;
        } catch {
          return false;
        }
      },
      execute: async (params) => {
        return await this.executeCrossRefSearch(params.query, params.options);
      }
    });

    // arXiv fallback (for preprints)
    this.fallbackServices.set('arxiv', {
      name: 'arxiv',
      type: 'search',
      priority: 3,
      enabled: true,
      healthCheck: async () => {
        try {
          const response = await fetch('http://export.arxiv.org/api/query?search_query=all:test&max_results=1', {
            method: 'GET'
          });
          return response.ok;
        } catch {
          return false;
        }
      },
      execute: async (params) => {
        return await this.executeArXivSearch(params.query, params.options);
      }
    });
  }

  /**
   * Execute Semantic Scholar search as fallback
   */
  private async executeSemanticScholarSearch(
    query: string,
    options: EnhancedSearchOptions
  ): Promise<ScholarSearchResult[]> {
    const maxResults = Math.min(options.maxResults || 20, 100);
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${maxResults}&fields=title,authors,journal,year,abstract,citationCount,url,externalIds`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Thesis-Copilot/1.0 (Academic Research Tool)'
      }
    });

    if (!response.ok) {
      throw new Error(`Semantic Scholar API error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    
    if (!data?.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((paper: any) => ({
      title: paper.title || 'Untitled',
      authors: paper.authors?.map((author: any) => author.name) || ['Unknown Author'],
      journal: paper.journal?.name || paper.venue,
      year: paper.year,
      publication_date: paper.year?.toString(),
      abstract: paper.abstract,
      url: paper.url || (paper.externalIds?.DOI ? `https://doi.org/${paper.externalIds.DOI}` : undefined),
      doi: paper.externalIds?.DOI,
      citation_count: paper.citationCount,
      confidence: 0.7, // Lower confidence for fallback
      relevance_score: 0.6,
      keywords: []
    }));
  }

  /**
   * Execute CrossRef search as fallback
   */
  private async executeCrossRefSearch(
    query: string,
    options: EnhancedSearchOptions
  ): Promise<ScholarSearchResult[]> {
    const maxResults = Math.min(options.maxResults || 20, 100);
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${maxResults}&select=title,author,container-title,published-print,abstract,DOI,URL,is-referenced-by-count`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Thesis-Copilot/1.0 (Academic Research Tool; mailto:support@thesiscopilot.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`CrossRef API error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    
    if (!data?.message?.items || !Array.isArray(data.message.items)) {
      return [];
    }

    return data.message.items.map((item: any) => ({
      title: Array.isArray(item.title) ? item.title[0] : item.title || 'Untitled',
      authors: item.author?.map((author: any) => `${author.given || ''} ${author.family || ''}`.trim()) || ['Unknown Author'],
      journal: Array.isArray(item['container-title']) ? item['container-title'][0] : item['container-title'],
      year: item['published-print']?.['date-parts']?.[0]?.[0],
      publication_date: item['published-print']?.['date-parts']?.[0]?.[0]?.toString(),
      abstract: item.abstract,
      url: item.URL,
      doi: item.DOI,
      citation_count: item['is-referenced-by-count'],
      confidence: 0.6, // Lower confidence for fallback
      relevance_score: 0.5,
      keywords: []
    }));
  }

  /**
   * Execute arXiv search as fallback
   */
  private async executeArXivSearch(
    query: string,
    options: EnhancedSearchOptions
  ): Promise<ScholarSearchResult[]> {
    const maxResults = Math.min(options.maxResults || 20, 100);
    const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=${maxResults}`;

    const response = await fetch(url, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status}`);
    }

    const xmlText = await response.text();
    
    // Simple XML parsing for arXiv results
    const results = this.parseArXivXML(xmlText);
    
    return results.map(result => ({
      ...result,
      confidence: 0.5, // Lower confidence for preprints
      relevance_score: 0.4
    }));
  }

  /**
   * Parse arXiv XML response
   */
  private parseArXivXML(xmlText: string): ScholarSearchResult[] {
    const results: ScholarSearchResult[] = [];
    
    // Simple regex-based XML parsing (in production, use a proper XML parser)
    const entryRegex = /<entry>(.*?)<\/entry>/gs;
    const entries = xmlText.match(entryRegex) || [];

    for (const entry of entries) {
      const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
      const authorMatches = entry.match(/<author>.*?<name>(.*?)<\/name>.*?<\/author>/gs) || [];
      const abstractMatch = entry.match(/<summary>(.*?)<\/summary>/s);
      const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
      const linkMatch = entry.match(/<id>(.*?)<\/id>/);

      if (titleMatch) {
        const title = titleMatch[1].replace(/\s+/g, ' ').trim();
        const authors = authorMatches.map(authorMatch => {
          const nameMatch = authorMatch.match(/<name>(.*?)<\/name>/);
          return nameMatch ? nameMatch[1].trim() : 'Unknown Author';
        });
        const abstract = abstractMatch ? abstractMatch[1].replace(/\s+/g, ' ').trim() : undefined;
        const published = publishedMatch ? publishedMatch[1] : undefined;
        const year = published ? new Date(published).getFullYear() : undefined;
        const url = linkMatch ? linkMatch[1] : undefined;

        results.push({
          title,
          authors: authors.length > 0 ? authors : ['Unknown Author'],
          journal: 'arXiv preprint',
          year,
          publication_date: year?.toString(),
          abstract,
          url,
          citation_count: 0, // arXiv doesn't provide citation counts
          confidence: 0.5,
          relevance_score: 0.4,
          keywords: []
        });
      }
    }

    return results;
  }

  /**
   * Normalize results from different sources to consistent format
   */
  private normalizeResults(
    results: any[],
    source: string
  ): ScholarSearchResult[] {
    return results.map(result => ({
      title: result.title || 'Untitled',
      authors: Array.isArray(result.authors) ? result.authors : [result.authors || 'Unknown Author'],
      journal: result.journal || result.venue || `${source} result`,
      year: result.year,
      publication_date: result.publication_date || result.year?.toString(),
      abstract: result.abstract,
      url: result.url,
      doi: result.doi,
      citation_count: result.citation_count || 0,
      confidence: result.confidence || 0.5,
      relevance_score: result.relevance_score || 0.5,
      keywords: result.keywords || []
    }));
  }

  /**
   * Deduplicate results by title similarity
   */
  private deduplicateResults(results: ScholarSearchResult[]): ScholarSearchResult[] {
    const seen = new Map<string, ScholarSearchResult>();
    
    for (const result of results) {
      const normalizedTitle = result.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
      
      if (!seen.has(normalizedTitle)) {
        seen.set(normalizedTitle, result);
      } else {
        // Keep the one with higher confidence or citation count
        const existing = seen.get(normalizedTitle)!;
        if ((result.confidence || 0) > (existing.confidence || 0) ||
            (result.citation_count || 0) > (existing.citation_count || 0)) {
          seen.set(normalizedTitle, result);
        }
      }
    }
    
    return Array.from(seen.values())
      .sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0));
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a timeout promise
   */
  private async timeoutPromise<T>(ms: number, defaultValue: T): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(defaultValue), ms);
    });
  }

  /**
   * Get error handler instance for external use
   */
  public getErrorHandler(): AISearcherErrorHandler {
    return this.errorHandler;
  }

  /**
   * Get fallback service status
   */
  public async getFallbackServiceStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    
    for (const [name, service] of this.fallbackServices) {
      try {
        status[name] = await service.healthCheck();
      } catch {
        status[name] = false;
      }
    }
    
    return status;
  }

  /**
   * Enable or disable specific fallback services
   */
  public configureFallbackService(serviceName: string, enabled: boolean): void {
    const service = this.fallbackServices.get(serviceName);
    if (service) {
      service.enabled = enabled;
    }
  }

  /**
   * Add custom fallback service
   */
  public addFallbackService(service: FallbackService): void {
    this.fallbackServices.set(service.name, service);
  }
}

export default EnhancedGoogleScholarClient;