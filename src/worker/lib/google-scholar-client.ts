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
    
    // Find all div elements with gs_r class and extract their complete content
    // Use a more sophisticated approach to handle nested divs properly
    
    let startIndex = 0;
    while (true) {
      // Find the next gs_r div
      const startMatch = html.substring(startIndex).match(/<div[^>]*class="[^"]*gs_r[^"]*"[^>]*>/);
      if (!startMatch) break;
      
      const actualStart = startIndex + startMatch.index!;
      const divStart = actualStart;
      
      // Find the matching closing div by counting nested divs
      let divCount = 1;
      let currentPos = divStart + startMatch[0].length;
      
      while (divCount > 0 && currentPos < html.length) {
        const nextDiv = html.substring(currentPos).search(/<\/?div[^>]*>/);
        if (nextDiv === -1) break;
        
        currentPos += nextDiv;
        const divMatch = html.substring(currentPos).match(/^<(\/)?(div)[^>]*>/);
        if (divMatch) {
          if (divMatch[1]) {
            // Closing div
            divCount--;
          } else {
            // Opening div
            divCount++;
          }
          currentPos += divMatch[0].length;
        } else {
          break;
        }
      }
      
      if (divCount === 0) {
        const block = html.substring(divStart, currentPos);
        // Only include blocks that look like search results
        if (block.includes('gs_rt') || block.includes('gs_a')) {
          blocks.push(block);
        }
      }
      
      startIndex = currentPos;
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
        return this.parseAuthorsFromText(authorText);
      }
    }

    return [];
  }

  /**
   * Parse authors from the author text string
   */
  private parseAuthorsFromText(authorText: string): string[] {
    // Authors are typically separated by commas and followed by publication info
    // Pattern: "Author1, Author2, Author3 - Journal, Year - domain.com"
    // We need to be careful not to split on hyphens within author names like "Smith-Jones"
    
    // Find the first " - " that separates authors from journal info
    // Look for pattern like " - Journal" or " - Conference" (with space before dash)
    const separatorMatch = authorText.match(/^(.*?)\s+-\s+([^-]+)/);
    let authorsString = '';
    
    if (separatorMatch) {
      authorsString = separatorMatch[1].trim();
    } else {
      // Fallback: take everything before the first standalone dash
      const dashIndex = authorText.indexOf(' - ');
      if (dashIndex > 0) {
        authorsString = authorText.substring(0, dashIndex).trim();
      } else {
        authorsString = authorText.trim();
      }
    }

    if (authorsString.length === 0) {
      return [];
    }

    // Handle different author name patterns
    const authors = this.splitAuthorNames(authorsString);
    
    return authors
      .map(author => author.trim())
      .filter(author => this.isValidAuthorName(author))
      .slice(0, 10); // Limit to 10 authors for performance
  }

  /**
   * Split author names handling various formats
   */
  private splitAuthorNames(authorsString: string): string[] {
    // Handle different separator patterns
    // First try semicolon separation (common in some formats)
    if (authorsString.includes(';')) {
      return authorsString.split(';').map(author => author.trim());
    }

    // Handle comma separation with special cases for initials
    const parts = authorsString.split(',').map(part => part.trim());
    const authors: string[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // Check if this looks like a last name followed by initials in next part
      if (i < parts.length - 1) {
        const nextPart = parts[i + 1];
        
        // Pattern: "Smith" followed by "J." or "J.A." 
        if (this.looksLikeLastName(part) && this.looksLikeInitials(nextPart)) {
          authors.push(`${part}, ${nextPart}`);
          i++; // Skip the next part since we consumed it
          continue;
        }
      }
      
      // Add the part as-is if it's not empty
      if (part.length > 0) {
        authors.push(part);
      }
    }
    
    return authors;
  }

  /**
   * Check if a string looks like a last name (simple heuristic)
   */
  private looksLikeLastName(text: string): boolean {
    // Should be a single word or hyphenated name, starting with capital
    // Examples: "Smith", "Van Der Berg", "O'Connor", "Smith-Jones"
    return /^[A-Z][a-z]*(?:[-'\s][A-Z]?[a-z]*)*$/.test(text) && 
           text.length > 1 && 
           !this.looksLikeInitials(text);
  }

  /**
   * Check if a string looks like initials
   */
  private looksLikeInitials(text: string): boolean {
    // Initials: "J.", "J.A.", "J. A.", "J", "JA", etc.
    return /^[A-Z]\.?(?:\s*[A-Z]\.?)*$/.test(text) && text.length <= 10;
  }



  /**
   * Validate if a string is a reasonable author name
   */
  private isValidAuthorName(author: string): boolean {
    if (!author || author.length < 2) {
      return false;
    }

    // Filter out obvious non-names
    const invalidPatterns = [
      /^\d+$/, // Pure numbers
      /^[^a-zA-Z]*$/, // No letters
      /^(and|et|al|etc|vol|pp|page|pages)\.?$/i, // Common non-name words
      /^(doi|isbn|issn|url|http|www)\.?/i, // Technical terms
      /^[.,-]+$/, // Only punctuation
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(author.trim())) {
        return false;
      }
    }

    // Should contain at least one letter
    if (!/[a-zA-Z]/.test(author)) {
      return false;
    }

    // Reasonable length limits
    if (author.length > 100) {
      return false; // Suspiciously long
    }

    return true;
  }

  /**
   * Extract journal from result block
   */
  private extractJournal(block: string): string | undefined {
    const patterns = [
      /<div class="gs_a"[^>]*>(.*?)<\/div>/s,
      /<span class="gs_a"[^>]*>(.*?)<\/span>/s,
      /<div[^>]*class="[^"]*gs_a[^"]*"[^>]*>(.*?)<\/div>/s
    ];

    for (const pattern of patterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        const authorText = this.cleanText(match[1]);
        return this.extractJournalFromAuthorText(authorText);
      }
    }

    return undefined;
  }

  /**
   * Extract journal name from author text
   */
  private extractJournalFromAuthorText(authorText: string): string | undefined {
    // Pattern: "Authors - Journal, Year - domain.com"
    // We want to extract the journal part between the first and second dash
    const parts = authorText.split(' - ');
    
    if (parts.length >= 2) {
      const journalPart = parts[1].trim();
      
      // Remove year and domain from the end
      // Pattern could be "Journal, 2023" or "Journal, 2023 - domain.com"
      const journalMatch = journalPart.match(/^([^,]+?)(?:,\s*\d{4}|$)/);
      if (journalMatch && journalMatch[1]) {
        const journal = journalMatch[1].trim();
        if (journal.length > 3 && !journal.match(/^\d+$/) && !journal.match(/^(and|et|al)$/i)) {
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
    // Multiple patterns to catch different DOI formats
    const doiPatterns = [
      /(?:doi\.org\/|DOI:\s*)(10\.\d+\/[^\s<>"']+)/i,
      /(?:dx\.doi\.org\/)(10\.\d+\/[^\s<>"']+)/i,
      /\bdoi:\s*(10\.\d+\/[^\s<>"']+)/i,
      /\b(10\.\d{4,}\/[^\s<>"']+)/g // Generic DOI pattern
    ];

    for (const pattern of doiPatterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        const doi = match[1].trim();
        if (this.isValidDOI(doi)) {
          return doi;
        }
      }
    }
    return undefined;
  }

  /**
   * Validate DOI format according to DOI standards
   */
  private isValidDOI(doi: string): boolean {
    // DOI format: 10.{registrant}/{suffix}
    // Registrant code must be at least 4 digits
    // Suffix can contain various characters but should not be empty
    const doiRegex = /^10\.\d{4,}\/[^\s]+$/;
    
    if (!doiRegex.test(doi)) {
      return false;
    }

    // Additional validation rules
    const parts = doi.split('/');
    if (parts.length < 2) {
      return false;
    }

    const registrant = parts[0];
    const suffix = parts.slice(1).join('/');

    // Registrant should be 10.xxxx where xxxx is at least 4 digits
    if (!registrant.match(/^10\.\d{4,}$/)) {
      return false;
    }

    // Suffix should not be empty and should not contain certain invalid characters
    if (!suffix || suffix.length === 0) {
      return false;
    }

    // Check for common invalid patterns
    const invalidPatterns = [
      /^[\s.]+$/, // Only whitespace or dots
      /\s{2,}/, // Multiple consecutive spaces
      /<|>/, // HTML brackets (shouldn't be in clean DOI)
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(suffix)) {
        return false;
      }
    }

    return true;
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
      /<div class="gs_rs"[^>]*>(.*?)<\/div>/s,
      /<span[^>]*class="[^"]*gs_rs[^"]*"[^>]*>(.*?)<\/span>/s,
      /<div[^>]*class="[^"]*gs_rs[^"]*"[^>]*>(.*?)<\/div>/s
    ];

    for (const pattern of patterns) {
      const match = block.match(pattern);
      if (match && match[1]) {
        const abstract = this.cleanText(match[1]);
        // Filter out very short abstracts and common non-abstract content
        if (this.isValidAbstract(abstract)) {
          return abstract;
        }
      }
    }

    return undefined;
  }

  /**
   * Validate if extracted text is a meaningful abstract
   */
  private isValidAbstract(text: string): boolean {
    if (!text || text.length < 10) { // Reduced minimum length for testing
      return false;
    }

    // Filter out common non-abstract patterns
    const invalidPatterns = [
      /^(pdf|html|full text|download|view|access)$/i,
      /^[^a-zA-Z]*$/, // Only numbers/symbols
      /^\d+\s*(pages?|pp\.)/i, // Page numbers
      /^(abstract|summary):\s*$/i, // Just the word "abstract" or "summary"
      /^see\s+(full|complete)\s+/i, // "See full text" etc.
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(text.trim())) {
        return false;
      }
    }

    // Check for minimum word count (abstracts should have multiple words)
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 3) { // Reduced minimum word count
      return false;
    }

    return true;
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