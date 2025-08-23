import { ScholarSearchResult } from '../../lib/ai-types';

/**
 * Google Scholar Search Client
 * Handles web scraping of Google Scholar for academic paper search
 */

export interface SearchOptions {
  maxResults?: number;
  yearStart?: number;
  yearEnd?: number;
  sortBy?: 'relevance' | 'date';
  includePatents?: boolean;
  includeCitations?: boolean;
  language?: string;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  backoffMultiplier: number;
  maxRetries: number;
  baseDelayMs: number;
}

export interface SearchError {
  type: 'rate_limit' | 'network' | 'parsing' | 'blocked' | 'timeout';
  message: string;
  retryAfter?: number;
  statusCode?: number;
}

export class GoogleScholarClient {
  private readonly baseUrl = 'https://scholar.google.com/scholar';
  private readonly rateLimitConfig: RateLimitConfig;
  private requestHistory: number[] = [];
  private isBlocked = false;
  private blockUntil = 0;

  constructor(rateLimitConfig?: Partial<RateLimitConfig>) {
    this.rateLimitConfig = {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      backoffMultiplier: 2,
      maxRetries: 3,
      baseDelayMs: 1000,
      ...rateLimitConfig
    };
  }

  /**
   * Search Google Scholar for academic papers
   */
  async search(query: string, options: SearchOptions = {}): Promise<ScholarSearchResult[]> {
    if (!query.trim()) {
      throw new Error('Search query cannot be empty');
    }

    // Check rate limits before making request
    await this.checkRateLimit();

    const searchUrl = this.buildSearchUrl(query, options);
    let lastError: SearchError | null = null;

    for (let attempt = 0; attempt < this.rateLimitConfig.maxRetries; attempt++) {
      try {
        // Add delay between retries
        if (attempt > 0) {
          const delay = this.rateLimitConfig.baseDelayMs * Math.pow(this.rateLimitConfig.backoffMultiplier, attempt - 1);
          await this.delay(delay);
        }

        const html = await this.fetchSearchResults(searchUrl);
        const results = this.parseResults(html);
        
        // Record successful request
        this.recordRequest();
        
        return this.validateResults(results);

      } catch (error) {
        lastError = this.handleError(error);
        
        // Don't retry for certain error types
        if (lastError.type === 'blocked' || lastError.type === 'parsing') {
          break;
        }

        // Handle rate limiting
        if (lastError.type === 'rate_limit' && lastError.retryAfter) {
          await this.handleRateLimit(lastError.retryAfter);
        }
      }
    }

    throw new Error(`Search failed after ${this.rateLimitConfig.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Parse Google Scholar HTML results
   */
  parseResults(html: string): ScholarSearchResult[] {
    const results: ScholarSearchResult[] = [];

    try {
      // Extract search result blocks using regex patterns
      // Google Scholar uses div elements with class "gs_r gs_or gs_scl" for each result
      const resultBlocks = this.extractResultBlocks(html);

      for (const block of resultBlocks) {
        try {
          const result = this.parseResultBlock(block);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          console.warn('Failed to parse individual result block:', error);
          // Continue parsing other results
        }
      }

      return results;

    } catch (error) {
      throw new SearchError({
        type: 'parsing',
        message: `Failed to parse search results: ${error instanceof Error ? error.message : 'Unknown parsing error'}`
      });
    }
  }

  /**
   * Handle rate limiting and request throttling
   */
  async handleRateLimit(retryAfter?: number): Promise<void> {
    if (retryAfter) {
      this.isBlocked = true;
      this.blockUntil = Date.now() + (retryAfter * 1000);
      await this.delay(retryAfter * 1000);
      this.isBlocked = false;
    } else {
      // Implement exponential backoff
      const delay = this.rateLimitConfig.baseDelayMs * this.rateLimitConfig.backoffMultiplier;
      await this.delay(delay);
    }
  }

  /**
   * Validate search results
   */
  validateResults(results: ScholarSearchResult[]): ScholarSearchResult[] {
    return results.filter(result => {
      // Basic validation
      if (!result.title || result.title.trim().length === 0) {
        return false;
      }

      if (!result.authors || result.authors.length === 0) {
        return false;
      }

      // Ensure confidence and relevance scores are valid
      if (result.confidence < 0 || result.confidence > 1) {
        result.confidence = 0.5; // Default confidence
      }

      if (result.relevance_score < 0 || result.relevance_score > 1) {
        result.relevance_score = 0.5; // Default relevance
      }

      return true;
    });
  }

  /**
   * Build search URL with parameters
   */
  private buildSearchUrl(query: string, options: SearchOptions): string {
    const params = new URLSearchParams();
    
    params.set('q', query);
    params.set('hl', options.language || 'en');
    
    if (options.yearStart || options.yearEnd) {
      const yearStart = options.yearStart || 1900;
      const yearEnd = options.yearEnd || new Date().getFullYear();
      params.set('as_ylo', yearStart.toString());
      params.set('as_yhi', yearEnd.toString());
    }

    if (options.sortBy === 'date') {
      params.set('scisbd', '1');
    }

    if (!options.includePatents) {
      params.set('as_vis', '1');
    }

    if (options.maxResults) {
      params.set('num', Math.min(options.maxResults, 20).toString());
    }

    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * Fetch search results from Google Scholar
   */
  private async fetchSearchResults(url: string): Promise<string> {
    const headers = this.getRequestHeaders();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new SearchError({
            type: 'rate_limit',
            message: 'Rate limit exceeded',
            retryAfter: retryAfter ? parseInt(retryAfter) : 60,
            statusCode: response.status
          });
        }

        if (response.status === 403) {
          throw new SearchError({
            type: 'blocked',
            message: 'Access blocked by Google Scholar',
            statusCode: response.status
          });
        }

        throw new SearchError({
          type: 'network',
          message: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status
        });
      }

      return await response.text();

    } catch (error) {
      if (error instanceof SearchError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new SearchError({
          type: 'timeout',
          message: 'Request timeout after 30 seconds'
        });
      }

      throw new SearchError({
        type: 'network',
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  /**
   * Get request headers with proper user agent and other headers
   */
  private getRequestHeaders(): Record<string, string> {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };
  }

  /**
   * Extract result blocks from HTML
   */
  private extractResultBlocks(html: string): string[] {
    const blocks: string[] = [];
    
    // Look for result containers - Google Scholar uses various class patterns
    // We need to match the complete div structure including nested divs
    const resultPattern = /<div class="gs_r gs_or gs_scl"[^>]*>(.*?)<\/div>(?=\s*(?:<div class="gs_r|$))/gs;
    
    let match;
    while ((match = resultPattern.exec(html)) !== null) {
      if (match[1]) {
        // Include the full content including nested divs
        blocks.push(match[0]); // Use full match instead of just group 1
      }
    }

    // If no results found with the primary pattern, try alternative patterns
    if (blocks.length === 0) {
      const alternativePatterns = [
        /<div class="gs_ri"[^>]*>.*?<\/div>/gs,
        /<div[^>]*class="[^"]*gs_r[^"]*"[^>]*>.*?<\/div>/gs
      ];

      for (const pattern of alternativePatterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          blocks.push(match[0]);
        }
      }
    }

    return blocks;
  }

  /**
   * Parse individual result block
   */
  private parseResultBlock(block: string): ScholarSearchResult | null {
    try {
      // Extract title
      const title = this.extractTitle(block);
      if (!title) return null;

      // Extract authors
      const authors = this.extractAuthors(block);
      if (authors.length === 0) return null;

      // Extract other metadata
      const journal = this.extractJournal(block);
      const year = this.extractYear(block);
      const citations = this.extractCitations(block);
      const doi = this.extractDOI(block);
      const url = this.extractURL(block);
      const abstract = this.extractAbstract(block);

      return {
        title,
        authors,
        journal,
        year,
        citations,
        publication_date: year?.toString(),
        doi,
        url,
        abstract,
        confidence: this.calculateConfidence(title, authors, journal, year),
        relevance_score: this.calculateRelevanceScore(title, abstract),
        citation_count: citations
      };

    } catch (error) {
      console.warn('Error parsing result block:', error);
      return null;
    }
  }

  /**
   * Extract title from result block
   */
  private extractTitle(block: string): string | null {
    const patterns = [
      /<h3[^>]*class="[^"]*gs_rt[^"]*"[^>]*>.*?<a[^>]*>(.*?)<\/a>.*?<\/h3>/s,
      /<h3[^>]*><a[^>]*>(.*?)<\/a><\/h3>/s,
      /<a[^>]*class="[^"]*gs_rt[^"]*"[^>]*>(.*?)<\/a>/s,
      /<h3[^>]*>.*?<a[^>]*href="[^"]*"[^>]*>(.*?)<\/a>/s
    ];

    for (const pattern of patterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        const title = this.cleanText(match[1]);
        if (title.length > 0) {
          return title;
        }
      }
    }

    return null;
  }

  /**
   * Extract authors from result block
   */
  private extractAuthors(block: string): string[] {
    const patterns = [
      /<div class="gs_a"[^>]*>(.*?)<\/div>/s,
      /<span class="gs_a"[^>]*>(.*?)<\/span>/s,
      /<div[^>]*class="[^"]*gs_a[^"]*"[^>]*>(.*?)<\/div>/s
    ];

    for (const pattern of patterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        const authorText = this.cleanText(match[1]);
        // Authors are typically separated by commas and followed by publication info
        // Pattern: "Author1, Author2, Author3 - Journal, Year - domain.com"
        const authorMatch = authorText.match(/^([^-]+?)(?:\s*-|$)/);
        if (authorMatch) {
          const authorsString = authorMatch[1].trim();
          if (authorsString.length > 0) {
            // Split by comma but be careful about names with commas (like "Smith, J.")
            const authors = [];
            const parts = authorsString.split(',');
            
            for (let i = 0; i < parts.length; i++) {
              const part = parts[i].trim();
              
              // Check if this looks like a last name followed by initials
              if (i < parts.length - 1 && part.match(/^[A-Z][a-z]+$/)) {
                const nextPart = parts[i + 1].trim();
                if (nextPart.match(/^[A-Z]\.?$/)) {
                  // Combine "Smith" + "J." -> "Smith, J."
                  authors.push(`${part}, ${nextPart}`);
                  i++; // Skip the next part since we consumed it
                } else {
                  authors.push(part);
                }
              } else {
                authors.push(part);
              }
            }
            
            return authors
              .filter(author => author.length > 0 && !author.match(/^\d+$/))
              .slice(0, 10); // Limit to 10 authors
          }
        }
      }
    }

    return [];
  }

  /**
   * Extract journal from result block
   */
  private extractJournal(block: string): string | undefined {
    const patterns = [
      /<div class="gs_a"[^>]*>.*?-\s*([^,\-]+?)(?:,|\s*\d{4})/s,
      /<span class="gs_a"[^>]*>.*?-\s*([^,\-]+?)(?:,|\s*\d{4})/s
    ];

    for (const pattern of patterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        const journal = this.cleanText(match[1]).trim();
        if (journal.length > 3 && !journal.match(/^\d+$/)) {
          return journal;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract publication year from result block
   */
  private extractYear(block: string): number | undefined {
    const yearMatch = block.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      const currentYear = new Date().getFullYear();
      if (year >= 1900 && year <= currentYear + 1) {
        return year;
      }
    }
    return undefined;
  }

  /**
   * Extract citation count from result block
   */
  private extractCitations(block: string): number | undefined {
    const patterns = [
      /Cited by (\d+)/i,
      /Citations: (\d+)/i,
      /"gs_fl"[^>]*>.*?Cited by (\d+)/i
    ];

    for (const pattern of patterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1]);
      }
    }

    return undefined;
  }

  /**
   * Extract DOI from result block
   */
  private extractDOI(block: string): string | undefined {
    const doiMatch = block.match(/(?:doi\.org\/|DOI:\s*)(10\.\d+\/[^\s<>"]+)/i);
    if (doiMatch && doiMatch[1]) {
      return doiMatch[1];
    }
    return undefined;
  }

  /**
   * Extract URL from result block
   */
  private extractURL(block: string): string | undefined {
    const patterns = [
      /<a[^>]*href="([^"]+)"[^>]*class="[^"]*gs_rt[^"]*"/,
      /<h3[^>]*>.*?<a[^>]*href="([^"]+)"/s,
      /<a[^>]*href="([^"]+)"[^>]*>/
    ];

    for (const pattern of patterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        let url = match[1];
        // Handle Google Scholar redirect URLs
        if (url.startsWith('/scholar_url?')) {
          const urlMatch = url.match(/url=([^&]+)/);
          if (urlMatch) {
            url = decodeURIComponent(urlMatch[1]);
          }
        }
        return url;
      }
    }

    return undefined;
  }

  /**
   * Extract abstract from result block
   */
  private extractAbstract(block: string): string | undefined {
    const patterns = [
      /<span class="gs_rs"[^>]*>(.*?)<\/span>/s,
      /<div class="gs_rs"[^>]*>(.*?)<\/div>/s
    ];

    for (const pattern of patterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        const abstract = this.cleanText(match[1]);
        if (abstract.length > 20) {
          return abstract;
        }
      }
    }

    return undefined;
  }

  /**
   * Calculate confidence score based on available metadata
   */
  private calculateConfidence(title: string, authors: string[], journal?: string, year?: number): number {
    let confidence = 0.3; // Base confidence

    if (title && title.length > 10) confidence += 0.2;
    if (authors && authors.length > 0) confidence += 0.2;
    if (journal && journal.length > 3) confidence += 0.2;
    if (year && year > 1900) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate relevance score based on title and abstract
   */
  private calculateRelevanceScore(title: string, abstract?: string): number {
    // Simple relevance scoring - in a real implementation, this would use
    // more sophisticated NLP techniques
    let score = 0.5; // Base score

    if (title && title.length > 20) score += 0.1;
    if (abstract && abstract.length > 100) score += 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Clean HTML text content
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Check rate limits before making request
   */
  private async checkRateLimit(): Promise<void> {
    if (this.isBlocked && Date.now() < this.blockUntil) {
      const waitTime = this.blockUntil - Date.now();
      throw new SearchError({
        type: 'rate_limit',
        message: `Blocked until ${new Date(this.blockUntil).toISOString()}`,
        retryAfter: Math.ceil(waitTime / 1000)
      });
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    // Clean old requests
    this.requestHistory = this.requestHistory.filter(time => time > oneHourAgo);

    const recentRequests = this.requestHistory.filter(time => time > oneMinuteAgo);
    const hourlyRequests = this.requestHistory.length;

    if (recentRequests.length >= this.rateLimitConfig.requestsPerMinute) {
      throw new SearchError({
        type: 'rate_limit',
        message: 'Rate limit exceeded: too many requests per minute',
        retryAfter: 60
      });
    }

    if (hourlyRequests >= this.rateLimitConfig.requestsPerHour) {
      throw new SearchError({
        type: 'rate_limit',
        message: 'Rate limit exceeded: too many requests per hour',
        retryAfter: 3600
      });
    }
  }

  /**
   * Record successful request for rate limiting
   */
  private recordRequest(): void {
    this.requestHistory.push(Date.now());
  }

  /**
   * Handle and categorize errors
   */
  private handleError(error: unknown): SearchError {
    if (error instanceof SearchError) {
      return error;
    }

    if (error instanceof Error) {
      return {
        type: 'network',
        message: error.message
      };
    }

    return {
      type: 'network',
      message: 'Unknown error occurred'
    };
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): {
    isBlocked: boolean;
    blockUntil: number;
    requestsInLastMinute: number;
    requestsInLastHour: number;
    remainingMinuteRequests: number;
    remainingHourlyRequests: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneHourAgo = now - 3600000;

    const recentRequests = this.requestHistory.filter(time => time > oneMinuteAgo).length;
    const hourlyRequests = this.requestHistory.filter(time => time > oneHourAgo).length;

    return {
      isBlocked: this.isBlocked,
      blockUntil: this.blockUntil,
      requestsInLastMinute: recentRequests,
      requestsInLastHour: hourlyRequests,
      remainingMinuteRequests: Math.max(0, this.rateLimitConfig.requestsPerMinute - recentRequests),
      remainingHourlyRequests: Math.max(0, this.rateLimitConfig.requestsPerHour - hourlyRequests)
    };
  }
}

/**
 * SearchError class for typed error handling
 */
class SearchError extends Error {
  public readonly type: 'rate_limit' | 'network' | 'parsing' | 'blocked' | 'timeout';
  public readonly retryAfter?: number;
  public readonly statusCode?: number;

  constructor(options: {
    type: 'rate_limit' | 'network' | 'parsing' | 'blocked' | 'timeout';
    message: string;
    retryAfter?: number;
    statusCode?: number;
  }) {
    super(options.message);
    this.name = 'SearchError';
    this.type = options.type;
    this.retryAfter = options.retryAfter;
    this.statusCode = options.statusCode;
  }
}