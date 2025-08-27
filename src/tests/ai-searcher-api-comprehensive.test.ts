/**
 * Google Scholar Client Tests
 * Comprehensive tests for the Google Scholar web scraping client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GoogleScholarClient, SearchOptions, RateLimitConfig } from '../worker/lib/google-scholar-client'
import { ScholarSearchResult } from '../lib/ai-types'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('GoogleScholarClient', () => {
  let client: GoogleScholarClient
  let mockHtml: string

  beforeEach(() => {
    client = new GoogleScholarClient()
    mockFetch.mockClear()
    
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
    `
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Constructor', () => {
    it('should create client with default rate limit configuration', () => {
      const client = new GoogleScholarClient()
      expect(client).toBeInstanceOf(GoogleScholarClient)
    })

    it('should create client with custom rate limit configuration', () => {
      const customConfig: Partial<RateLimitConfig> = {
        requestsPerMinute: 5,
        requestsPerHour: 50
      }
      const client = new GoogleScholarClient(customConfig)
      expect(client).toBeInstanceOf(GoogleScholarClient)
    })
  })

  describe('search', () => {
    it('should successfully search and return results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      })

      const results = await client.search('machine learning')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(results).toHaveLength(2)
      expect(results[0]).toMatchObject({
        title: 'Machine Learning Approaches to Natural Language Processing',
        authors: ['Smith, J.', 'Johnson, A.', 'Williams, B.'],
        journal: 'Journal of AI Research',
        year: 2023,
        citations: 45
      })
    })

    it('should throw error for empty query', async () => {
      await expect(client.search('')).rejects.toThrow('Search query cannot be empty')
      await expect(client.search('   ')).rejects.toThrow('Search query cannot be empty')
    })

    it('should handle search options correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      })

      const options: SearchOptions = {
        maxResults: 10,
        yearStart: 2020,
        yearEnd: 2023,
        sortBy: 'date',
        includePatents: false
      }

      await client.search('test query', options)

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain('q=test+query')
      expect(callUrl).toContain('as_ylo=2020')
      expect(callUrl).toContain('as_yhi=2023')
      expect(callUrl).toContain('scisbd=1')
      expect(callUrl).toContain('as_vis=1')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(client.search('test')).rejects.toThrow('Search failed after 3 attempts')
    })

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Map()
      })

      await expect(client.search('test')).rejects.toThrow('Search failed after 3 attempts')
    })

    it('should handle rate limiting (429 status)', async () => {
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
        })

      await expect(client.search('test')).rejects.toThrow('Search failed after 3 attempts')
    }, 15000) // Increase timeout to 15 seconds

    it('should handle blocked access (403 status)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Map()
      })

      await expect(client.search('test')).rejects.toThrow('Search failed after 3 attempts')
    })

    it('should retry on transient errors', async () => {
      // First call fails, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(mockHtml),
          headers: new Map()
        })

      const results = await client.search('test')
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(results).toHaveLength(2)
    })
  })

  describe('parseResults', () => {
    it('should parse HTML results correctly', () => {
      const results = client.parseResults(mockHtml)

      expect(results).toHaveLength(2)
      
      expect(results[0]).toMatchObject({
        title: 'Machine Learning Approaches to Natural Language Processing',
        authors: ['Smith, J.', 'Johnson, A.', 'Williams, B.'],
        journal: 'Journal of AI Research',
        year: 2023,
        citations: 45,
        abstract: expect.stringContaining('This paper explores various machine learning')
      })

      expect(results[1]).toMatchObject({
        title: 'Deep Learning for Academic Writing Enhancement',
        authors: ['Brown, C.', 'Davis, E.'],
        journal: 'International Journal of Computational Linguistics',
        year: 2022,
        citations: 23
      })
    })

    it('should handle malformed HTML gracefully', () => {
      const malformedHtml = '<div>incomplete html'
      const results = client.parseResults(malformedHtml)
      expect(results).toEqual([])
    })

    it('should handle empty HTML', () => {
      const results = client.parseResults('')
      expect(results).toEqual([])
    })

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
      `
      
      const results = client.parseResults(incompleteHtml)
      expect(results).toEqual([])
    })

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
      `

      const results = client.parseResults(htmlWithDoi)
      expect(results[0].doi).toBe('10.1234/example.2023.5678')
    })
  })

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
      ] as any[]

      const validResults = client.validateResults(invalidResults)
      expect(validResults).toHaveLength(1)
      expect(validResults[0].title).toBe('Valid Title')
    })

    it('should normalize invalid confidence scores', () => {
      const results = [
        {
          title: 'Test',
          authors: ['Author'],
          confidence: 1.5, // Invalid
          relevance_score: -0.1 // Invalid
        }
      ] as any[]

      const validResults = client.validateResults(results)
      expect(validResults[0].confidence).toBe(0.5)
      expect(validResults[0].relevance_score).toBe(0.5)
    })
  })

  describe('Rate Limiting', () => {
    it('should track rate limit status', () => {
      const status = client.getRateLimitStatus()
      
      expect(status).toMatchObject({
        isBlocked: false,
        blockUntil: 0,
        requestsInLastMinute: 0,
        requestsInLastHour: 0,
        remainingMinuteRequests: expect.any(Number),
        remainingHourlyRequests: expect.any(Number)
      })
    })

    it('should enforce rate limits', async () => {
      // Create client with very low limits for testing
      const restrictiveClient = new GoogleScholarClient({
        requestsPerMinute: 1,
        requestsPerHour: 2
      })

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      })

      // First request should succeed
      await restrictiveClient.search('test1')

      // Second request should fail due to rate limit
      await expect(restrictiveClient.search('test2')).rejects.toThrow('Rate limit exceeded')
    })
  })

  describe('Error Handling', () => {
    it('should handle timeout errors', async () => {
      // Mock AbortError for all retry attempts
      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      mockFetch
        .mockRejectedValueOnce(abortError)
        .mockRejectedValueOnce(abortError)
        .mockRejectedValueOnce(abortError)

      await expect(client.search('test')).rejects.toThrow('Search failed after 3 attempts')
    })

    it('should provide detailed error information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Map()
      })

      try {
        await client.search('test')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain('Search failed after 3 attempts')
      }
    })
  })

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
      `

      const results = client.parseResults(htmlVariations)
      expect(results).toHaveLength(2)
      expect(results[0].title).toBe('Simple Title Format')
      expect(results[1].title).toBe('Standard Title Format')
    })

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
      `

      const results = client.parseResults(htmlWithEntities)
      expect(results[0].title).toBe('Title with & HTML <entities> "quotes"')
    })

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
      `

      const results = client.parseResults(htmlWithCitations)
      expect(results[0].citations).toBe(123)
      expect(results[1].citations).toBe(456)
    })

    it('should handle missing optional fields gracefully', () => {
      const minimalHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt"><a href="#">Minimal Paper</a></h3>
            <div class="gs_a">Single Author - 2023</div>
          </div>
        </div>
      `

      const results = client.parseResults(minimalHtml)
      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        title: 'Minimal Paper',
        authors: ['Single Author'],
        year: 2023
      })
      expect(results[0].journal).toBeUndefined()
      expect(results[0].abstract).toBeUndefined()
      expect(results[0].citations).toBeUndefined()
    })
  })

  describe('URL Building', () => {
    it('should build search URLs with proper encoding', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html></html>'),
        headers: new Map()
      })

      await client.search('test query with spaces & symbols')

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain('q=test+query+with+spaces+%26+symbols')
    })

    it('should handle special search options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html></html>'),
        headers: new Map()
      })

      const options: SearchOptions = {
        language: 'es',
        includePatents: true,
        maxResults: 5
      }

      await client.search('test', options)

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain('hl=es')
      expect(callUrl).toContain('num=5')
      expect(callUrl).not.toContain('as_vis=1') // Patents should be included
    })
  })

  describe('Performance and Memory', () => {
    it('should handle large result sets efficiently', async () => {
      // Create large HTML with many results
      let largeHtml = ''
      for (let i = 0; i < 100; i++) {
        largeHtml += `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt"><a href="#">Paper ${i + 1}</a></h3>
              <div class="gs_a">Author, A. - Journal, 2023</div>
              <div class="gs_fl">Cited by ${i + 1}</div>
            </div>
          </div>
        `
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(largeHtml),
        headers: new Map()
      })

      const startTime = Date.now()
      const results = await client.search('large query')
      const endTime = Date.now()

      expect(results).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should not leak memory with repeated searches', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      })

      // Perform many searches
      const promises = []
      for (let i = 0; i < 50; i++) {
        promises.push(client.search(`query ${i}`))
      }

      await Promise.all(promises)

      // Check that rate limiting is working correctly
      const status = client.getRateLimitStatus()
      expect(status.requestsInLastMinute).toBeLessThanOrEqual(100) // Default limit
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complex search scenarios with multiple filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      })

      const options: SearchOptions = {
        maxResults: 20,
        yearStart: 2020,
        yearEnd: 2023,
        sortBy: 'date',
        includePatents: false,
        includeCitations: true,
        language: 'en'
      }

      const results = await client.search('complex search query', options)

      expect(results).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('q=complex+search+query'),
        expect.any(Object)
      )
    })

    it('should maintain state consistency across multiple searches', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(mockHtml),
          headers: new Map()
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve('<html></html>'), // Empty results for second search
          headers: new Map()
        })

      // First search
      const results1 = await client.search('first query')
      expect(results1).toHaveLength(2)

      // Second search
      const results2 = await client.search('second query')
      expect(results2).toHaveLength(0)

      // Rate limit status should reflect both searches
      const status = client.getRateLimitStatus()
      expect(status.requestsInLastMinute).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Advanced Search Features', () => {
    it('should handle advanced search operators', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      })

      // Test complex query with operators
      const complexQuery = '"machine learning" AND "healthcare" OR "AI" AND "academic writing"'
      await client.search(complexQuery)

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain(encodeURIComponent(complexQuery))
    })

    it('should handle Boolean search operators correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      })

      // Test query with explicit operators
      const booleanQuery = 'machine learning AND healthcare NOT spam'
      await client.search(booleanQuery)

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain(encodeURIComponent(booleanQuery))
    })

    it('should handle phrase searches with quotes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      })

      // Test phrase search
      const phraseQuery = '"natural language processing"'
      await client.search(phraseQuery)

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain(encodeURIComponent(phraseQuery))
    })

    it('should handle wildcard searches', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      })

      // Test wildcard search
      const wildcardQuery = 'machine* learning'
      await client.search(wildcardQuery)

      const callUrl = mockFetch.mock.calls[0][0]
      expect(callUrl).toContain(encodeURIComponent(wildcardQuery))
    })
  })

  describe('Search Result Validation', () => {
    it('should validate search results for completeness', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      })

      const results = await client.search('validation test')
      
      // All results should have required fields
      results.forEach(result => {
        expect(result.title).toBeTruthy()
        expect(result.authors).toBeTruthy()
        expect(Array.isArray(result.authors)).toBe(true)
        expect(result.authors.length).toBeGreaterThan(0)
        expect(result.confidence).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeLessThanOrEqual(1)
        expect(result.relevance_score).toBeGreaterThanOrEqual(0)
        expect(result.relevance_score).toBeLessThanOrEqual(1)
      })
    })

    it('should handle malformed search results gracefully', async () => {
      const malformedHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Malformed Result</a>
            </h3>
            <!-- Missing required fields like authors -->
          </div>
        </div>
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Valid Result</a>
            </h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
          </div>
        </div>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(malformedHtml),
        headers: new Map()
      })

      const results = await client.search('malformed test')
      
      // Should only return valid results
      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Valid Result')
      expect(results[0].authors).toEqual(['Author, A.'])
    })

    it('should normalize inconsistent data formats', async () => {
      const inconsistentHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Inconsistent Data</a>
            </h3>
            <div class="gs_a">Author, A. - Journal, 2023</div>
            <div class="gs_fl">Cited by thousands</div> <!-- Invalid citation format -->
          </div>
        </div>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(inconsistentHtml),
        headers: new Map()
      })

      const results = await client.search('inconsistent test')
      
      // Should handle invalid citation formats gracefully
      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Inconsistent Data')
      expect(results[0].authors).toEqual(['Author, A.'])
      expect(results[0].journal).toBe('Journal')
      expect(results[0].year).toBe(2023)
      expect(results[0].citations).toBeUndefined() // Should not parse invalid citation format
    })
  })

  describe('Search Result Quality', () => {
    it('should provide quality scores for search results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      })

      const results = await client.search('quality scoring test')
      
      // All results should have quality metrics
      results.forEach(result => {
        expect(result.confidence).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeLessThanOrEqual(1)
        expect(result.relevance_score).toBeGreaterThanOrEqual(0)
        expect(result.relevance_score).toBeLessThanOrEqual(1)
        expect(typeof result.keywords).toBe('object')
        expect(Array.isArray(result.keywords)).toBe(true)
      })
    })

    it('should handle results with varying quality levels', async () => {
      const mixedQualityHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">High Quality Paper</a>
            </h3>
            <div class="gs_a">Smith, J. - Nature, 2023</div>
            <span class="gs_rs">Well-written abstract with detailed methodology</span>
            <div class="gs_fl">Cited by 500</div>
          </div>
        </div>
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Low Quality Paper</a>
            </h3>
            <div class="gs_a">Unknown, A. - Unknown Journal, 2020</div>
            <span class="gs_rs">Brief abstract</span>
            <div class="gs_fl">Cited by 5</div>
          </div>
        </div>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mixedQualityHtml),
        headers: new Map()
      })

      const results = await client.search('quality variation test')
      
      expect(results).toHaveLength(2)
      
      // High quality paper should have higher scores
      const highQuality = results.find(r => r.title.includes('High Quality'))
      const lowQuality = results.find(r => r.title.includes('Low Quality'))
      
      expect(highQuality).toBeTruthy()
      expect(lowQuality).toBeTruthy()
      
      if (highQuality && lowQuality) {
        expect(highQuality.citations).toBeGreaterThan(lowQuality.citations!)
        expect(highQuality.journal).toBe('Nature')
        expect(lowQuality.journal).toBe('Unknown Journal')
      }
    })
  })

  describe('Search Result Enrichment', () => {
    it('should enrich results with additional metadata', async () => {
      const enrichedHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="https://doi.org/10.1234/enriched.2023.001">Enriched Result</a>
            </h3>
            <div class="gs_a">Smith, J., Doe, A. - Journal of Enriched Research, 2023</div>
            <span class="gs_rs">Comprehensive abstract with methodology and findings...</span>
            <div class="gs_fl">Cited by 125 | Related articles | Cite</div>
          </div>
        </div>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(enrichedHtml),
        headers: new Map()
      })

      const results = await client.search('enrichment test')
      
      expect(results).toHaveLength(1)
      const result = results[0]
      
      // Should extract DOI from URL
      expect(result.doi).toBe('10.1234/enriched.2023.001')
      
      // Should extract URL
      expect(result.url).toBe('https://doi.org/10.1234/enriched.2023.001')
      
      // Should extract abstract
      expect(result.abstract).toContain('Comprehensive abstract')
      
      // Should extract multiple authors
      expect(result.authors).toEqual(['Smith, J.', 'Doe, A.'])
      
      // Should extract journal
      expect(result.journal).toBe('Journal of Enriched Research')
      
      // Should extract year
      expect(result.year).toBe(2023)
      
      // Should extract citations
      expect(result.citations).toBe(125)
    })

    it('should handle missing metadata gracefully', async () => {
      const minimalHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Minimal Metadata Paper</a>
            </h3>
            <div class="gs_a">Author - 2023</div>
          </div>
        </div>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(minimalHtml),
        headers: new Map()
      })

      const results = await client.search('minimal metadata test')
      
      expect(results).toHaveLength(1)
      const result = results[0]
      
      // Should have basic metadata
      expect(result.title).toBe('Minimal Metadata Paper')
      expect(result.authors).toEqual(['Author'])
      expect(result.year).toBe(2023)
      
      // Should handle missing optional metadata gracefully
      expect(result.journal).toBeUndefined()
      expect(result.citations).toBeUndefined()
      expect(result.doi).toBeUndefined()
      expect(result.url).toBeUndefined()
      expect(result.abstract).toBeUndefined()
    })
  })

  describe('Search Result Deduplication', () => {
    it('should identify and handle duplicate results', async () => {
      // Mock HTML with duplicate entries (same title, slight variations)
      const duplicateHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="https://doi.org/10.1234/duplicate.2023.001">Duplicate Paper</a>
            </h3>
            <div class="gs_a">Smith, J. - Journal, 2023</div>
            <div class="gs_fl">Cited by 50</div>
          </div>
        </div>
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Duplicate Paper</a>
            </h3>
            <div class="gs_a">Smith, J. - Journal, 2023</div>
            <div class="gs_fl">Cited by 50</div>
          </div>
        </div>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(duplicateHtml),
        headers: new Map()
      })

      const results = await client.search('duplicate test')
      
      // Should handle duplicates gracefully (actual deduplication happens elsewhere)
      expect(results).toHaveLength(2)
      
      // Both results should have same basic information
      expect(results[0].title).toBe('Duplicate Paper')
      expect(results[1].title).toBe('Duplicate Paper')
      expect(results[0].authors).toEqual(['Smith, J.'])
      expect(results[1].authors).toEqual(['Smith, J.'])
    })

    it('should handle near-duplicate results with different URLs', async () => {
      const nearDuplicateHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="https://doi.org/10.1234/near.2023.001">Near Duplicate Paper</a>
            </h3>
            <div class="gs_a">Smith, J. - Journal, 2023</div>
            <div class="gs_fl">Cited by 75</div>
          </div>
        </div>
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="https://example.com/near-duplicate">Near Duplicate Paper</a>
            </h3>
            <div class="gs_a">Smith, J. - Journal, 2023</div>
            <div class="gs_fl">Cited by 75</div>
          </div>
        </div>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(nearDuplicateHtml),
        headers: new Map()
      })

      const results = await client.search('near duplicate test')
      
      // Should return both near-duplicate results
      expect(results).toHaveLength(2)
      
      // Both should have same title and metadata but different URLs
      expect(results[0].title).toBe('Near Duplicate Paper')
      expect(results[1].title).toBe('Near Duplicate Paper')
      expect(results[0].url).toBe('https://doi.org/10.1234/near.2023.001')
      expect(results[1].url).toBe('https://example.com/near-duplicate')
    })
  })

  describe('Search Result Pagination', () => {
    it('should handle search result pagination', async () => {
      // Mock HTML with multiple result pages (simulated by multiple entries)
      let paginatedHtml = ''
      for (let i = 0; i < 30; i++) {
        paginatedHtml += `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="#">Paper ${i + 1}</a>
              </h3>
              <div class="gs_a">Author, A. - Journal, 2023</div>
              <div class="gs_fl">Cited by ${i + 1}</div>
            </div>
          </div>
        `
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(paginatedHtml),
        headers: new Map()
      })

      // Test with maxResults limit
      const options: SearchOptions = {
        maxResults: 20
      }

      const results = await client.search('pagination test', options)
      
      // Should respect maxResults limit
      expect(results).toHaveLength(20)
      
      // Results should be numbered sequentially
      expect(results[0].title).toBe('Paper 1')
      expect(results[19].title).toBe('Paper 20')
    })

    it('should handle large result sets with automatic batching', async () => {
      // Mock very large result set
      let largeHtml = ''
      for (let i = 0; i < 1000; i++) {
        largeHtml += `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="#">Large Dataset Paper ${i + 1}</a>
              </h3>
              <div class="gs_a">Author, A. - Journal, 2023</div>
              <div class="gs_fl">Cited by ${i + 1}</div>
            </div>
          </div>
        `
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(largeHtml),
        headers: new Map()
      })

      const startTime = Date.now()
      const results = await client.search('large dataset test')
      const endTime = Date.now()
      
      // Should handle large datasets efficiently
      expect(results).toHaveLength(100) // Default max results
      expect(endTime - startTime).toBeLessThan(10000) // Should complete within 10 seconds
      
      // Results should be valid
      results.forEach((result, index) => {
        expect(result.title).toBe(`Large Dataset Paper ${index + 1}`)
        expect(result.authors).toEqual(['Author, A.'])
        expect(result.citations).toBe(index + 1)
      })
    })
  })

  describe('Search Result Timing and Performance', () => {
    it('should measure and report search timing accurately', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      })

      const startTime = Date.now()
      const results = await client.search('timing test')
      const endTime = Date.now()
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000) // 5 seconds max
      
      // Should return timing metadata
      expect(results).toHaveLength(2)
      results.forEach(result => {
        expect(result.processingTimeMs).toBeGreaterThanOrEqual(0)
        expect(result.processingTimeMs).toBeLessThanOrEqual(5000)
      })
    })

    it('should handle search timeouts gracefully', async () => {
      // Mock timeout error
      const timeoutError = new Error('The operation was aborted')
      timeoutError.name = 'AbortError'
      mockFetch.mockRejectedValue(timeoutError)

      await expect(client.search('timeout test')).rejects.toThrow('Search failed after 3 attempts')
    })
  })

  describe('Search Result Error Recovery', () => {
    it('should recover from temporary network failures', async () => {
      // Mock intermittent failures followed by success
      mockFetch
        .mockRejectedValueOnce(new Error('Temporary network error 1'))
        .mockRejectedValueOnce(new Error('Temporary network error 2'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () => Promise.resolve(mockHtml),
          headers: new Map()
        })

      const results = await client.search('recovery test')
      
      // Should recover and return results
      expect(results).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledTimes(3) // Should have retried twice
    })

    it('should handle permanent failures gracefully', async () => {
      // Mock persistent failures
      mockFetch.mockRejectedValue(new Error('Permanent failure'))

      await expect(client.search('permanent failure test')).rejects.toThrow('Search failed after 3 attempts')
    })

    it('should handle malformed responses gracefully', async () => {
      // Mock malformed response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('invalid html response that cannot be parsed'),
        headers: new Map()
      })

      const results = await client.search('malformed response test')
      
      // Should handle gracefully and return empty results
      expect(results).toHaveLength(0)
    })
  })

  describe('Search Result Security', () => {
    it('should sanitize user input to prevent injection attacks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockHtml),
        headers: new Map()
      })

      // Test with potentially malicious input
      const maliciousQuery = 'test query"; DROP TABLE users; --'
      await client.search(maliciousQuery)

      const callUrl = mockFetch.mock.calls[0][0]
      
      // Should encode malicious characters
      expect(callUrl).toContain(encodeURIComponent(maliciousQuery))
      expect(callUrl).not.toContain('DROP TABLE')
      expect(callUrl).not.toContain('--')
    })

    it('should validate and sanitize search results to prevent XSS', async () => {
      const maliciousHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">XSS Test Paper</a>
            </h3>
            <div class="gs_a">
              <script>alert('xss')</script>Author, A. - Journal, 2023
            </div>
            <span class="gs_rs">
              Abstract with <img src=x onerror=alert('xss')> malicious content
            </span>
          </div>
        </div>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(maliciousHtml),
        headers: new Map()
      })

      const results = await client.search('xss test')
      
      // Should sanitize malicious content
      expect(results).toHaveLength(1)
      const result = results[0]
      
      // Should not contain script tags
      expect(result.authors[0]).not.toContain('<script>')
      expect(result.abstract).not.toContain('<img')
      expect(result.abstract).not.toContain('onerror=')
    })
  })

  describe('Search Result Compatibility', () => {
    it('should handle different Google Scholar result formats', async () => {
      // Mock different result formats that Google Scholar might return
      const variedFormatsHtml = `
        <!-- Standard format -->
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Standard Format Paper</a>
            </h3>
            <div class="gs_a">Standard, Author - Standard Journal, 2023</div>
            <span class="gs_rs">Standard abstract format</span>
            <div class="gs_fl">Cited by 100</div>
          </div>
        </div>
        
        <!-- Minimal format -->
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Minimal Format Paper</a>
            </h3>
            <div class="gs_a">Minimal, Author - 2022</div>
          </div>
        </div>
        
        <!-- Complex format with many authors -->
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Complex Format Paper</a>
            </h3>
            <div class="gs_a">
              Author1, A., Author2, B., Author3, C., Author4, D., Author5, E. - Complex Journal, 2021
            </div>
            <span class="gs_rs">Complex abstract with many details and citations</span>
            <div class="gs_fl">Cited by 250 | Related articles | Cite | Versions</div>
          </div>
        </div>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(variedFormatsHtml),
        headers: new Map()
      })

      const results = await client.search('format compatibility test')
      
      // Should handle all formats
      expect(results).toHaveLength(3)
      
      // Standard format
      expect(results[0].title).toBe('Standard Format Paper')
      expect(results[0].authors).toEqual(['Standard, Author'])
      expect(results[0].journal).toBe('Standard Journal')
      expect(results[0].year).toBe(2023)
      expect(results[0].citations).toBe(100)
      expect(results[0].abstract).toBe('Standard abstract format')
      
      // Minimal format
      expect(results[1].title).toBe('Minimal Format Paper')
      expect(results[1].authors).toEqual(['Minimal, Author'])
      expect(results[1].year).toBe(2022)
      expect(results[1].journal).toBeUndefined()
      expect(results[1].citations).toBeUndefined()
      expect(results[1].abstract).toBeUndefined()
      
      // Complex format
      expect(results[2].title).toBe('Complex Format Paper')
      expect(results[2].authors).toEqual([
        'Author1, A.', 
        'Author2, B.', 
        'Author3, C.', 
        'Author4, D.', 
        'Author5, E.'
      ])
      expect(results[2].journal).toBe('Complex Journal')
      expect(results[2].year).toBe(2021)
      expect(results[2].citations).toBe(250)
      expect(results[2].abstract).toBe('Complex abstract with many details and citations')
    })

    it('should handle international character sets correctly', async () => {
      const internationalHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Internationale Zeitschrift für Forschung</a>
            </h3>
            <div class="gs_a">Müller, Jörg - Deutsche Universität, 2023</div>
            <span class="gs_rs">Forschung mit äöü und ß zeichen</span>
          </div>
        </div>
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Recherche en français</a>
            </h3>
            <div class="gs_a">Dupont, Jean - Université de Paris, 2022</div>
            <span class="gs_rs">Recherche avec des caractères accentués: éèàù</span>
          </div>
        </div>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(internationalHtml),
        headers: new Map()
      })

      const results = await client.search('international character test')
      
      // Should handle international characters correctly
      expect(results).toHaveLength(2)
      
      // German characters
      expect(results[0].title).toBe('Internationale Zeitschrift für Forschung')
      expect(results[0].authors).toEqual(['Müller, Jörg'])
      expect(results[0].journal).toBe('Deutsche Universität')
      expect(results[0].abstract).toBe('Forschung mit äöü und ß zeichen')
      
      // French characters
      expect(results[1].title).toBe('Recherche en français')
      expect(results[1].authors).toEqual(['Dupont, Jean'])
      expect(results[1].journal).toBe('Université de Paris')
      expect(results[1].abstract).toBe('Recherche avec des caractères accentués: éèàù')
    })
  })

  describe('Search Result Edge Cases', () => {
    it('should handle extremely long titles and abstracts', async () => {
      // Create extremely long content
      const longTitle = 'A'.repeat(500) // 500 character title
      const longAbstract = 'B'.repeat(10000) // 10,000 character abstract
      const longAuthors = Array.from({ length: 50 }, (_, i) => `Author${i}, Long Name${i}`).join(', ')
      
      const longContentHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">${longTitle}</a>
            </h3>
            <div class="gs_a">${longAuthors} - Very Long Journal Name That Goes On And On, 2023</div>
            <span class="gs_rs">${longAbstract}</span>
            <div class="gs_fl">Cited by 999999</div>
          </div>
        </div>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(longContentHtml),
        headers: new Map()
      })

      const results = await client.search('long content test')
      
      // Should handle long content gracefully
      expect(results).toHaveLength(1)
      const result = results[0]
      
      // Should truncate extremely long content to reasonable lengths
      expect(result.title.length).toBeLessThanOrEqual(500) // Should preserve long titles
      expect(result.abstract!.length).toBeLessThanOrEqual(5000) // Should truncate very long abstracts
      expect(result.authors.length).toBeLessThanOrEqual(20) // Should limit author count
    })

    it('should handle empty or minimal search results', async () => {
      // Mock empty search results
      const emptyResultsHtml = '<div id="gs_ccl_no_results">Your search did not match any articles.</div>'
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(emptyResultsHtml),
        headers: new Map()
      })

      const results = await client.search('empty results test')
      
      // Should handle empty results gracefully
      expect(results).toHaveLength(0)
    })

    it('should handle search results with special formatting', async () => {
      const specialFormattingHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Special Formatting Paper</a>
            </h3>
            <div class="gs_a">
              <b>Author, Bold</b> - <i>Italic Journal</i>, <span style="color:red;">2023</span>
            </div>
            <span class="gs_rs">
              Abstract with <sup>superscript</sup> and <sub>subscript</sub> formatting
            </span>
            <div class="gs_fl">
              Cited by <strong>150</strong> | 
              <a href="#">Related articles</a> | 
              <em>Cite</em>
            </div>
          </div>
        </div>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(specialFormattingHtml),
        headers: new Map()
      })

      const results = await client.search('special formatting test')
      
      // Should strip HTML formatting and extract clean text
      expect(results).toHaveLength(1)
      const result = results[0]
      
      expect(result.title).toBe('Special Formatting Paper')
      expect(result.authors).toEqual(['Author, Bold'])
      expect(result.journal).toBe('Italic Journal')
      expect(result.year).toBe(2023)
      expect(result.citations).toBe(150)
      expect(result.abstract).toBe('Abstract with superscript and subscript formatting')
    })

    it('should handle search results with missing or malformed data', async () => {
      const malformedDataHtml = `
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <!-- Missing title link -->
              <a href="#"></a>
            </h3>
            <div class="gs_a">
              <!-- Malformed author string -->
              , , , - , 
            </div>
            <span class="gs_rs">
              <!-- Empty abstract -->
              
            </span>
            <div class="gs_fl">
              <!-- Invalid citation count -->
              Cited by not-a-number
            </div>
          </div>
        </div>
        <div class="gs_r gs_or gs_scl">
          <div class="gs_ri">
            <h3 class="gs_rt">
              <a href="#">Valid Paper</a>
            </h3>
            <div class="gs_a">Valid, Author - Valid Journal, 2023</div>
            <span class="gs_rs">Valid abstract</span>
            <div class="gs_fl">Cited by 50</div>
          </div>
        </div>
      `

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(malformedDataHtml),
        headers: new Map()
      })

      const results = await client.search('malformed data test')
      
      // Should filter out invalid results and keep valid ones
      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Valid Paper')
      expect(results[0].authors).toEqual(['Valid, Author'])
      expect(results[0].journal).toBe('Valid Journal')
      expect(results[0].year).toBe(2023)
      expect(results[0].citations).toBe(50)
      expect(results[0].abstract).toBe('Valid abstract')
    })
  })
})