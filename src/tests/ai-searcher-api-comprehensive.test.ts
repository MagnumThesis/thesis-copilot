/**
 * AI Searcher API Tests
 * Comprehensive tests for the AI Searcher API endpoints
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AISearcherAPIHandler } from '../worker/handlers/ai-searcher-api'
import { 
  ScholarSearchResult, 
  ExtractedContent, 
  SearchFilters,
  ContentExtractionRequest
} from '../lib/ai-types'

// Mock environment
const mockEnv = {
  SUPABASE_URL: 'test-supabase-url',
  SUPABASE_ANON: 'test-supabase-anon-key',
  DB: {
    prepare: vi.fn()
  }
}

// Mock database response chain
const createMockDbChain = () => ({
  bind: vi.fn().mockReturnThis(),
  run: vi.fn().mockResolvedValue({ success: true }),
  first: vi.fn().mockResolvedValue(null),
  all: vi.fn().mockResolvedValue({ results: [] })
})

describe('AISearcherAPIHandler', () => {
  let apiHandler: AISearcherAPIHandler
  let mockContext: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default mock that works for all database operations
    const defaultMockChain = createMockDbChain()
    mockEnv.DB.prepare.mockReturnValue(defaultMockChain)
    
    apiHandler = new AISearcherAPIHandler()
    
    // Mock context with common properties
    mockContext = {
      req: {
        json: vi.fn(),
        query: vi.fn()
      },
      json: vi.fn(),
      env: mockEnv
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('search', () => {
    it('should perform search with content extraction and query generation', async () => {
      // Mock request body
      const requestBody = {
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' },
          { source: 'builder', id: 'test-conversation-123' }
        ],
        queryOptions: {
          maxKeywords: 5,
          optimizeForAcademic: true
        },
        filters: {
          dateRange: { start: 2020, end: 2023 },
          sortBy: 'relevance' as const
        }
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock content extraction responses
      const mockExtractedContent: ExtractedContent[] = [
        {
          source: 'ideas',
          id: '1',
          title: 'Machine Learning Concepts',
          content: 'Research on machine learning algorithms and applications in healthcare.',
          keywords: ['machine learning', 'healthcare', 'algorithms'],
          keyPhrases: ['machine learning algorithms', 'healthcare applications'],
          topics: ['artificial intelligence', 'medical informatics'],
          confidence: 0.9
        },
        {
          source: 'builder',
          id: 'test-conversation-123',
          title: 'AI in Academic Writing',
          content: 'Exploring the use of artificial intelligence in improving academic writing quality.',
          keywords: ['AI', 'academic writing', 'quality improvement'],
          keyPhrases: ['artificial intelligence', 'academic writing quality'],
          topics: ['educational technology', 'writing assistance'],
          confidence: 0.85
        }
      ]

      // Mock query generation response
      const mockQueries = [
        {
          id: 'query-1',
          query: '"machine learning" AND "healthcare" AND "algorithms"',
          originalContent: [mockExtractedContent[0]],
          generatedAt: new Date(),
          confidence: 0.9,
          keywords: ['machine learning', 'healthcare', 'algorithms'],
          topics: ['artificial intelligence', 'medical informatics'],
          queryType: 'basic' as const,
          optimization: {
            breadthScore: 0.7,
            specificityScore: 0.8,
            academicRelevance: 0.9,
            suggestions: [],
            alternativeQueries: []
          }
        },
        {
          id: 'query-2',
          query: '"AI" AND "academic writing" AND "quality improvement"',
          originalContent: [mockExtractedContent[1]],
          generatedAt: new Date(),
          confidence: 0.85,
          keywords: ['AI', 'academic writing', 'quality improvement'],
          topics: ['educational technology', 'writing assistance'],
          queryType: 'basic' as const,
          optimization: {
            breadthScore: 0.6,
            specificityScore: 0.7,
            academicRelevance: 0.85,
            suggestions: [],
            alternativeQueries: []
          }
        }
      ]

      // Mock search results
      const mockSearchResults: ScholarSearchResult[] = [
        {
          title: 'Machine Learning in Healthcare Applications',
          authors: ['Smith, J.', 'Doe, A.'],
          journal: 'Nature Medicine',
          year: 2023,
          citations: 150,
          doi: '10.1038/nm.2023.001',
          url: 'https://nature.com/paper1',
          abstract: 'This paper explores machine learning applications in healthcare...',
          keywords: ['machine learning', 'healthcare', 'applications'],
          confidence: 0.95,
          relevance_score: 0.9,
          citation_count: 150
        },
        {
          title: 'AI-Powered Academic Writing Tools',
          authors: ['Johnson, B.', 'Wilson, M.'],
          journal: 'Computational Linguistics',
          year: 2022,
          citations: 89,
          doi: '10.1162/coli_a_004',
          url: 'https://cl.org/paper2',
          abstract: 'A study on AI tools for academic writing assistance...',
          keywords: ['AI', 'academic writing', 'tools'],
          confidence: 0.88,
          relevance_score: 0.85,
          citation_count: 89
        }
      ]

      // Mock the various API calls
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            idea: {
              id: 1,
              title: 'Machine Learning Concepts',
              description: 'Research on machine learning algorithms and applications in healthcare.',
              content: 'Research on machine learning algorithms and applications in healthcare.',
              type: 'concept',
              tags: ['machine learning', 'healthcare'],
              confidence: 0.9,
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
              conversationid: 'test-conversation-123'
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            content: 'Exploring the use of artificial intelligence in improving academic writing quality.',
            title: 'AI in Academic Writing',
            updated_at: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            wordCount: 150,
            lastModified: '2023-01-01T00:00:00Z'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => `
            <div class="gs_r gs_or gs_scl">
              <div class="gs_ri">
                <h3 class="gs_rt">
                  <a href="https://nature.com/paper1">Machine Learning in Healthcare Applications</a>
                </h3>
                <div class="gs_a">Smith, J., Doe, A. - Nature Medicine, 2023</div>
                <span class="gs_rs">This paper explores machine learning applications in healthcare...</span>
                <div class="gs_fl">Cited by 150</div>
              </div>
            </div>
            <div class="gs_r gs_or gs_scl">
              <div class="gs_ri">
                <h3 class="gs_rt">
                  <a href="https://cl.org/paper2">AI-Powered Academic Writing Tools</a>
                </h3>
                <div class="gs_a">Johnson, B., Wilson, M. - Computational Linguistics, 2022</div>
                <span class="gs_rs">A study on AI tools for academic writing assistance...</span>
                <div class="gs_fl">Cited by 89</div>
              </div>
            </div>
          `
        })

      await apiHandler.search(mockContext)

      // Should call the context.json with search results
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.arrayContaining([
            expect.objectContaining({
              title: 'Machine Learning in Healthcare Applications',
              authors: ['Smith, J.', 'Doe, A.'],
              journal: 'Nature Medicine',
              year: 2023,
              citations: 150,
              doi: '10.1038/nm.2023.001',
              url: 'https://nature.com/paper1',
              abstract: expect.stringContaining('machine learning applications'),
              keywords: expect.arrayContaining(['machine learning', 'healthcare']),
              confidence: expect.closeTo(0.95, 0.1),
              relevance_score: expect.closeTo(0.9, 0.1),
              citation_count: 150
            }),
            expect.objectContaining({
              title: 'AI-Powered Academic Writing Tools',
              authors: ['Johnson, B.', 'Wilson, M.'],
              journal: 'Computational Linguistics',
              year: 2022,
              citations: 89,
              doi: '10.1162/coli_a_004',
              url: 'https://cl.org/paper2',
              abstract: expect.stringContaining('AI tools for academic writing'),
              keywords: expect.arrayContaining(['AI', 'academic writing']),
              confidence: expect.closeTo(0.88, 0.1),
              relevance_score: expect.closeTo(0.85, 0.1),
              citation_count: 89
            })
          ]),
          total_results: 2,
          loaded_results: 2,
          has_more: false,
          query: expect.any(String),
          originalQuery: undefined,
          generatedQueries: expect.any(Array),
          extractedContent: expect.any(Array),
          filters: expect.any(Object),
          sessionId: expect.any(String),
          processingTime: expect.any(Number),
          learningApplied: true,
          performance_metrics: expect.any(Object),
          search_metadata: expect.any(Object)
        })
      )
    })

    it('should handle search with direct query input', async () => {
      // Mock request body with direct query
      const requestBody = {
        query: '"machine learning" AND "healthcare"',
        conversationId: 'test-conversation-123',
        filters: {
          maxResults: 10,
          sortBy: 'relevance' as const
        }
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Direct Query Search Result</a>
              </h3>
              <div class="gs_a">Author, A. - Journal, 2023</div>
              <span class="gs_rs">Abstract of the paper...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      await apiHandler.search(mockContext)

      // Should call the context.json with search results
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.arrayContaining([
            expect.objectContaining({
              title: 'Direct Query Search Result',
              authors: ['Author, A.'],
              journal: 'Journal',
              year: 2023,
              citations: 50,
              abstract: expect.stringContaining('Abstract of the paper'),
              confidence: expect.any(Number),
              relevance_score: expect.any(Number)
            })
          ]),
          query: '"machine learning" AND "healthcare"',
          originalQuery: '"machine learning" AND "healthcare"'
        })
      )
    })

    it('should validate required parameters', async () => {
      // Mock request body without conversationId
      const requestBody = {
        query: 'test query'
        // Missing conversationId
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.search(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle empty query error', async () => {
      // Mock request body with empty query and no content sources
      const requestBody = {
        conversationId: 'test-conversation-123'
        // Empty query and no content sources
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.search(mockContext)

      // Should return error for missing query
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Query is required (either directly or via content sources)',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle search errors gracefully', async () => {
      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Search service unavailable'))

      await apiHandler.search(mockContext)

      // Should return error response with fallback results
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to perform AI search',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle content extraction errors', async () => {
      // Mock request body with content sources
      const requestBody = {
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: 'nonexistent' }
        ]
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock content extraction failure
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await apiHandler.search(mockContext)

      // Should fall back to query generation error
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Query is required (either directly or via content sources)',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle rate limiting errors', async () => {
      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock rate limit error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['Retry-After', '30']])
      })

      await apiHandler.search(mockContext)

      // Should return error response for rate limiting
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to perform AI search',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle service unavailable errors', async () => {
      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock service unavailable error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      })

      await apiHandler.search(mockContext)

      // Should return error response for service unavailable
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to perform AI search',
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('extract', () => {
    it('should extract metadata from DOI', async () => {
      // Mock request body with DOI
      const requestBody = {
        source: '10.1038/nm.2023.001',
        type: 'doi',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results for DOI
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://doi.org/10.1038/nm.2023.001">Machine Learning in Healthcare</a>
              </h3>
              <div class="gs_a">Smith, J., Doe, A. - Nature Medicine, 2023</div>
              <span class="gs_rs">This paper explores machine learning applications in healthcare...</span>
              <div class="gs_fl">Cited by 150</div>
            </div>
          </div>
        `
      })

      await apiHandler.extract(mockContext)

      // Should return extracted metadata
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          metadata: expect.objectContaining({
            title: 'Machine Learning in Healthcare',
            authors: expect.arrayContaining(['Smith, J.', 'Doe, A.']),
            journal: 'Nature Medicine',
            year: 2023,
            citations: 150,
            doi: '10.1038/nm.2023.001',
            url: 'https://doi.org/10.1038/nm.2023.001',
            abstract: expect.stringContaining('machine learning applications'),
            keywords: expect.any(Array),
            confidence: expect.any(Number),
            relevance_score: expect.any(Number)
          }),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should extract metadata from URL', async () => {
      // Mock request body with URL
      const requestBody = {
        source: 'https://example.com/research-paper',
        type: 'url',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results for URL
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/research-paper">Research Paper Title</a>
              </h3>
              <div class="gs_a">Researcher, A., Scientist, B. - Research Journal, 2023</div>
              <span class="gs_rs">Abstract of the research paper...</span>
              <div class="gs_fl">Cited by 75</div>
            </div>
          </div>
        `
      })

      await apiHandler.extract(mockContext)

      // Should return extracted metadata
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          metadata: expect.objectContaining({
            title: 'Research Paper Title',
            authors: expect.arrayContaining(['Researcher, A.', 'Scientist, B.']),
            journal: 'Research Journal',
            year: 2023,
            citations: 75,
            url: 'https://example.com/research-paper',
            abstract: expect.stringContaining('Abstract of the research paper'),
            keywords: expect.any(Array),
            confidence: expect.any(Number),
            relevance_score: expect.any(Number)
          }),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle missing source parameter', async () => {
      // Mock request body without source
      const requestBody = {
        type: 'doi',
        conversationId: 'test-conversation-123'
        // Missing source
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.extract(mockContext)

      // Should return error for missing source
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Source and conversationId are required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle missing conversationId parameter', async () => {
      // Mock request body without conversationId
      const requestBody = {
        source: '10.1234/test.2023.001',
        type: 'doi'
        // Missing conversationId
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.extract(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Source and conversationId are required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle extraction errors gracefully', async () => {
      // Mock request body
      const requestBody = {
        source: '10.1234/nonexistent.doi',
        type: 'doi',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock extraction failure
      global.fetch = vi.fn().mockRejectedValue(new Error('DOI not found'))

      await apiHandler.extract(mockContext)

      // Should return fallback metadata
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          metadata: expect.objectContaining({
            title: 'Extraction Failed',
            authors: ['Unknown Author'],
            journal: undefined,
            publication_date: undefined,
            doi: '10.1234/nonexistent.doi',
            url: '10.1234/nonexistent.doi',
            abstract: expect.stringContaining('Failed to extract metadata'),
            keywords: [],
            confidence: expect.closeTo(0.1, 0.05),
            relevance_score: expect.closeTo(0.1, 0.05)
          }),
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('generateQuery', () => {
    it('should generate queries from content sources', async () => {
      // Mock request body
      const requestBody = {
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' },
          { source: 'builder', id: 'test-conversation-123' }
        ],
        options: {
          maxKeywords: 5,
          optimizeForAcademic: true
        }
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock content extraction responses
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            idea: {
              id: 1,
              title: 'Machine Learning Concepts',
              description: 'Research on machine learning algorithms and applications.',
              content: 'Research on machine learning algorithms and applications.',
              type: 'concept',
              tags: ['machine learning', 'algorithms'],
              confidence: 0.9,
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
              conversationid: 'test-conversation-123'
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            content: 'Exploring the use of algorithms in research applications.',
            title: 'Algorithm Research',
            updated_at: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            wordCount: 100,
            lastModified: '2023-01-01T00:00:00Z'
          })
        })

      await apiHandler.generateQuery(mockContext)

      // Should return generated queries
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          queries: expect.any(Array),
          extractedContent: expect.any(Array),
          totalExtracted: 2,
          processingTime: expect.any(Number)
        })
      )

      // Should have generated queries
      const response = mockContext.json.mock.calls[0][0]
      expect(response.queries).toHaveLength(1)
      expect(response.queries[0]).toMatchObject({
        query: expect.any(String),
        confidence: expect.any(Number),
        keywords: expect.any(Array),
        topics: expect.any(Array)
      })
    })

    it('should validate required parameters', async () => {
      // Mock request body without conversationId
      const requestBody = {
        contentSources: [
          { source: 'ideas', id: '1' }
        ]
        // Missing conversationId
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.generateQuery(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId and contentSources are required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate content sources parameter', async () => {
      // Mock request body without contentSources
      const requestBody = {
        conversationId: 'test-conversation-123'
        // Missing contentSources
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.generateQuery(mockContext)

      // Should return error for missing contentSources
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId and contentSources are required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle content extraction errors', async () => {
      // Mock request body
      const requestBody = {
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: 'nonexistent' }
        ]
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock content extraction failure
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await apiHandler.generateQuery(mockContext)

      // Should return error for content extraction failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'No content could be extracted from the provided sources',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle query generation errors', async () => {
      // Mock request body
      const requestBody = {
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ]
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock content extraction success but query generation error
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          idea: {
            id: 1,
            title: 'Test Idea',
            description: 'Test content',
            content: 'Test content',
            type: 'concept',
            tags: ['test'],
            confidence: 0.5,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            conversationid: 'test-conversation-123'
          }
        })
      })

      // Mock query generation to throw error
      const originalGenerateQueries = (apiHandler as any).queryEngine.generateQueries
      vi.spyOn((apiHandler as any).queryEngine, 'generateQueries').mockImplementation(() => {
        throw new Error('Query generation failed')
      })

      await apiHandler.generateQuery(mockContext)

      // Should return error for query generation failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to generate queries',
          details: expect.stringContaining('Query generation failed'),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).queryEngine, 'generateQueries').mockRestore()
    })
  })

  describe('extractContent', () => {
    it('should extract content from multiple sources', async () => {
      // Mock request body
      const requestBody: ContentExtractionRequest = {
        conversationId: 'test-conversation-123',
        sources: [
          { source: 'ideas', id: '1' },
          { source: 'builder', id: 'test-conversation-123' }
        ]
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock content extraction responses
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            idea: {
              id: 1,
              title: 'Idea Content',
              description: 'Content from ideas tool',
              content: 'Content from ideas tool',
              type: 'concept',
              tags: ['idea'],
              confidence: 0.9,
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z',
              conversationid: 'test-conversation-123'
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            content: 'Content from builder tool',
            title: 'Builder Content',
            updated_at: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            wordCount: 50,
            lastModified: '2023-01-01T00:00:00Z'
          })
        })

      await apiHandler.extractContent(mockContext)

      // Should return extracted content
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          extractedContent: expect.arrayContaining([
            expect.objectContaining({
              source: 'ideas',
              id: '1',
              title: 'Idea Content',
              content: 'Content from ideas tool',
              keywords: expect.any(Array),
              keyPhrases: expect.any(Array),
              topics: expect.any(Array),
              confidence: expect.closeTo(0.9, 0.1)
            }),
            expect.objectContaining({
              source: 'builder',
              id: 'test-conversation-123',
              title: 'Builder Content',
              content: 'Content from builder tool',
              keywords: expect.any(Array),
              keyPhrases: expect.any(Array),
              topics: expect.any(Array),
              confidence: expect.closeTo(0.8, 0.1)
            })
          ]),
          totalExtracted: 2,
          errors: undefined,
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required parameters', async () => {
      // Mock request body without conversationId
      const requestBody = {
        sources: [
          { source: 'ideas', id: '1' }
        ]
        // Missing conversationId
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.extractContent(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId and sources are required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate sources parameter', async () => {
      // Mock request body without sources
      const requestBody = {
        conversationId: 'test-conversation-123'
        // Missing sources
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.extractContent(mockContext)

      // Should return error for missing sources
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId and sources are required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle content extraction errors gracefully', async () => {
      // Mock request body
      const requestBody: ContentExtractionRequest = {
        conversationId: 'test-conversation-123',
        sources: [
          { source: 'ideas', id: 'nonexistent' },
          { source: 'builder', id: 'test-conversation-123' }
        ]
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock first extraction failure, second success
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            content: 'Content from builder tool',
            title: 'Builder Content',
            updated_at: '2023-01-01T00:00:00Z',
            created_at: '2023-01-01T00:00:00Z',
            wordCount: 50,
            lastModified: '2023-01-01T00:00:00Z'
          })
        })

      await apiHandler.extractContent(mockContext)

      // Should return partial results with errors
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          extractedContent: expect.arrayContaining([
            expect.objectContaining({
              source: 'builder',
              title: 'Builder Content',
              content: 'Content from builder tool'
            })
          ]),
          totalExtracted: 1,
          errors: expect.arrayContaining([
            expect.objectContaining({
              source: 'ideas',
              id: 'nonexistent',
              error: expect.any(String)
            })
          ]),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle all content extraction failures', async () => {
      // Mock request body
      const requestBody: ContentExtractionRequest = {
        conversationId: 'test-conversation-123',
        sources: [
          { source: 'ideas', id: 'nonexistent1' },
          { source: 'builder', id: 'nonexistent2' }
        ]
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock all extraction failures
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await apiHandler.extractContent(mockContext)

      // Should return error when all extractions fail
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          extractedContent: [],
          totalExtracted: 0,
          errors: expect.arrayContaining([
            expect.objectContaining({
              source: 'ideas',
              id: 'nonexistent1'
            }),
            expect.objectContaining({
              source: 'builder',
              id: 'nonexistent2'
            })
          ]),
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('contentPreview', () => {
    it('should preview content from a single source', async () => {
      // Mock request body
      const requestBody = {
        conversationId: 'test-conversation-123',
        source: 'ideas',
        id: '1'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock content extraction response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          idea: {
            id: 1,
            title: 'Preview Content',
            description: 'This is preview content from ideas tool',
            content: 'This is preview content from ideas tool',
            type: 'concept',
            tags: ['preview', 'ideas'],
            confidence: 0.8,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            conversationid: 'test-conversation-123'
          }
        })
      })

      await apiHandler.contentPreview(mockContext)

      // Should return preview content
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          extractedContent: expect.objectContaining({
            source: 'ideas',
            id: '1',
            title: 'Preview Content',
            content: 'This is preview content from ideas tool',
            keywords: expect.any(Array),
            keyPhrases: expect.any(Array),
            topics: expect.any(Array),
            confidence: expect.closeTo(0.8, 0.1)
          }),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required parameters', async () => {
      // Mock request body without conversationId
      const requestBody = {
        source: 'ideas',
        id: '1'
        // Missing conversationId
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.contentPreview(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId, source, and id are required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate source parameter', async () => {
      // Mock request body without source
      const requestBody = {
        conversationId: 'test-conversation-123',
        id: '1'
        // Missing source
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.contentPreview(mockContext)

      // Should return error for missing source
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId, source, and id are required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate id parameter', async () => {
      // Mock request body without id
      const requestBody = {
        conversationId: 'test-conversation-123',
        source: 'ideas'
        // Missing id
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.contentPreview(mockContext)

      // Should return error for missing id
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId, source, and id are required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle content extraction errors', async () => {
      // Mock request body
      const requestBody = {
        conversationId: 'test-conversation-123',
        source: 'ideas',
        id: 'nonexistent'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock content extraction failure
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await apiHandler.contentPreview(mockContext)

      // Should return error for content extraction failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to preview content from ideas',
          details: expect.stringContaining('not found'),
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('validateQuery', () => {
    it('should validate a query and provide suggestions', async () => {
      // Mock request body
      const requestBody = {
        query: '"machine learning" AND "healthcare" OR "AI"'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.validateQuery(mockContext)

      // Should return query validation
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          validation: expect.objectContaining({
            isValid: expect.any(Boolean),
            issues: expect.any(Array),
            suggestions: expect.any(Array),
            confidence: expect.any(Number)
          }),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required query parameter', async () => {
      // Mock request body without query
      const requestBody = {
        // Missing query
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.validateQuery(mockContext)

      // Should return error for missing query
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Query is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle query validation errors', async () => {
      // Mock request body
      const requestBody = {
        query: '' // Empty query
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock query validation to throw error
      const originalValidateQuery = (apiHandler as any).queryEngine.validateQuery
      vi.spyOn((apiHandler as any).queryEngine, 'validateQuery').mockImplementation(() => {
        throw new Error('Query validation failed')
      })

      await apiHandler.validateQuery(mockContext)

      // Should return error for query validation failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to validate query',
          details: expect.stringContaining('Query validation failed'),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).queryEngine, 'validateQuery').mockRestore()
    })
  })

  describe('combineQueries', () => {
    it('should combine multiple queries into one optimized query', async () => {
      // Mock request body
      const requestBody = {
        queries: [
          {
            id: 'query-1',
            query: '"machine learning" AND "healthcare"',
            originalContent: [],
            generatedAt: new Date(),
            confidence: 0.9,
            keywords: ['machine learning', 'healthcare'],
            topics: ['AI', 'medicine'],
            queryType: 'basic' as const,
            optimization: {
              breadthScore: 0.7,
              specificityScore: 0.8,
              academicRelevance: 0.9,
              suggestions: [],
              alternativeQueries: []
            }
          },
          {
            id: 'query-2',
            query: '"AI" AND "academic writing"',
            originalContent: [],
            generatedAt: new Date(),
            confidence: 0.8,
            keywords: ['AI', 'academic writing'],
            topics: ['AI', 'education'],
            queryType: 'basic' as const,
            optimization: {
              breadthScore: 0.6,
              specificityScore: 0.7,
              academicRelevance: 0.8,
              suggestions: [],
              alternativeQueries: []
            }
          }
        ]
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.combineQueries(mockContext)

      // Should return combined query
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          combinedQuery: expect.objectContaining({
            query: expect.any(String),
            confidence: expect.any(Number),
            keywords: expect.any(Array),
            topics: expect.any(Array)
          }),
          processingTime: expect.any(Number)
        })
      )

      // Combined query should contain terms from both input queries
      const response = mockContext.json.mock.calls[0][0]
      const combinedQuery = response.combinedQuery.query.toLowerCase()
      expect(combinedQuery).toContain('machine learning')
      expect(combinedQuery).toContain('healthcare')
      expect(combinedQuery).toContain('ai')
      expect(combinedQuery).toContain('academic writing')
    })

    it('should validate required queries parameter', async () => {
      // Mock request body without queries
      const requestBody = {
        // Missing queries
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.combineQueries(mockContext)

      // Should return error for missing queries
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Queries array is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate non-empty queries array', async () => {
      // Mock request body with empty queries array
      const requestBody = {
        queries: [] // Empty array
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.combineQueries(mockContext)

      // Should return error for empty queries array
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Queries array is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle query combination errors', async () => {
      // Mock request body
      const requestBody = {
        queries: [
          {
            id: 'query-1',
            query: '"test query"',
            originalContent: [],
            generatedAt: new Date(),
            confidence: 0.5,
            keywords: ['test'],
            topics: ['testing'],
            queryType: 'basic' as const,
            optimization: {
              breadthScore: 0.5,
              specificityScore: 0.5,
              academicRelevance: 0.5,
              suggestions: [],
              alternativeQueries: []
            }
          }
        ]
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock query combination to throw error
      const originalCombineQueries = (apiHandler as any).queryEngine.combineQueries
      vi.spyOn((apiHandler as any).queryEngine, 'combineQueries').mockImplementation(() => {
        throw new Error('Query combination failed')
      })

      await apiHandler.combineQueries(mockContext)

      // Should return error for query combination failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to combine queries',
          details: expect.stringContaining('Query combination failed'),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).queryEngine, 'combineQueries').mockRestore()
    })
  })

  describe('refineQuery', () => {
    it('should perform comprehensive query refinement analysis', async () => {
      // Mock request body
      const requestBody = {
        query: '"machine learning" AND "healthcare"',
        conversationId: 'test-conversation-123',
        originalContent: [
          {
            source: 'ideas',
            title: 'ML Research',
            content: 'Research on machine learning in healthcare',
            keywords: ['machine learning', 'healthcare'],
            keyPhrases: ['machine learning in healthcare'],
            topics: ['AI', 'medicine'],
            confidence: 0.9
          }
        ]
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.refineQuery(mockContext)

      // Should return query refinement analysis
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          refinement: expect.objectContaining({
            breadthAnalysis: expect.objectContaining({
              breadthScore: expect.any(Number),
              classification: expect.any(String),
              reasoning: expect.any(String),
              termCount: expect.any(Number),
              specificityLevel: expect.any(String),
              suggestions: expect.any(Array)
            }),
            alternativeTerms: expect.objectContaining({
              synonyms: expect.any(Array),
              relatedTerms: expect.any(Array),
              broaderTerms: expect.any(Array),
              narrowerTerms: expect.any(Array),
              academicVariants: expect.any(Array)
            }),
            validationResults: expect.objectContaining({
              isValid: expect.any(Boolean),
              issues: expect.any(Array),
              suggestions: expect.any(Array),
              confidence: expect.any(Number)
            }),
            optimizationRecommendations: expect.any(Array),
            refinedQueries: expect.any(Array)
          }),
          originalQuery: '"machine learning" AND "healthcare"',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required query parameter', async () => {
      // Mock request body without query
      const requestBody = {
        conversationId: 'test-conversation-123'
        // Missing query
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.refineQuery(mockContext)

      // Should return error for missing query
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Query and conversationId are required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required conversationId parameter', async () => {
      // Mock request body without conversationId
      const requestBody = {
        query: '"test query"'
        // Missing conversationId
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.refineQuery(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Query and conversationId are required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle query refinement errors', async () => {
      // Mock request body
      const requestBody = {
        query: '"test query"',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock query refinement to throw error
      const originalRefineQuery = (apiHandler as any).queryEngine.refineQuery
      vi.spyOn((apiHandler as any).queryEngine, 'refineQuery').mockImplementation(() => {
        throw new Error('Query refinement failed')
      })

      await apiHandler.refineQuery(mockContext)

      // Should return error for query refinement failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to refine query',
          details: expect.stringContaining('Query refinement failed'),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).queryEngine, 'refineQuery').mockRestore()
    })
  })

  describe('health', () => {
    it('should return health status information', async () => {
      await apiHandler.health(mockContext)

      // Should return health status
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          status: 'healthy',
          service: 'AI Searcher API',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          version: '1.0.0',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle health check errors', async () => {
      // Mock health check to throw error
      const originalGetHealth = (apiHandler as any).monitoringService.getHealthStatus
      vi.spyOn((apiHandler as any).monitoringService, 'getHealthStatus').mockImplementation(() => {
        throw new Error('Health check failed')
      })

      await apiHandler.health(mockContext)

      // Should return error status
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          status: 'unhealthy',
          error: 'Health check system failure',
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).monitoringService, 'getHealthStatus').mockRestore()
    })
  })

  describe('getHistory', () => {
    it('should retrieve search history with filtering', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn()
        .mockReturnValueOnce('test-conversation-123') // conversationId
        .mockReturnValueOnce('10') // limit
        .mockReturnValueOnce('0') // offset
        .mockReturnValueOnce('machine learning') // searchQuery
        .mockReturnValueOnce('true') // successOnly
        .mockReturnValueOnce('50') // minResultsCount
        .mockReturnValueOnce('ideas,builder') // contentSources
        .mockReturnValueOnce('2023-01-01') // startDate
        .mockReturnValueOnce('2023-12-31') // endDate

      // Mock database response
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({
            results: [
              {
                id: 'history-1',
                query: 'machine learning',
                timestamp: Date.now(),
                results_count: 50,
                conversationId: 'test-conversation-123'
              }
            ]
          })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      await apiHandler.getHistory(mockContext)

      // Should return search history
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          entries: expect.arrayContaining([
            expect.objectContaining({
              id: 'history-1',
              query: 'machine learning',
              results_count: 50,
              conversationId: 'test-conversation-123'
            })
          ]),
          total: expect.any(Number),
          hasMore: expect.any(Boolean),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required conversationId parameter', async () => {
      // Mock query parameters without conversationId
      mockContext.req.query = vi.fn().mockReturnValue(undefined) // No conversationId

      await apiHandler.getHistory(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn().mockReturnValue('test-conversation-123') // conversationId

      // Mock database error
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      await apiHandler.getHistory(mockContext)

      // Should return error for database failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve search history',
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('getHistoryStats', () => {
    it('should retrieve search history statistics', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn()
        .mockReturnValueOnce('test-conversation-123') // conversationId
        .mockReturnValueOnce('30') // days

      // Mock database response
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            total_searches: 25,
            unique_queries: 20,
            average_results: 8.5,
            top_queries: [
              { query: 'machine learning', count: 10 },
              { query: 'AI', count: 8 }
            ],
            searches_by_date: [
              { date: '2023-01-01', count: 5 },
              { date: '2023-01-02', count: 3 }
            ]
          })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      await apiHandler.getHistoryStats(mockContext)

      // Should return search history statistics
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          stats: expect.objectContaining({
            total_searches: 25,
            average_results: 8.5,
            top_queries: expect.arrayContaining([
              { query: 'machine learning', count: 10 },
              { query: 'AI', count: 8 }
            ]),
            searches_by_date: expect.arrayContaining([
              { date: '2023-01-01', count: 5 },
              { date: '2023-01-02', count: 3 }
            ])
          }),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required conversationId parameter', async () => {
      // Mock query parameters without conversationId
      mockContext.req.query = vi.fn().mockReturnValue(undefined) // No conversationId

      await apiHandler.getHistoryStats(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn().mockReturnValue('test-conversation-123') // conversationId

      // Mock database error
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      await apiHandler.getHistoryStats(mockContext)

      // Should return error for database failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve search history statistics',
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('getContentUsage', () => {
    it('should retrieve content source usage analytics', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn()
        .mockReturnValueOnce('test-conversation-123') // conversationId
        .mockReturnValueOnce('30') // days

      // Mock database response
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            content_usage: [
              { source: 'ideas', count: 15, last_used: '2023-01-15' },
              { source: 'builder', count: 10, last_used: '2023-01-10' }
            ]
          })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      await apiHandler.getContentUsage(mockContext)

      // Should return content usage analytics
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          usage: expect.arrayContaining([
            { source: 'ideas', count: 15, last_used: '2023-01-15' },
            { source: 'builder', count: 10, last_used: '2023-01-10' }
          ]),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required conversationId parameter', async () => {
      // Mock query parameters without conversationId
      mockContext.req.query = vi.fn().mockReturnValue(undefined) // No conversationId

      await apiHandler.getContentUsage(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn().mockReturnValue('test-conversation-123') // conversationId

      // Mock database error
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      await apiHandler.getContentUsage(mockContext)

      // Should return error for database failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve content usage analytics',
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('getSuccessTracking', () => {
    it('should retrieve search success rate tracking', async () => {
      // Mock request body
      const requestBody = {
        userId: 'test-user-123',
        conversationId: 'test-conversation-123',
        days: 30
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock database response
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            success_tracking: [
              { date: '2023-01-01', success_rate: 0.85, total_searches: 20 },
              { date: '2023-01-02', success_rate: 0.90, total_searches: 25 }
            ]
          })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      await apiHandler.getSuccessTracking(mockContext)

      // Should return success tracking data
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          tracking: expect.arrayContaining([
            { date: '2023-01-01', success_rate: 0.85, total_searches: 20 },
            { date: '2023-01-02', success_rate: 0.90, total_searches: 25 }
          ]),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required userId parameter', async () => {
      // Mock request body without userId
      const requestBody = {
        conversationId: 'test-conversation-123'
        // Missing userId
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.getSuccessTracking(mockContext)

      // Should return error for missing userId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'userId is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock request body
      const requestBody = {
        userId: 'test-user-123',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock database error
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      await apiHandler.getSuccessTracking(mockContext)

      // Should return error for database failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve success tracking data',
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('getNextBatch', () => {
    it('should retrieve next batch of search results', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn()
        .mockReturnValueOnce('session-123') // sessionId
        .mockReturnValueOnce('search-session-456') // searchSessionId

      await apiHandler.getNextBatch(mockContext)

      // Should return next batch of results
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.any(Array),
          loaded_results: expect.any(Number),
          is_complete: expect.any(Boolean),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required sessionId parameter', async () => {
      // Mock query parameters without sessionId
      mockContext.req.query = vi.fn().mockReturnValue(undefined) // No sessionId

      await apiHandler.getNextBatch(mockContext)

      // Should return error for missing sessionId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'sessionId query parameter is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle empty search results', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn().mockReturnValue('session-123') // sessionId

      await apiHandler.getNextBatch(mockContext)

      // Should return empty results when none found
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: [],
          loaded_results: 0,
          is_complete: true,
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('getPerformanceMetrics', () => {
    it('should retrieve performance metrics and cache statistics', async () => {
      await apiHandler.getPerformanceMetrics(mockContext)

      // Should return performance metrics
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          metrics: expect.any(Object),
          cache_stats: expect.any(Object),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle performance metrics errors', async () => {
      // Mock performance optimizer to throw error
      const originalGetMetrics = (apiHandler as any).performanceOptimizer.getMetrics
      vi.spyOn((apiHandler as any).performanceOptimizer, 'getMetrics').mockImplementation(() => {
        throw new Error('Performance metrics unavailable')
      })

      await apiHandler.getPerformanceMetrics(mockContext)

      // Should return error for performance metrics failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to get performance metrics',
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).performanceOptimizer, 'getMetrics').mockRestore()
    })
  })

  describe('clearCache', () => {
    it('should clear all performance caches', async () => {
      await apiHandler.clearCache(mockContext)

      // Should return success message
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'All caches cleared successfully',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle cache clearing errors', async () => {
      // Mock performance optimizer to throw error
      const originalClearCaches = (apiHandler as any).performanceOptimizer.clearAllCaches
      vi.spyOn((apiHandler as any).performanceOptimizer, 'clearAllCaches').mockImplementation(() => {
        throw new Error('Cache clearing failed')
      })

      await apiHandler.clearCache(mockContext)

      // Should return error for cache clearing failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to clear caches',
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).performanceOptimizer, 'clearAllCaches').mockRestore()
    })
  })

  describe('exportHistory', () => {
    it('should export search history in JSON format', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn()
        .mockReturnValueOnce('test-conversation-123') // conversationId
        .mockReturnValueOnce('json') // format

      // Mock database response
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({
            results: [
              {
                id: 'history-1',
                query: 'machine learning',
                timestamp: new Date().toISOString(),
                results_count: 50,
                conversationId: 'test-conversation-123'
              }
            ]
          })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      const response = new Response('') // Mock response object
      mockContext.json = undefined // Remove json method to force export path
      mockContext.body = vi.fn().mockReturnValue(response) // Add body method for export

      await apiHandler.exportHistory(mockContext)

      // Should return exported data with correct headers
      expect(response.headers.get('Content-Type')).toBe('application/json')
      expect(response.headers.get('Content-Disposition')).toContain('.json')
    })

    it('should export search history in CSV format', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn()
        .mockReturnValueOnce('test-conversation-123') // conversationId
        .mockReturnValueOnce('csv') // format

      // Mock database response
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue({
            results: [
              {
                id: 'history-1',
                query: 'machine learning',
                timestamp: new Date().toISOString(),
                results_count: 50,
                conversationId: 'test-conversation-123'
              }
            ]
          })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      const response = new Response('') // Mock response object
      mockContext.json = undefined // Remove json method to force export path
      mockContext.body = vi.fn().mockReturnValue(response) // Add body method for export

      await apiHandler.exportHistory(mockContext)

      // Should return exported data with correct headers
      expect(response.headers.get('Content-Type')).toBe('text/csv')
      expect(response.headers.get('Content-Disposition')).toContain('.csv')
    })

    it('should validate required conversationId parameter', async () => {
      // Mock query parameters without conversationId
      mockContext.req.query = vi.fn().mockReturnValue(undefined) // No conversationId

      await apiHandler.exportHistory(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate format parameter', async () => {
      // Mock query parameters with invalid format
      mockContext.req.query = vi.fn()
        .mockReturnValueOnce('test-conversation-123') // conversationId
        .mockReturnValueOnce('invalid') // Invalid format

      await apiHandler.exportHistory(mockContext)

      // Should return error for invalid format
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Format must be either "json" or "csv"',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn()
        .mockReturnValueOnce('test-conversation-123') // conversationId
        .mockReturnValueOnce('json') // format

      // Mock database error
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          all: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      await apiHandler.exportHistory(mockContext)

      // Should return error for database failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to export search history',
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('getQueryPerformance', () => {
    it('should retrieve query performance analytics', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn()
        .mockReturnValueOnce('test-conversation-123') // conversationId
        .mockReturnValueOnce('30') // days

      // Mock database response
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            performance_data: [
              {
                query: '"machine learning"',
                execution_count: 15,
                average_execution_time: 1200,
                success_rate: 0.87
              }
            ]
          })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      await apiHandler.getQueryPerformance(mockContext)

      // Should return query performance analytics
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          analytics: expect.objectContaining({
            performance_data: expect.arrayContaining([
              expect.objectContaining({
                query: '"machine learning"',
                execution_count: 15,
                average_execution_time: 1200,
                success_rate: 0.87
              })
            ])
          }),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required conversationId parameter', async () => {
      // Mock query parameters without conversationId
      mockContext.req.query = vi.fn().mockReturnValue(undefined) // No conversationId

      await apiHandler.getQueryPerformance(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn().mockReturnValue('test-conversation-123') // conversationId

      // Mock database error
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      await apiHandler.getQueryPerformance(mockContext)

      // Should return error for database failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve query performance analytics',
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('getSuccessRateTracking', () => {
    it('should retrieve search success rate tracking over time', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn()
        .mockReturnValueOnce('test-conversation-123') // conversationId
        .mockReturnValueOnce('30') // days

      // Mock database response
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            tracking_data: [
              { date: '2023-01-01', success_rate: 0.85, searches: 20 },
              { date: '2023-01-02', success_rate: 0.90, searches: 25 }
            ]
          })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      await apiHandler.getSuccessRateTracking(mockContext)

      // Should return success rate tracking
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          tracking: expect.arrayContaining([
            { date: '2023-01-01', success_rate: 0.85, searches: 20 },
            { date: '2023-01-02', success_rate: 0.90, searches: 25 }
          ]),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required conversationId parameter', async () => {
      // Mock query parameters without conversationId
      mockContext.req.query = vi.fn().mockReturnValue(undefined) // No conversationId

      await apiHandler.getSuccessRateTracking(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn().mockReturnValue('test-conversation-123') // conversationId

      // Mock database error
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      await apiHandler.getSuccessRateTracking(mockContext)

      // Should return error for database failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve success rate tracking',
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('getContentSourceEffectiveness', () => {
    it('should retrieve content source effectiveness metrics', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn()
        .mockReturnValueOnce('test-conversation-123') // conversationId
        .mockReturnValueOnce('30') // days

      // Mock database response
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            effectiveness_data: [
              { source: 'ideas', usage_count: 25, success_rate: 0.88 },
              { source: 'builder', usage_count: 15, success_rate: 0.82 }
            ]
          })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      await apiHandler.getContentSourceEffectiveness(mockContext)

      // Should return content source effectiveness
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          effectiveness: expect.arrayContaining([
            { source: 'ideas', usage_count: 25, success_rate: 0.88 },
            { source: 'builder', usage_count: 15, success_rate: 0.82 }
          ]),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required conversationId parameter', async () => {
      // Mock query parameters without conversationId
      mockContext.req.query = vi.fn().mockReturnValue(undefined) // No conversationId

      await apiHandler.getContentSourceEffectiveness(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn().mockReturnValue('test-conversation-123') // conversationId

      // Mock database error
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      await apiHandler.getContentSourceEffectiveness(mockContext)

      // Should return error for database failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve content source effectiveness',
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('getSearchSessionDetails', () => {
    it('should retrieve detailed search session information', async () => {
      // Mock path parameter
      mockContext.req.param = vi.fn().mockReturnValue('session-123') // sessionId

      // Mock database response
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            id: 'session-123',
            conversation_id: 'test-conversation-123',
            user_id: 'test-user-123',
            search_query: 'machine learning',
            content_sources: JSON.stringify(['ideas', 'builder']),
            search_filters: JSON.stringify({ dateRange: { start: 2020, end: 2023 } }),
            results_count: 25,
            results_accepted: 20,
            results_rejected: 5,
            search_success: true,
            processing_time_ms: 1200,
            error_message: null,
            created_at: new Date().toISOString()
          })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      await apiHandler.getSearchSessionDetails(mockContext)

      // Should return search session details
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          session: expect.objectContaining({
            id: 'session-123',
            conversation_id: 'test-conversation-123',
            user_id: 'test-user-123',
            search_query: 'machine learning',
            content_sources: expect.arrayContaining(['ideas', 'builder']),
            search_filters: expect.objectContaining({ dateRange: { start: 2020, end: 2023 } }),
            results_count: 25,
            results_accepted: 20,
            results_rejected: 5,
            search_success: true,
            processing_time_ms: 1200
          }),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required sessionId parameter', async () => {
      // Mock path parameter without sessionId
      mockContext.req.param = vi.fn().mockReturnValue(undefined) // No sessionId

      await apiHandler.getSearchSessionDetails(mockContext)

      // Should return error for missing sessionId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'sessionId parameter is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle session not found', async () => {
      // Mock path parameter
      mockContext.req.param = vi.fn().mockReturnValue('nonexistent-session') // sessionId

      // Mock database response for missing session
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null) // No session found
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      await apiHandler.getSearchSessionDetails(mockContext)

      // Should return error for session not found
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Search session not found',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock path parameter
      mockContext.req.param = vi.fn().mockReturnValue('session-123') // sessionId

      // Mock database error
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      await apiHandler.getSearchSessionDetails(mockContext)

      // Should return error for database failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve search session details',
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('clearHistory', () => {
    it('should clear search history or delete specific entries', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn().mockReturnValue('test-conversation-123') // conversationId

      // Mock database response
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ success: true })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      await apiHandler.clearHistory(mockContext)

      // Should return success message
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Search history cleared successfully',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required conversationId parameter', async () => {
      // Mock query parameters without conversationId
      mockContext.req.query = vi.fn().mockReturnValue(undefined) // No conversationId

      await apiHandler.clearHistory(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn().mockReturnValue('test-conversation-123') // conversationId

      // Mock database error
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      await apiHandler.clearHistory(mockContext)

      // Should return error for database failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to clear search history',
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('getAnalytics', () => {
    it('should retrieve comprehensive search analytics', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn()
        .mockReturnValueOnce('test-conversation-123') // conversationId
        .mockReturnValueOnce('30') // days

      // Mock database response
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({
            searchAnalytics: {
              total_searches: 150,
              average_results: 12.5,
              popular_sources: ['ideas', 'builder'],
              search_frequency: { 'machine learning': 25, 'AI': 20 },
              period: { start: '2023-01-01', end: '2023-01-31' }
            },
            conversionMetrics: {
              totalSearches: 150,
              totalResults: 1875,
              resultsViewed: 1500,
              resultsAdded: 850,
              resultsRejected: 1025,
              conversionRate: 0.45,
              viewRate: 0.8,
              rejectionRate: 0.55
            },
            satisfactionMetrics: {
              averageOverallSatisfaction: 4.2,
              averageRelevanceRating: 4.0,
              averageQualityRating: 4.1,
              averageEaseOfUseRating: 4.3,
              recommendationRate: 0.85,
              totalFeedbackCount: 75
            },
            usageMetrics: {
              total_users: 1250,
              total_searches: 15470,
              total_references_added: 8932,
              average_search_time: 2.3,
              most_used_features: [
                { feature: 'search', count: 15470 },
                { feature: 'extract', count: 3420 }
              ]
            },
            trends: {
              searchTrend: [
                { date: '2023-01-01', searches: 25, success_rate: 0.85 },
                { date: '2023-01-02', searches: 30, success_rate: 0.90 }
              ],
              conversionTrend: [
                { date: '2023-01-01', conversion_rate: 0.42 },
                { date: '2023-01-02', conversion_rate: 0.48 }
              ]
            },
            period: {
              days: 30,
              start: '2023-01-01T00:00:00.000Z',
              end: new Date().toISOString()
            }
          })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      await apiHandler.getAnalytics(mockContext)

      // Should return comprehensive analytics
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          analytics: expect.objectContaining({
            searchAnalytics: expect.objectContaining({
              total_searches: 150,
              average_results: 12.5,
              popular_sources: expect.arrayContaining(['ideas', 'builder'])
            }),
            conversionMetrics: expect.objectContaining({
              totalSearches: 150,
              conversionRate: 0.45
            }),
            satisfactionMetrics: expect.objectContaining({
              averageOverallSatisfaction: 4.2,
              recommendationRate: 0.85
            }),
            usageMetrics: expect.objectContaining({
              total_users: 1250,
              total_searches: 15470
            }),
            trends: expect.objectContaining({
              searchTrend: expect.arrayContaining([
                { date: '2023-01-01', searches: 25, success_rate: 0.85 }
              ]),
              conversionTrend: expect.arrayContaining([
                { date: '2023-01-01', conversion_rate: 0.42 }
              ])
            })
          }),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required conversationId parameter', async () => {
      // Mock query parameters without conversationId
      mockContext.req.query = vi.fn().mockReturnValue(undefined) // No conversationId

      await apiHandler.getAnalytics(mockContext)

      // Should return error for missing conversationId
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'conversationId query parameter is required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock query parameters
      mockContext.req.query = vi.fn().mockReturnValue('test-conversation-123') // conversationId

      // Mock database error
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      await apiHandler.getAnalytics(mockContext)

      // Should return error for database failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve analytics',
          details: expect.any(String),
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('getTrending', () => {
    it('should retrieve trending topics', async () => {
      await apiHandler.getTrending(mockContext)

      // Should return trending topics
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          trending: expect.arrayContaining([
            expect.objectContaining({
              topic: expect.any(String),
              count: expect.any(Number),
              trend: expect.any(String),
              percentage_change: expect.any(Number)
            })
          ]),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle trending topics errors', async () => {
      // Mock trending topics retrieval to throw error
      const originalGetTrending = (apiHandler as any).getTrendingTopics
      vi.spyOn(apiHandler as any, 'getTrendingTopics').mockImplementation(() => {
        throw new Error('Trending topics unavailable')
      })

      await apiHandler.getTrending(mockContext)

      // Should return error for trending topics failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve trending topics',
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn(apiHandler as any, 'getTrendingTopics').mockRestore()
    })
  })

  describe('getStatistics', () => {
    it('should retrieve usage statistics', async () => {
      await apiHandler.getStatistics(mockContext)

      // Should return usage statistics
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          statistics: expect.objectContaining({
            total_users: expect.any(Number),
            total_searches: expect.any(Number),
            total_references_added: expect.any(Number),
            average_search_time: expect.any(Number),
            most_used_features: expect.any(Array)
          }),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle statistics errors', async () => {
      // Mock statistics retrieval to throw error
      const originalGetStatistics = (apiHandler as any).getUsageStatistics
      vi.spyOn(apiHandler as any, 'getUsageStatistics').mockImplementation(() => {
        throw new Error('Statistics unavailable')
      })

      await apiHandler.getStatistics(mockContext)

      // Should return error for statistics failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to retrieve statistics',
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn(apiHandler as any, 'getUsageStatistics').mockRestore()
    })
  })

  describe('trackResultAction', () => {
    it('should track user actions on search results', async () => {
      // Mock request body
      const requestBody = {
        resultId: 'result-123',
        sessionId: 'session-456',
        resultTitle: 'Test Paper',
        action: 'added' as const,
        referenceId: 'ref-789',
        feedback: {
          rating: 5,
          comments: 'Excellent paper'
        }
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock database response
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ success: true })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      await apiHandler.trackResultAction(mockContext)

      // Should return success message
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Result action \'added\' tracked successfully',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required parameters', async () => {
      // Mock request body without required parameters
      const requestBody = {
        // Missing resultId, sessionId, action, resultTitle
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.trackResultAction(mockContext)

      // Should return error for missing required parameters
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'sessionId, action, and resultTitle are required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock request body
      const requestBody = {
        resultId: 'result-123',
        sessionId: 'session-456',
        resultTitle: 'Test Paper',
        action: 'added' as const
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock database error
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      await apiHandler.trackResultAction(mockContext)

      // Should return error for database failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to track result action',
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('recordFeedback', () => {
    it('should record user feedback for search quality', async () => {
      // Mock request body
      const requestBody = {
        sessionId: 'session-123',
        conversationId: 'test-conversation-123',
        overallSatisfaction: 5,
        relevanceRating: 5,
        qualityRating: 5,
        easeOfUseRating: 5,
        feedbackComments: 'Excellent search results!',
        wouldRecommend: true,
        improvementSuggestions: 'Keep up the good work!'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock database response
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({ success: true, feedbackId: 'feedback-456' })
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      await apiHandler.recordFeedback(mockContext)

      // Should return success message with feedback ID
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          feedbackId: 'feedback-456',
          message: 'Feedback recorded successfully',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate required parameters', async () => {
      // Mock request body without required parameters
      const requestBody = {
        // Missing sessionId, conversationId
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.recordFeedback(mockContext)

      // Should return error for missing required parameters
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'sessionId and conversationId are required',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should validate rating parameters', async () => {
      // Mock request body with invalid ratings
      const requestBody = {
        sessionId: 'session-123',
        conversationId: 'test-conversation-123',
        overallSatisfaction: 6, // Invalid rating (> 5)
        relevanceRating: 5,
        qualityRating: 5,
        easeOfUseRating: 5
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.recordFeedback(mockContext)

      // Should return error for invalid ratings
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'All ratings must be between 1 and 5',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock request body
      const requestBody = {
        sessionId: 'session-123',
        conversationId: 'test-conversation-123',
        overallSatisfaction: 5,
        relevanceRating: 5,
        qualityRating: 5,
        easeOfUseRating: 5
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock database error
      const mockErrorChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockErrorChain)

      await apiHandler.recordFeedback(mockContext)

      // Should return error for database failure
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to record feedback',
          processingTime: expect.any(Number)
        })
      )
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle high-volume concurrent requests', async () => {
      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Simulate multiple concurrent requests
      const promises = Array.from({ length: 10 }, () => 
        apiHandler.search({ ...mockContext })
      )

      const startTime = Date.now()
      await Promise.all(promises)
      const endTime = Date.now()

      // Should handle all requests within reasonable time
      expect(endTime - startTime).toBeLessThan(5000) // 5 seconds for 10 concurrent requests

      // Should have called search for each request
      expect(global.fetch).toHaveBeenCalledTimes(10)
    })

    it('should maintain consistent performance with repeated operations', async () => {
      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Perform many operations
      const times: number[] = []
      for (let i = 0; i < 20; i++) {
        const startTime = Date.now()
        await apiHandler.search(mockContext)
        const endTime = Date.now()
        times.push(endTime - startTime)
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length
      expect(averageTime).toBeLessThan(1000) // Should average less than 1 second per request
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should recover from temporary network failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock intermittent network failures
      let callCount = 0
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => `
            <div class="gs_r gs_or gs_scl">
              <div class="gs_ri">
                <h3 class="gs_rt">
                  <a href="https://example.com/paper">Recovered Paper</a>
                </h3>
                <div class="gs_a">Recovered, Author - Recovered Journal, 2023</div>
                <span class="gs_rs">Recovered abstract...</span>
                <div class="gs_fl">Cited by 75</div>
              </div>
            </div>
          `
        })
      })

      await apiHandler.search(mockContext)

      // Should eventually succeed after retries
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.arrayContaining([
            expect.objectContaining({
              title: 'Recovered Paper',
              authors: ['Recovered, Author'],
              journal: 'Recovered Journal',
              year: 2023,
              citations: 75
            })
          ])
        })
      )
    })

    it('should handle rate limiting with appropriate backoff', async () => {
      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock rate limit response with retry-after
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['Retry-After', '5']]) // 5 second retry after
      })

      const startTime = Date.now()
      await apiHandler.search(mockContext)
      const endTime = Date.now()

      // Should return error response quickly without long delays
      expect(endTime - startTime).toBeLessThan(1000) // Should not wait the full retry time

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to perform AI search',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle service degradation gracefully', async () => {
      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock service unavailable response
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      })

      await apiHandler.search(mockContext)

      // Should return degraded mode results
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to perform AI search',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should provide meaningful error messages for debugging', async () => {
      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock specific error
      global.fetch = vi.fn().mockRejectedValue(new Error('DNS resolution failed'))

      await apiHandler.search(mockContext)

      // Should provide detailed error information
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to perform AI search',
          details: expect.stringContaining('DNS resolution failed'),
          processingTime: expect.any(Number)
        })
      )
    })

    it('should maintain data consistency during partial failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock partial database failure
      const mockChain = {
        bind: vi.fn().mockReturnValue({
          run: vi.fn()
            .mockResolvedValueOnce({ success: true }) // First operation succeeds
            .mockRejectedValueOnce(new Error('Database connection lost')) // Second operation fails
        })
      }
      mockEnv.DB.prepare.mockReturnValue(mockChain)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Consistent Paper</a>
              </h3>
              <div class="gs_a">Consistent, Author - Journal, 2023</div>
              <span class="gs_rs">Abstract...</span>
              <div class="gs_fl">Cited by 100</div>
            </div>
          </div>
        `
      })

      await apiHandler.search(mockContext)

      // Should handle partial failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.arrayContaining([
            expect.objectContaining({
              title: 'Consistent Paper',
              citations: 100
            })
          ])
        })
      )

      // Should still attempt database operations
      expect(mockEnv.DB.prepare).toHaveBeenCalled()
    })

    it('should handle malformed responses gracefully', async () => {
      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock malformed search response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'malformed html response' // Doesn't match expected format
      })

      await apiHandler.search(mockContext)

      // Should handle malformed responses gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.any(Array) // Should still return results array (possibly empty)
        })
      )
    })

    it('should handle search with no results gracefully', async () => {
      // Mock request body
      const requestBody = {
        query: 'very specific query with no results',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search response with no results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div id="gs_ccl_no_results">
            <div>Your search did not match any articles.</div>
          </div>
        `
      })

      await apiHandler.search(mockContext)

      // Should return empty results gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: [],
          total_results: 0,
          loaded_results: 0,
          has_more: false
        })
      )
    })

    it('should handle search with timeout errors', async () => {
      // Mock request body
      const requestBody = {
        query: 'timeout query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock timeout error
      global.fetch = vi.fn().mockRejectedValue(
        Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
      )

      await apiHandler.search(mockContext)

      // Should handle timeout errors gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to perform AI search',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle search with authentication errors', async () => {
      // Mock request body
      const requestBody = {
        query: 'auth required query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock authentication error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      })

      await apiHandler.search(mockContext)

      // Should handle authentication errors gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to perform AI search',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle search with quota exceeded errors', async () => {
      // Mock request body
      const requestBody = {
        query: 'quota exceeded query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock quota exceeded error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['X-RateLimit-Reset', '3600']]) // Reset in 1 hour
      })

      await apiHandler.search(mockContext)

      // Should handle quota exceeded errors gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to perform AI search',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle search with service unavailable errors', async () => {
      // Mock request body
      const requestBody = {
        query: 'service unavailable query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock service unavailable error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      })

      await apiHandler.search(mockContext)

      // Should handle service unavailable errors gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to perform AI search',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle search with network connectivity errors', async () => {
      // Mock request body
      const requestBody = {
        query: 'network error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock network connectivity error
      global.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'))

      await apiHandler.search(mockContext)

      // Should handle network connectivity errors gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to perform AI search',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle search with parsing errors', async () => {
      // Mock request body
      const requestBody = {
        query: 'parsing error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock parsing error
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => {
          throw new Error('HTML parsing error')
        }
      })

      await apiHandler.search(mockContext)

      // Should handle parsing errors gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to perform AI search',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle search with validation errors', async () => {
      // Mock request body with invalid data
      const requestBody = {
        query: '', // Empty query
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      await apiHandler.search(mockContext)

      // Should handle validation errors gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Query is required (either directly or via content sources)',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle search with unknown errors', async () => {
      // Mock request body
      const requestBody = {
        query: 'unknown error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock unknown error
      global.fetch = vi.fn().mockRejectedValue(new Error('Unknown error'))

      await apiHandler.search(mockContext)

      // Should handle unknown errors gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to perform AI search',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle search with content extraction failures', async () => {
      // Mock request body with content sources that fail
      const requestBody = {
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: 'nonexistent' }
        ]
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock content extraction failure
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      })

      await apiHandler.search(mockContext)

      // Should handle content extraction failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Query is required (either directly or via content sources)',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle search with query generation failures', async () => {
      // Mock request body with content that causes query generation failure
      const requestBody = {
        conversationId: 'test-conversation-123',
        contentSources: [
          { source: 'ideas', id: '1' }
        ]
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock content extraction success but query generation failure
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          idea: {
            id: 1,
            title: 'Test Idea',
            description: 'Test content',
            content: 'Test content',
            type: 'concept',
            tags: ['test'],
            confidence: 0.5,
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            conversationid: 'test-conversation-123'
          }
        })
      })

      // Mock query generation to throw error
      const originalGenerateQueries = (apiHandler as any).queryEngine.generateQueries
      vi.spyOn((apiHandler as any).queryEngine, 'generateQueries').mockImplementation(() => {
        throw new Error('Query generation failed')
      })

      await apiHandler.search(mockContext)

      // Should handle query generation failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Query is required (either directly or via content sources)',
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).queryEngine, 'generateQueries').mockRestore()
    })

    it('should handle search with result scoring failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'result scoring error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Mock result scoring to throw error
      const originalScoreResults = (apiHandler as any).scoringEngine.rankResults
      vi.spyOn((apiHandler as any).scoringEngine, 'rankResults').mockImplementation(() => {
        throw new Error('Result scoring failed')
      })

      await apiHandler.search(mockContext)

      // Should handle result scoring failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Should still return success but with original results
          results: expect.any(Array),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).scoringEngine, 'rankResults').mockRestore()
    })

    it('should handle search with duplicate detection failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'duplicate detection error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Mock duplicate detection to throw error
      const originalDetectDuplicates = (apiHandler as any).duplicateDetectionEngine.detectDuplicates
      vi.spyOn((apiHandler as any).duplicateDetectionEngine, 'detectDuplicates').mockImplementation(() => {
        throw new Error('Duplicate detection failed')
      })

      await apiHandler.search(mockContext)

      // Should handle duplicate detection failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Should still return success but with original results
          results: expect.any(Array),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).duplicateDetectionEngine, 'detectDuplicates').mockRestore()
    })

    it('should handle search with feedback learning failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'feedback learning error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Mock feedback learning to throw error
      const originalApplyFeedback = (apiHandler as any).feedbackLearningSystem.applyFeedbackBasedRanking
      vi.spyOn((apiHandler as any).feedbackLearningSystem, 'applyFeedbackBasedRanking').mockImplementation(() => {
        throw new Error('Feedback learning failed')
      })

      await apiHandler.search(mockContext)

      // Should handle feedback learning failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Should still return success but with original results
          results: expect.any(Array),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).feedbackLearningSystem, 'applyFeedbackBasedRanking').mockRestore()
    })

    it('should handle search with analytics recording failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'analytics error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Mock analytics recording to throw error
      const originalRecordSearchSession = (apiHandler as any).analyticsManager.recordSearchSession
      vi.spyOn((apiHandler as any).analyticsManager, 'recordSearchSession').mockImplementation(() => {
        throw new Error('Analytics recording failed')
      })

      await apiHandler.search(mockContext)

      // Should handle analytics recording failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Should still return success but with search results
          results: expect.any(Array),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).analyticsManager, 'recordSearchSession').mockRestore()
    })

    it('should handle search with caching failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'caching error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Mock caching to throw error
      const originalCacheSearchResults = (apiHandler as any).performanceOptimizer.cacheSearchResults
      vi.spyOn((apiHandler as any).performanceOptimizer, 'cacheSearchResults').mockImplementation(() => {
        throw new Error('Caching failed')
      })

      await apiHandler.search(mockContext)

      // Should handle caching failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Should still return success but with search results
          results: expect.any(Array),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).performanceOptimizer, 'cacheSearchResults').mockRestore()
    })

    it('should handle search with progressive loading failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'progressive loading error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Mock progressive loading to throw error
      const originalInitializeProgressiveLoading = (apiHandler as any).performanceOptimizer.initializeProgressiveLoading
      vi.spyOn((apiHandler as any).performanceOptimizer, 'initializeProgressiveLoading').mockImplementation(() => {
        throw new Error('Progressive loading failed')
      })

      await apiHandler.search(mockContext)

      // Should handle progressive loading failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Should still return success but with search results
          results: expect.any(Array),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).performanceOptimizer, 'initializeProgressiveLoading').mockRestore()
    })

    it('should handle search with background processing failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'background processing error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Mock background processing to throw error
      const originalAddBackgroundTask = (apiHandler as any).performanceOptimizer.addBackgroundTask
      vi.spyOn((apiHandler as any).performanceOptimizer, 'addBackgroundTask').mockImplementation(() => {
        throw new Error('Background processing failed')
      })

      await apiHandler.search(mockContext)

      // Should handle background processing failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Should still return success but with search results
          results: expect.any(Array),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).performanceOptimizer, 'addBackgroundTask').mockRestore()
    })

    it('should handle search with monitoring service failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'monitoring error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Mock monitoring service to throw error
      const originalLogInfo = (apiHandler as any).monitoringService.logInfo
      vi.spyOn((apiHandler as any).monitoringService, 'logInfo').mockImplementation(() => {
        throw new Error('Monitoring service failed')
      })

      await apiHandler.search(mockContext)

      // Should handle monitoring service failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Should still return success but with search results
          results: expect.any(Array),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).monitoringService, 'logInfo').mockRestore()
    })

    it('should handle search with error handling service failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'error handling error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Mock error handling service to throw error
      const originalHandleError = (apiHandler as any).errorHandler.handleError
      vi.spyOn((apiHandler as any).errorHandler, 'handleError').mockImplementation(() => {
        throw new Error('Error handling service failed')
      })

      await apiHandler.search(mockContext)

      // Should handle error handling service failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false, // Should return error when error handling fails
          error: 'Failed to perform AI search',
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).errorHandler, 'handleError').mockRestore()
    })

    it('should handle search with fallback service failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'fallback error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Mock fallback service to throw error
      const originalAttemptFallbackSearch = (apiHandler as any).attemptFallbackSearch
      vi.spyOn(apiHandler as any, 'attemptFallbackSearch').mockImplementation(() => {
        throw new Error('Fallback service failed')
      })

      await apiHandler.search(mockContext)

      // Should handle fallback service failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Should still return success but with search results
          results: expect.any(Array),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn(apiHandler as any, 'attemptFallbackSearch').mockRestore()
    })

    it('should handle search with degraded mode failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'degraded mode error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Mock degraded mode to throw error
      const originalExecuteDegradedMode = (apiHandler as any).executeDegradedMode
      vi.spyOn(apiHandler as any, 'executeDegradedMode').mockImplementation(() => {
        throw new Error('Degraded mode failed')
      })

      await apiHandler.search(mockContext)

      // Should handle degraded mode failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Should still return success but with search results
          results: expect.any(Array),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn(apiHandler as any, 'executeDegradedMode').mockRestore()
    })

    it('should handle search with retry failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'retry error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search to fail all retries
      global.fetch = vi.fn().mockImplementation(() => {
        throw new Error('All retries failed')
      })

      await apiHandler.search(mockContext)

      // Should handle retry failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to perform AI search',
          processingTime: expect.any(Number)
        })
      )
    })

    it('should handle search with circuit breaker failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'circuit breaker error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Mock circuit breaker to be open
      const originalIsCircuitBreakerOpen = (apiHandler as any).scholarClient.isCircuitBreakerOpen
      vi.spyOn((apiHandler as any).scholarClient, 'isCircuitBreakerOpen').mockReturnValue(true)

      await apiHandler.search(mockContext)

      // Should handle circuit breaker failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Should still return success but with search results
          results: expect.any(Array),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).scholarClient, 'isCircuitBreakerOpen').mockRestore()
    })

    it('should handle search with rate limiting failures', async () => {
      // Mock request body
      const requestBody = {
        query: 'rate limiting error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search results
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => `
          <div class="gs_r gs_or gs_scl">
            <div class="gs_ri">
              <h3 class="gs_rt">
                <a href="https://example.com/paper">Test Paper</a>
              </h3>
              <div class="gs_a">Test, Author - Test Journal, 2023</div>
              <span class="gs_rs">Test abstract...</span>
              <div class="gs_fl">Cited by 50</div>
            </div>
          </div>
        `
      })

      // Mock rate limiting to be exceeded
      const originalHandleRateLimit = (apiHandler as any).scholarClient.handleRateLimit
      vi.spyOn((apiHandler as any).scholarClient, 'handleRateLimit').mockImplementation(() => {
        throw new Error('Rate limit exceeded')
      })

      await apiHandler.search(mockContext)

      // Should handle rate limiting failures gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Should still return success but with search results
          results: expect.any(Array),
          processingTime: expect.any(Number)
        })
      )

      // Restore original method
      vi.spyOn((apiHandler as any).scholarClient, 'handleRateLimit').mockRestore()
    })

    it('should handle search with timeout failures during retry', async () => {
      // Mock request body
      const requestBody = {
        query: 'retry timeout error query',
        conversationId: 'test-conversation-123'
      }

      mockContext.req.json.mockResolvedValue(requestBody)

      // Mock search to timeout during retry
      let callCount = 0
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          // First two calls timeout
          const error = new Error('The operation was aborted')
          error.name = 'AbortError'
          throw error
        }
        // Third call succeeds
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => `
            <div class="gs_r gs_or gs_scl">
              <div class="gs_ri">
                <h3 class="gs_rt">
                  <a href="https://example.com/paper">Retry Success Paper</a>
                </h3>
                <div class="gs_a">Retry, Author - Journal, 2023</div>
                <span class="gs_rs">Retry abstract...</span>
                <div class="gs_fl">Cited by 100</div>
              </div>
            </div>
          `
        })
      })

      await apiHandler.search(mockContext)

      // Should handle timeout failures during retry gracefully
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.arrayContaining([
            expect.objectContaining({
              title: 'Retry Success Paper',
              citations: 100
            })
          ]),
          processingTime: expect.any(Number)
        })
      )
    })
  })
})