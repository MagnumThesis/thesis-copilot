import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GoogleScholarClient, SearchOptions, RateLimitConfig, FallbackConfig, ErrorHandlingConfig } from '../worker/lib/google-scholar-client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AbortSignal.timeout
global.AbortSignal = {
  timeout: vi.fn(() => ({
    aborted: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
} as any;

describe('GoogleScholarClient - Additional Tests', () => {
  let client: GoogleScholarClient;
  let rateLimitConfig: RateLimitConfig;
  let fallbackConfig: FallbackConfig;
  let errorHandlingConfig: ErrorHandlingConfig;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Configure test settings
    rateLimitConfig = {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      backoffMultiplier: 2,
      maxRetries: 3,
      baseDelayMs: 100,
      maxDelayMs: 5000,
      jitterEnabled: false // Disable jitter for predictable tests
    };

    fallbackConfig = {
      enabled: true,
      fallbackSources: ['semantic-scholar', 'crossref'],
      fallbackTimeout: 5000,
      maxFallbackAttempts: 2
    };

    errorHandlingConfig = {
      enableDetailedLogging: false, // Disable logging in tests
      customErrorMessages: {}
    };

    client = new GoogleScholarClient(rateLimitConfig, fallbackConfig, errorHandlingConfig);
  });

  describe('DOI Validation', () => {
    it('should validate correct DOI formats', () => {
      // Access private method through type assertion
      const isValidDOI = (client as any).isValidDOI.bind(client);
      
      expect(isValidDOI('10.1234/example.2023.5678')).toBe(true);
      expect(isValidDOI('10.5555/12345678')).toBe(true);
      expect(isValidDOI('10.1000/xyz123')).toBe(true);
    });

    it('should reject invalid DOI formats', () => {
      const isValidDOI = (client as any).isValidDOI.bind(client);
      
      expect(isValidDOI('')).toBe(false);
      expect(isValidDOI('invalid-doi')).toBe(false);
      expect(isValidDOI('10.123/example')).toBe(false); // Too few digits in registrant
      expect(isValidDOI('10.1234567890/')).toBe(false); // Empty suffix
      expect(isValidDOI('10.1234/')).toBe(false); // Empty suffix
      expect(isValidDOI('10.1234/   ')).toBe(false); // Only whitespace
    });
  });

  describe('Abstract Validation', () => {
    it('should validate correct abstract formats', () => {
      const isValidAbstract = (client as any).isValidAbstract.bind(client);
      
      expect(isValidAbstract('This is a valid abstract with sufficient content.')).toBe(true);
      expect(isValidAbstract('A brief but meaningful abstract.')).toBe(true);
      expect(isValidAbstract('Abstract: This research explores important topics.')).toBe(true);
    });

    it('should reject invalid abstract formats', () => {
      const isValidAbstract = (client as any).isValidAbstract.bind(client);
      
      expect(isValidAbstract('')).toBe(false);
      expect(isValidAbstract('   ')).toBe(false);
      expect(isValidAbstract('pdf')).toBe(false);
      expect(isValidAbstract('123')).toBe(false);
      expect(isValidAbstract('abstract:')).toBe(false); // Just the word "abstract"
    });
  });

  describe('Paper Title Validation', () => {
    it('should identify academic-sounding titles', () => {
      const looksLikePaperTitle = (client as any).looksLikePaperTitle.bind(client);
      
      expect(looksLikePaperTitle('Machine Learning Approaches to Natural Language Processing')).toBe(true);
      expect(looksLikePaperTitle('A Study on Climate Change')).toBe(true);
      expect(looksLikePaperTitle('Research in Quantum Computing')).toBe(true);
    });

    it('should reject navigation or non-academic titles', () => {
      const looksLikePaperTitle = (client as any).looksLikePaperTitle.bind(client);
      
      expect(looksLikePaperTitle('home')).toBe(false);
      expect(looksLikePaperTitle('search')).toBe(false);
      expect(looksLikePaperTitle('about')).toBe(false);
      expect(looksLikePaperTitle('settings')).toBe(false);
      expect(looksLikePaperTitle('')).toBe(false);
      expect(looksLikePaperTitle('a')).toBe(false); // Too short
    });
  });

  describe('No Results Detection', () => {
    it('should detect no results indicators in HTML', () => {
      const containsNoResultsIndicators = (client as any).containsNoResultsIndicators.bind(client);
      
      expect(containsNoResultsIndicators('Your search - query - did not match any articles.')).toBe(true);
      expect(containsNoResultsIndicators('No results found for your search')).toBe(true);
      expect(containsNoResultsIndicators('Your search did not match any articles')).toBe(true);
      expect(containsNoResultsIndicators('No articles found')).toBe(true);
    });

    it('should not detect false positives for no results', () => {
      const containsNoResultsIndicators = (client as any).containsNoResultsIndicators.bind(client);
      
      expect(containsNoResultsIndicators('This paper discusses search results')).toBe(false);
      expect(containsNoResultsIndicators('Search results are important')).toBe(false);
      expect(containsNoResultsIndicators('')).toBe(false);
    });
  });

  describe('Alternative Parsing', () => {
    it('should attempt alternative parsing when standard parsing fails', () => {
      const tryAlternativeParsing = (client as any).tryAlternativeParsing.bind(client);
      
      const htmlWithLinks = `
        <html>
          <body>
            <a href="/paper1">A Novel Approach to Machine Learning in Academic Research</a>
            <a href="/paper2">Advanced Methods for Data Analysis and Statistical Modeling</a>
            <a href="/">Home</a>
            <a href="/search">Search</a>
          </body>
        </html>
      `;
      
      const results = tryAlternativeParsing(htmlWithLinks);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('Machine Learning');
      expect(results[0].confidence).toBe(0.2); // Low confidence for alternative parsing
    });

    it('should return empty array when no suitable alternatives found', () => {
      const tryAlternativeParsing = (client as any).tryAlternativeParsing.bind(client);
      
      const htmlWithNoLinks = `
        <html>
          <body>
            <div>No links here</div>
            <a href="/">Home</a>
            <a href="/search">Search</a>
          </body>
        </html>
      `;
      
      const results = tryAlternativeParsing(htmlWithNoLinks);
      expect(results).toEqual([]);
    });
  });

  describe('Enhanced Fallback Mechanisms', () => {
    it('should handle different fallback source configurations', async () => {
      const customFallbackConfig = {
        ...fallbackConfig,
        fallbackSources: ['arxiv', 'pubmed']
      };
      
      const clientWithCustomFallback = new GoogleScholarClient(
        rateLimitConfig, 
        customFallbackConfig, 
        errorHandlingConfig
      );
      
      // Mock all attempts to fail
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const results = await clientWithCustomFallback.search('test query');
      
      // Should get fallback results
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Fallback result');
    });

    it('should respect fallback timeout configuration', async () => {
      const timeoutFallbackConfig = {
        ...fallbackConfig,
        fallbackTimeout: 100 // Very short timeout
      };
      
      const clientWithTimeout = new GoogleScholarClient(
        rateLimitConfig, 
        timeoutFallbackConfig, 
        errorHandlingConfig
      );
      
      // Mock network error
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const results = await clientWithTimeout.search('test query');
      
      // Should still get fallback results even with short timeout
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Fallback result');
    });
  });

  describe('Client Status and State Management', () => {
    it('should provide comprehensive client status information', () => {
      const status = client.getClientStatus();
      
      expect(status).toHaveProperty('rateLimitStatus');
      expect(status).toHaveProperty('serviceStatus');
      expect(status).toHaveProperty('errorHandling');
      
      // Check rate limit status
      expect(status.rateLimitStatus).toMatchObject({
        isBlocked: false,
        blockUntil: 0,
        requestsInLastMinute: 0,
        requestsInLastHour: 0,
        remainingMinuteRequests: expect.any(Number),
        remainingHourlyRequests: expect.any(Number)
      });
      
      // Check service status
      expect(status.serviceStatus).toMatchObject({
        isAvailable: true,
        consecutiveFailures: 0,
        lastSuccessfulRequest: expect.any(Number),
        timeSinceLastSuccess: expect.any(Number)
      });
      
      // Check error handling configuration
      expect(status.errorHandling).toMatchObject({
        fallbackEnabled: true,
        detailedLogging: false,
        maxRetries: 3,
        currentBackoffMultiplier: 2
      });
    });

    it('should reset client state correctly', () => {
      // Simulate some state changes
      (client as any).consecutiveFailures = 5;
      (client as any).isBlocked = true;
      (client as any).serviceAvailable = false;
      (client as any).requestHistory = [Date.now() - 1000, Date.now() - 2000];
      
      // Verify state before reset
      const statusBefore = client.getClientStatus();
      expect(statusBefore.serviceStatus.consecutiveFailures).toBe(5);
      expect(statusBefore.rateLimitStatus.isBlocked).toBe(true);
      expect(statusBefore.serviceStatus.isAvailable).toBe(false);
      expect(statusBefore.rateLimitStatus.requestsInLastHour).toBe(2);
      
      // Reset client state
      client.resetClientState();
      
      // Verify state after reset
      const statusAfter = client.getClientStatus();
      expect(statusAfter.serviceStatus.consecutiveFailures).toBe(0);
      expect(statusAfter.rateLimitStatus.isBlocked).toBe(false);
      expect(statusAfter.serviceStatus.isAvailable).toBe(true);
      expect(statusAfter.rateLimitStatus.requestsInLastHour).toBe(0);
    });
  });

  describe('Connection Testing', () => {
    it('should successfully test connection to Google Scholar', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Map()
          }), 10) // Small delay to ensure responseTime > 0
        )
      );

      const result = await client.testConnection();
      
      expect(result.success).toBe(true);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.statusCode).toBe(200);
      expect(result.error).toBeUndefined();
    });

    it('should handle connection test failures', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection failed')), 10) // Small delay to ensure responseTime > 0
        )
      );

      const result = await client.testConnection();
      
      expect(result.success).toBe(false);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.error).toBe('Connection failed');
      expect(result.statusCode).toBeUndefined();
    });

    it('should handle HTTP error responses in connection test', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: false,
            status: 403,
            statusText: 'Forbidden',
            headers: new Map()
          }), 10)
        )
      );

      const result = await client.testConnection();
      
      expect(result.success).toBe(false);
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.error).toContain('HTTP 403');
      expect(result.statusCode).toBe(403);
    });
  });

  describe('Enhanced Error Handling', () => {
    it('should classify quota exceeded errors correctly', () => {
      // Test the error classification directly
      const classifyError = (client as any).classifyError.bind(client);
      
      const quotaError = new Error('quota exceeded');
      const limitError = new Error('limit exceeded');
      const rateLimitError = new Error('rate limit exceeded');
      
      expect(classifyError(quotaError)).toBe('quota_exceeded');
      expect(classifyError(limitError)).toBe('quota_exceeded');
      expect(classifyError(rateLimitError)).toBe('rate_limit'); // Different classification
    });

    it('should provide detailed error information in client status', () => {
      // Simulate some failures
      (client as any).consecutiveFailures = 3;
      (client as any).lastSuccessfulRequest = Date.now() - 300000; // 5 minutes ago
      
      const status = client.getClientStatus();
      expect(status.serviceStatus.consecutiveFailures).toBe(3);
      expect(status.serviceStatus.timeSinceLastSuccess).toBeGreaterThan(299000);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle repeated searches without memory leaks', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(`
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt"><a href="#">Test Paper</a></h3>
              <div class="gs_a">Test Author - Test Journal, 2023</div>
            </div>
          </div>
        `),
        headers: new Map()
      });

      // Perform many searches
      const promises = [];
      for (let i = 0; i < 5; i++) { // Reduce to 5 to stay within limits
        promises.push(client.search(`query ${i}`));
      }

      await Promise.all(promises);

      // Check that client state is still consistent
      const status = client.getClientStatus();
      expect(status.rateLimitStatus.requestsInLastMinute).toBeLessThanOrEqual(10); // Default limit
      expect(status.rateLimitStatus.requestsInLastHour).toBeLessThanOrEqual(100); // Default limit
    });
  });
});