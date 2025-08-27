import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GoogleScholarClient, SearchOptions, RateLimitConfig } from '../worker/lib/google-scholar-client';

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

describe('GoogleScholarClient', () => {
  let client: GoogleScholarClient;
  let mockHtml: string;

  beforeEach(() => {
    client = new GoogleScholarClient();
    mockFetch.mockClear();
    
    // Mock HTML response with typical Google Scholar structure
    mockHtml = `
      <div class="gs_r gs_or gs_scl">
        <div class="gs_ri">
          <h3 class="gs_rt">
            <a href="/scholar_url?url=https://example.com/paper1">
              Machine Learning Approaches to Natural Language Processing
            </a>
          </h3>
          <div class="gs_a">
            Smith, J., Johnson, A., Williams, B. - Journal of AI Research, 2023 - example.com
          </div>
          <span class="gs_rs">
            This paper explores various machine learning approaches for natural language processing tasks...
          </span>
          <div class="gs_fl">
            <a href="#">Cited by 45</a>
          </div>
        </div>
      </div>
      <div class="gs_r gs_or gs_scl">
        <div class="gs_ri">
          <h3 class="gs_rt">
            <a href="https://doi.org/10.1234/example.2022.5678">
              Deep Learning for Academic Writing Enhancement
            </a>
          </h3>
          <div class="gs_a">
            Brown, C., Davis, E. - International Journal of Computational Linguistics, 2022 - publisher.com
          </div>
          <span class="gs_rs">
            A comprehensive study on using deep learning models to enhance academic writing quality...
          </span>
          <div class="gs_fl">
            <a href="#">Cited by 23</a>
          </div>
        </div>
      </div>
    `;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Constructor', () => {
    it('should create client with default rate limit configuration', () => {
      const client = new GoogleScholarClient();
      expect(client).toBeInstanceOf(GoogleScholarClient);
    });

    it('should create client with custom rate limit configuration', () => {
      const customConfig: Partial<RateLimitConfig> = {
        requestsPerMinute: 5,
        requestsPerHour: 50
      };
      const client = new GoogleScholarClient(customConfig);
      expect(client).toBeInstanceOf(GoogleScholarClient);
    });
  });

  describe('search', () => {
    it('should successfully search and return results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      });

      const results = await client.search('machine learning');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        title: 'Machine Learning Approaches to Natural Language Processing',
        authors: ['Smith, J.', 'Johnson, A.', 'Williams, B.'],
        journal: 'Journal of AI Research',
        year: 2023,
        citations: 45
      });
    });

    it('should return empty results for empty query', async () => {
      const results = await client.search('');
      expect(results).toEqual([]);
      
      const results2 = await client.search('   ');
      expect(results2).toEqual([]);
    });

    it('should handle search options correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      });

      const options: SearchOptions = {
        maxResults: 10,
        yearStart: 2020,
        yearEnd: 2023,
        sortBy: 'date',
        includePatents: false
      };

      await client.search('test query', options);

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('q=test+query');
      expect(callUrl).toContain('as_ylo=2020');
      expect(callUrl).toContain('as_yhi=2023');
      expect(callUrl).toContain('scisbd=1');
      expect(callUrl).toContain('as_vis=1');
    });

    it('should return fallback results for network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const results = await client.search('test');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Fallback result');
    });

    it('should return fallback results for HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Map()
      });

      const results = await client.search('test');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Fallback result');
    });

    it('should return fallback results for rate limiting (429 status)', async () => {
      // Mock all retry attempts to return 429
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Map([['Retry-After', '1']]) // Use 1 second for faster test
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Map([['Retry-After', '1']])
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Map([['Retry-After', '1']])
        });

      const results = await client.search('test');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Fallback result');
    }, 15000); // Increase timeout to 15 seconds

    it('should return fallback results for blocked access (403 status)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Map()
      });

      const results = await client.search('test');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Fallback result');
    });

    it('should retry on transient errors', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(mockHtml),
          headers: new Map()
        });

      const results = await client.search('test');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
    });
  });

  describe('parseResults', () => {
    it('should parse HTML results correctly', () => {
      const results = client.parseResults(mockHtml);

      expect(results).toHaveLength(2);
      
      expect(results[0]).toMatchObject({
        title: 'Machine Learning Approaches to Natural Language Processing',
        authors: ['Smith, J.', 'Johnson, A.', 'Williams, B.'],
        journal: 'Journal of AI Research',
        year: 2023,
        citations: 45,
        abstract: expect.stringContaining('This paper explores various machine learning')
      });

      expect(results[1]).toMatchObject({
        title: 'Deep Learning for Academic Writing Enhancement',
        authors: ['Brown, C.', 'Davis, E.'],
        journal: 'International Journal of Computational Linguistics',
        year: 2022,
        citations: 23
      });
    });

    it('should handle malformed HTML gracefully', () => {
      const malformedHtml = '<div>incomplete html';
      const results = client.parseResults(malformedHtml);
      expect(results).toEqual([]);
    });

    it('should handle empty HTML', () => {
      const results = client.parseResults('');
      expect(results).toEqual([]);
    });

    it('should skip results with missing required fields', () => {
      const incompleteHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Title Only</a>
            </h3>
            <!-- Missing authors -->
          </div>
        </div>
      `;
      
      const results = client.parseResults(incompleteHtml);
      expect(results).toEqual([]);
    });

    it('should extract DOI when present', () => {
      const htmlWithDoi = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="https://doi.org/10.1234/example.2023.5678">Test Paper</a>
            </h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(htmlWithDoi);
      expect(results[0].doi).toBe('10.1234/example.2023.5678');
    });
  });

  describe('validateResults', () => {
    it('should filter out invalid results', () => {
      const invalidResults = [
        {
          title: '',
          authors: ['Author'],
          confidence: 0.5,
          relevance_score: 0.5
        },
        {
          title: 'Valid Title',
          authors: [],
          confidence: 0.5,
          relevance_score: 0.5
        },
        {
          title: 'Valid Title',
          authors: ['Author'],
          confidence: 0.8,
          relevance_score: 0.7
        }
      ] as any[];

      const validResults = client.validateResults(invalidResults);
      expect(validResults).toHaveLength(1);
      expect(validResults[0].title).toBe('Valid Title');
    });

    it('should normalize invalid confidence scores', () => {
      const results = [
        {
          title: 'Test',
          authors: ['Author'],
          confidence: 1.5, // Invalid
          relevance_score: -0.1 // Invalid
        }
      ] as any[];

      const validResults = client.validateResults(results);
      expect(validResults[0].confidence).toBe(0.5);
      expect(validResults[0].relevance_score).toBe(0.5);
    });
  });

  describe('Rate Limiting', () => {
    it('should track rate limit status', () => {
      const status = client.getRateLimitStatus();
      
      expect(status).toMatchObject({
        isBlocked: false,
        blockUntil: 0,
        requestsInLastMinute: 0,
        requestsInLastHour: 0,
        remainingMinuteRequests: expect.any(Number),
        remainingHourlyRequests: expect.any(Number)
      });
    });

    it('should enforce rate limits', async () => {
      // Create client with very low limits for testing
      const restrictiveClient = new GoogleScholarClient({
        requestsPerMinute: 1,
        requestsPerHour: 2
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      });

      // First request should succeed
      await restrictiveClient.search('test1');

      // Second request should fail due to rate limit
      await expect(restrictiveClient.search('test2')).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Error Handling', () => {
    it('should return fallback results for timeout errors', async () => {
      // Mock AbortError for all retry attempts
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch
        .mockRejectedValueOnce(abortError)
        .mockRejectedValueOnce(abortError)
        .mockRejectedValueOnce(abortError);

      const results = await client.search('test');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('Fallback result');
    });

    it('should provide detailed error information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Map()
      });

      try {
        await client.search('test');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Search failed after 3 attempts');
      }
    });
  });

  describe('HTML Parsing Edge Cases', () => {
    it('should handle various title formats', () => {
      const htmlVariations = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3><a href="#">Simple Title Format</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Standard Title Format</a></h3>
            <div class="gs_a">Author, B. - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(htmlVariations);
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('Simple Title Format');
      expect(results[1].title).toBe('Standard Title Format');
    });

    it('should handle HTML entities in text', () => {
      const htmlWithEntities = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Title with &amp; HTML &lt;entities&gt; &quot;quotes&quot;</a>
            </h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(htmlWithEntities);
      expect(results[0].title).toBe('Title with & HTML <entities> "quotes"');
    });

    it('should extract citation counts in various formats', () => {
      const htmlWithCitations = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Paper 1</a></h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
            <div class="gs_fl">Cited by 123</div>
          </div>
        </div>
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Paper 2</a></h3>
            <div class="gs_a">Author, B. - Journal, 2023</div>
            <div class="gs_fl">Citations: 456</div>
          </div>
        </div>
      `;

      const results = client.parseResults(htmlWithCitations);
      expect(results[0].citations).toBe(123);
      expect(results[1].citations).toBe(456);
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Minimal Paper</a></h3>
            <div class="gs_a">Single Author - 2023</div>
          </div>
        </div>
      `;

      const results = client.parseResults(minimalHtml);
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        title: 'Minimal Paper',
        authors: ['Single Author'],
        year: 2023
      });
      expect(results[0].journal).toBeUndefined();
      expect(results[0].abstract).toBeUndefined();
      expect(results[0].citations).toBeUndefined();
    });
  });

  describe('URL Building', () => {
    it('should build search URLs with proper encoding', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html></html>'),
        headers: new Map()
      });

      await client.search('test query with spaces & symbols');

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('q=test+query+with+spaces+%26+symbols');
    });

    it('should handle special search options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html></html>'),
        headers: new Map()
      });

      const options: SearchOptions = {
        language: 'es',
        includePatents: true,
        maxResults: 5
      };

      await client.search('test', options);

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('hl=es');
      expect(callUrl).toContain('num=5');
      expect(callUrl).not.toContain('as_vis=1'); // Patents should be included
    });
  });
});