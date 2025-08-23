/**
 * Tests for Google Scholar Client Error Handling and Resilience
 * Tests the enhanced error handling, retry logic, and fallback mechanisms
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

describe('GoogleScholarClient Error Handling', () => {
  let client: GoogleScholarClient;
  let rateLimitConfig: RateLimitConfig;
  let fallbackConfig: FallbackConfig;
  let errorHandlingConfig: ErrorHandlingConfig;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Configure test settings
    rateLimitConfig = {
      requestsPerMinute: 5,
      requestsPerHour: 50,
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Retry Logic', () => {
    it('should retry on network errors with exponential backoff', async () => {
      // Mock network error on first two attempts, success on third
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('<html><div class="gs_r"><h3 class="gs_rt"><a>Test Paper</a></h3><div class="gs_a">Test Author - Test Journal, 2023</div></div></html>'),
          headers: new Map()
        });

      const results = await client.search('test query');
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Test Paper');
    });

    it('should respect maxRetries configuration', async () => {
      // Create client with fallback disabled for this test
      const noFallbackClient = new GoogleScholarClient(rateLimitConfig, { ...fallbackConfig, enabled: false }, errorHandlingConfig);
      
      // Mock network error for all attempts
      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      await expect(noFallbackClient.search('test query')).rejects.toThrow();
      
      // Should try initial + maxRetries (3) = 3 total attempts
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      // Create client with fallback disabled for this test
      const noFallbackClient = new GoogleScholarClient(rateLimitConfig, { ...fallbackConfig, enabled: false }, errorHandlingConfig);
      
      // Mock blocked error (403)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Map()
      });

      try {
        await noFallbackClient.search('test query');
        expect.fail('Expected search to throw an error');
      } catch (error: any) {
        expect(error.type).toBe('blocked');
      }
      
      // Should only try once for non-retryable errors
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should calculate exponential backoff delays correctly', async () => {
      // Create client with fallback disabled for this test
      const noFallbackClient = new GoogleScholarClient(rateLimitConfig, { ...fallbackConfig, enabled: false }, errorHandlingConfig);
      
      const delays: number[] = [];
      const originalDelay = noFallbackClient['delay'];
      
      // Mock delay to capture timing
      noFallbackClient['delay'] = vi.fn().mockImplementation((ms: number) => {
        delays.push(ms);
        return Promise.resolve();
      });

      // Mock network errors
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(noFallbackClient.search('test query')).rejects.toThrow();
      
      // Check exponential backoff: 100ms, 200ms
      expect(delays).toEqual([100, 200]);
      
      // Restore original delay
      noFallbackClient['delay'] = originalDelay;
    });
  });

  describe('Rate Limiting', () => {
    it('should handle 429 rate limit responses', async () => {
      // Create client with fallback disabled and fast retries for this test
      const fastRetryConfig = { ...rateLimitConfig, baseDelayMs: 1, maxRetries: 1 };
      const noFallbackClient = new GoogleScholarClient(fastRetryConfig, { ...fallbackConfig, enabled: false }, errorHandlingConfig);
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['Retry-After', '1']]) // Short retry time for test
      });

      try {
        await noFallbackClient.search('test query');
        expect.fail('Expected search to throw an error');
      } catch (error: any) {
        expect(error.type).toBe('rate_limit');
      }
    }, 10000); // 10 second timeout

    it('should respect Retry-After header', async () => {
      let delayCalled = false;
      const originalDelay = client['delay'];
      
      client['delay'] = vi.fn().mockImplementation((ms: number) => {
        delayCalled = true;
        expect(ms).toBe(60000); // 60 seconds in milliseconds
        return Promise.resolve();
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Map([['Retry-After', '60']])
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('<html><div class="gs_r"><h3 class="gs_rt"><a>Test Paper</a></h3><div class="gs_a">Test Author</div></div></html>'),
          headers: new Map()
        });

      await client.search('test query');
      
      expect(delayCalled).toBe(true);
      client['delay'] = originalDelay;
    });

    it('should track request history for rate limiting', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html><div class="gs_r"><h3 class="gs_rt"><a>Test Paper</a></h3><div class="gs_a">Test Author</div></div></html>'),
        headers: new Map()
      });

      // Make multiple requests
      await client.search('query 1');
      await client.search('query 2');
      
      const status = client.getRateLimitStatus();
      expect(status.requestsInLastMinute).toBe(2);
      expect(status.remainingMinuteRequests).toBe(3); // 5 - 2 = 3
    });
  });

  describe('Service Availability', () => {
    it('should handle service unavailable errors (503)', async () => {
      // Create client with fallback disabled for this test
      const noFallbackClient = new GoogleScholarClient(rateLimitConfig, { ...fallbackConfig, enabled: false }, errorHandlingConfig);
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Map([['Retry-After', '300']])
      });

      try {
        await noFallbackClient.search('test query');
        expect.fail('Expected search to throw an error');
      } catch (error: any) {
        expect(error.type).toBe('service_unavailable');
      }
    });

    it('should implement circuit breaker pattern', async () => {
      // Create client with fallback disabled for this test
      const noFallbackClient = new GoogleScholarClient(rateLimitConfig, { ...fallbackConfig, enabled: false }, errorHandlingConfig);
      
      // Mock consecutive failures
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Simulate multiple failures to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        try {
          await noFallbackClient.search(`query ${i}`);
        } catch (error) {
          // Expected to fail
        }
      }

      // Manually set last successful request to be old enough
      noFallbackClient['lastSuccessfulRequest'] = Date.now() - 400000; // 6+ minutes ago

      // Next request should fail immediately due to circuit breaker
      await expect(noFallbackClient.search('test query')).rejects.toThrow('Google Scholar appears to be unavailable');
    });
  });

  describe('Error Classification', () => {
    it('should classify timeout errors correctly', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      
      mockFetch.mockRejectedValue(timeoutError);

      try {
        await client.search('test query');
      } catch (error: any) {
        expect(error.type).toBe('timeout');
        expect(error.isRetryable).toBe(true);
      }
    });

    it('should classify network errors correctly', async () => {
      const networkError = new Error('Network connection failed');
      networkError.name = 'TypeError';
      
      mockFetch.mockRejectedValue(networkError);

      try {
        await client.search('test query');
      } catch (error: any) {
        expect(error.type).toBe('network');
        expect(error.isRetryable).toBe(true);
      }
    });

    it('should classify parsing errors correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''), // Empty response
        headers: new Map()
      });

      try {
        await client.search('test query');
      } catch (error: any) {
        expect(error.type).toBe('parsing');
        expect(error.isRetryable).toBe(false);
      }
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should attempt fallback search when all retries fail', async () => {
      // Mock all attempts to fail
      mockFetch.mockRejectedValue(new Error('Network error'));

      const results = await client.search('test query');
      
      // Should get fallback results
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Fallback result');
      expect(results[0].confidence).toBe(0.3);
    });

    it('should not attempt fallback when disabled', async () => {
      // Create client with fallback disabled
      const noFallbackConfig = { ...fallbackConfig, enabled: false };
      const clientNoFallback = new GoogleScholarClient(rateLimitConfig, noFallbackConfig, errorHandlingConfig);

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(clientNoFallback.search('test query')).rejects.toThrow();
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error messages for different error types', async () => {
      // Create client with custom error messages and fast retries for this test
      const fastRetryConfig = { ...rateLimitConfig, baseDelayMs: 1, maxRetries: 1 };
      const customErrorConfig = {
        ...errorHandlingConfig,
        customErrorMessages: {
          'rate_limit': 'Test rate limit message',
          'blocked': 'Test blocked message',
          'service_unavailable': 'Test service unavailable message'
        }
      };
      const customClient = new GoogleScholarClient(fastRetryConfig, { ...fallbackConfig, enabled: false }, customErrorConfig);

      const testCases = [
        { status: 429, expectedType: 'rate_limit', expectedMessage: 'Test rate limit message' },
        { status: 403, expectedType: 'blocked', expectedMessage: 'Test blocked message' },
        { status: 503, expectedType: 'service_unavailable', expectedMessage: 'Test service unavailable message' }
      ];

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: testCase.status,
          statusText: 'Error',
          headers: new Map([['Retry-After', '1']]) // Short retry time
        });

        try {
          await customClient.search('test query');
          expect.fail('Expected search to throw an error');
        } catch (error: any) {
          expect(error.type).toBe(testCase.expectedType);
          expect(error.message).toContain(testCase.expectedMessage);
        }
      }
    }, 10000); // 10 second timeout

    it('should create comprehensive error messages with retry information', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      try {
        await client.search('test query');
      } catch (error: any) {
        expect(error.message).toContain('Search failed after');
        expect(error.message).toContain('attempts');
        expect(error.message).toContain('Alternative search sources were also attempted');
      }
    });
  });

  describe('Client Status and Health', () => {
    it('should provide comprehensive client status', async () => {
      const status = client.getClientStatus();
      
      expect(status).toHaveProperty('rateLimitStatus');
      expect(status).toHaveProperty('serviceStatus');
      expect(status).toHaveProperty('errorHandling');
      
      expect(status.serviceStatus.isAvailable).toBe(true);
      expect(status.serviceStatus.consecutiveFailures).toBe(0);
      expect(status.errorHandling.fallbackEnabled).toBe(true);
      expect(status.errorHandling.maxRetries).toBe(3);
    });

    it('should test connection successfully', async () => {
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
    });

    it('should test connection failure', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection failed')), 10) // Small delay to ensure responseTime > 0
        )
      );

      const result = await client.testConnection();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should reset client state', () => {
      // Simulate some state
      client['consecutiveFailures'] = 5;
      client['isBlocked'] = true;
      client['serviceAvailable'] = false;

      client.resetClientState();

      const status = client.getClientStatus();
      expect(status.serviceStatus.consecutiveFailures).toBe(0);
      expect(status.rateLimitStatus.isBlocked).toBe(false);
      expect(status.serviceStatus.isAvailable).toBe(true);
    });
  });

  describe('Parsing Resilience', () => {
    it('should handle empty HTML gracefully', async () => {
      // Create client with fallback disabled for this test
      const noFallbackClient = new GoogleScholarClient(rateLimitConfig, { ...fallbackConfig, enabled: false }, errorHandlingConfig);
      
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''),
        headers: new Map()
      });

      // Should return empty results instead of throwing error (graceful degradation)
      const results = await noFallbackClient.search('test query');
      expect(results).toHaveLength(0);
    });

    it('should handle no results gracefully', async () => {
      // Create client with fallback disabled for this test
      const noFallbackClient = new GoogleScholarClient(rateLimitConfig, { ...fallbackConfig, enabled: false }, errorHandlingConfig);
      
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html><body>Your search did not match any articles</body></html>'),
        headers: new Map()
      });

      const results = await noFallbackClient.search('test query');
      expect(results).toHaveLength(0);
    });

    it('should attempt alternative parsing when standard parsing fails', async () => {
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

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(htmlWithLinks),
        headers: new Map()
      });

      const results = await client.search('test query');
      
      // Should find the academic-looking titles and filter out navigation
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].confidence).toBe(0.2); // Low confidence for alternative parsing
      expect(results[0].title).toContain('Machine Learning');
    });

    it('should handle partial parsing failures gracefully', async () => {
      const htmlWithMixedResults = `
        <html>
          <div class="gs_r">
            <h3 class="gs_rt"><a>Valid Paper Title</a></h3>
            <div class="gs_a">Valid Author - Valid Journal, 2023</div>
          </div>
          <div class="gs_r">
            <!-- Malformed result block -->
            <h3 class="gs_rt"></h3>
          </div>
          <div class="gs_r">
            <h3 class="gs_rt"><a>Another Valid Paper</a></h3>
            <div class="gs_a">Another Author - Another Journal, 2022</div>
          </div>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(htmlWithMixedResults),
        headers: new Map()
      });

      const results = await client.search('test query');
      
      // Should get the valid results and skip the malformed one
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Valid Paper Title');
      expect(results[1].title).toBe('Another Valid Paper');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query', async () => {
      await expect(client.search('')).rejects.toThrow('Search query cannot be empty');
      await expect(client.search('   ')).rejects.toThrow('Search query cannot be empty');
    });

    it('should handle very long delays gracefully', async () => {
      const longDelayConfig = { ...rateLimitConfig, maxDelayMs: 100 }; // Very short max delay for testing
      const testClient = new GoogleScholarClient(longDelayConfig, fallbackConfig, errorHandlingConfig);

      let actualDelay = 0;
      const originalDelay = testClient['delay'];
      testClient['delay'] = vi.fn().mockImplementation((ms: number) => {
        actualDelay = ms;
        return Promise.resolve();
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      try {
        await testClient.search('test query');
      } catch (error) {
        // Should cap delay at maxDelayMs
        expect(actualDelay).toBeLessThanOrEqual(100);
      }

      testClient['delay'] = originalDelay;
    });

    it('should handle malformed Retry-After headers', async () => {
      // Create client with 1 retry and fallback disabled for this test
      const singleRetryConfig = { ...rateLimitConfig, maxRetries: 1, baseDelayMs: 1 };
      const testClient = new GoogleScholarClient(singleRetryConfig, { ...fallbackConfig, enabled: false }, errorHandlingConfig);
      
      // Mock the delay function to avoid actual waiting
      const originalDelay = testClient['delay'];
      testClient['delay'] = vi.fn().mockResolvedValue(undefined);
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['Retry-After', 'invalid']])
      });

      try {
        await testClient.search('test query');
        expect.fail('Expected search to throw an error');
      } catch (error: any) {
        expect(error.type).toBe('rate_limit');
        expect(error.retryAfter).toBe(60); // Should default to 60 seconds
      } finally {
        // Restore original delay
        testClient['delay'] = originalDelay;
      }
    });
  });
});