import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AISearcherAPIHandler } from '../worker/handlers/ai-searcher-api';
import { GoogleScholarClient } from '../worker/lib/google-scholar-client';
import { ScholarSearchResult } from '../lib/ai-types';

// Mock the Google Scholar client
vi.mock('../worker/lib/google-scholar-client', () => ({
  GoogleScholarClient: vi.fn()
}));

describe('AI Searcher Real Search Integration', () => {
  let handler: AISearcherAPIHandler;
  let mockScholarClient: any;
  let mockContext: any;
  let mockSearchMethod: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create mock search method
    mockSearchMethod = vi.fn();
    
    // Mock the GoogleScholarClient constructor and its methods
    mockScholarClient = {
      search: mockSearchMethod
    };
    
    // Mock the constructor to return our mock instance
    vi.mocked(GoogleScholarClient).mockImplementation(() => mockScholarClient);
    
    // Create mock context
    mockContext = {
      req: {
        json: vi.fn()
      },
      json: vi.fn(),
      env: {
        SUPABASE_URL: 'test-url',
        SUPABASE_ANON: 'test-key'
      }
    };

    // Create handler instance (this will use the mocked GoogleScholarClient)
    handler = new AISearcherAPIHandler();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Real Google Scholar Search', () => {
    it('should perform real search and return formatted results', async () => {
      // Mock successful search results
      const mockScholarResults: ScholarSearchResult[] = [
        {
          title: 'Machine Learning in Academic Research',
          authors: ['Smith, J.', 'Doe, A.'],
          journal: 'Journal of AI Research',
          year: 2023,
          publication_date: '2023',
          doi: '10.1234/jair.2023.001',
          url: 'https://example.com/paper1',
          abstract: 'This paper explores machine learning applications in academic research.',
          keywords: ['machine learning', 'research', 'AI'],
          confidence: 0.9,
          relevance_score: 0.85,
          citation_count: 42
        },
        {
          title: 'Deep Learning for Natural Language Processing',
          authors: ['Johnson, B.', 'Wilson, C.'],
          journal: 'Computational Linguistics',
          year: 2022,
          publication_date: '2022',
          doi: '10.5678/cl.2022.002',
          url: 'https://example.com/paper2',
          abstract: 'A comprehensive study on deep learning techniques for NLP.',
          keywords: ['deep learning', 'NLP', 'neural networks'],
          confidence: 0.88,
          relevance_score: 0.82,
          citation_count: 67
        }
      ];

      // Mock the search method
      mockSearchMethod.mockResolvedValue(mockScholarResults);

      // Mock request body
      const requestBody = {
        query: 'machine learning research',
        conversationId: 'test-conversation-123',
        filters: {
          maxResults: 10,
          sortBy: 'relevance' as const
        }
      };

      mockContext.req.json.mockResolvedValue(requestBody);
      mockContext.json.mockImplementation((data: any) => ({ data }));

      // Execute the search
      const result = await handler.search(mockContext);

      // Verify the search was called with correct parameters
      expect(mockSearchMethod).toHaveBeenCalledWith(
        'machine learning research',
        expect.objectContaining({
          maxResults: 10,
          sortBy: 'relevance',
          includePatents: false,
          includeCitations: true
        })
      );

      // Verify the response format
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.arrayContaining([
            expect.objectContaining({
              title: 'Machine Learning in Academic Research',
              authors: ['Smith, J.', 'Doe, A.'],
              journal: 'Journal of AI Research',
              publication_date: '2023',
              doi: '10.1234/jair.2023.001',
              confidence: 0.9,
              relevance_score: 0.85
            }),
            expect.objectContaining({
              title: 'Deep Learning for Natural Language Processing',
              authors: ['Johnson, B.', 'Wilson, C.'],
              journal: 'Computational Linguistics',
              publication_date: '2022',
              doi: '10.5678/cl.2022.002',
              confidence: 0.88,
              relevance_score: 0.82
            })
          ]),
          total_results: 2,
          query: 'machine learning research'
        })
      );
    });

    it('should handle search errors gracefully', async () => {
      // Mock search failure
      const searchError = new Error('Rate limit exceeded');
      mockSearchMethod.mockRejectedValue(searchError);

      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      };

      mockContext.req.json.mockResolvedValue(requestBody);
      mockContext.json.mockImplementation((data: any) => ({ data }));

      // Execute the search
      const result = await handler.search(mockContext);

      // Verify that the search was attempted
      expect(mockSearchMethod).toHaveBeenCalledWith(
        'test query',
        expect.any(Object)
      );

      // Verify that a graceful response was returned
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.any(Array),
          query: 'test query'
        })
      );
    });

    it('should apply date range filters to search options', async () => {
      // Mock successful search
      mockSearchMethod.mockResolvedValue([]);

      // Mock request body with date filters
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123',
        filters: {
          dateRange: {
            start: 2020,
            end: 2023
          },
          sortBy: 'date' as const
        }
      };

      mockContext.req.json.mockResolvedValue(requestBody);
      mockContext.json.mockImplementation((data: any) => ({ data }));

      // Execute the search
      await handler.search(mockContext);

      // Verify the search was called with date filters
      expect(mockSearchMethod).toHaveBeenCalledWith(
        'test query',
        expect.objectContaining({
          yearStart: 2020,
          yearEnd: 2023,
          sortBy: 'date'
        })
      );
    });

    it('should handle empty search results', async () => {
      // Mock empty search results
      mockSearchMethod.mockResolvedValue([]);

      // Mock request body
      const requestBody = {
        query: 'very specific query with no results',
        conversationId: 'test-conversation-123'
      };

      mockContext.req.json.mockResolvedValue(requestBody);
      mockContext.json.mockImplementation((data: any) => ({ data }));

      // Execute the search
      await handler.search(mockContext);

      // Verify the response handles empty results
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: [],
          total_results: 0,
          query: 'very specific query with no results'
        })
      );
    });

    it('should use real citation counts when available', async () => {
      // Mock search results with citation counts
      const mockScholarResults: ScholarSearchResult[] = [
        {
          title: 'Highly Cited Paper',
          authors: ['Expert, A.'],
          journal: 'Nature',
          year: 2020,
          publication_date: '2020',
          confidence: 0.95,
          relevance_score: 0.9,
          citation_count: 150 // Real citation count
        }
      ];

      mockSearchMethod.mockResolvedValue(mockScholarResults);

      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      };

      mockContext.req.json.mockResolvedValue(requestBody);
      mockContext.json.mockImplementation((data: any) => ({ data }));

      // Execute the search
      await handler.search(mockContext);

      // Verify that real citation count is preserved
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.arrayContaining([
            expect.objectContaining({
              title: 'Highly Cited Paper',
              citation_count: 150
            })
          ])
        })
      );
    });
  });

  describe('Real Metadata Extraction', () => {
    it('should extract metadata from DOI using real search', async () => {
      // Mock successful DOI search
      const mockScholarResults: ScholarSearchResult[] = [
        {
          title: 'Paper Found by DOI',
          authors: ['Author, A.', 'Coauthor, B.'],
          journal: 'Test Journal',
          year: 2023,
          publication_date: '2023',
          doi: '10.1234/test.2023.001',
          url: 'https://example.com/paper',
          abstract: 'This paper was found using DOI search.',
          confidence: 0.95,
          relevance_score: 0.9
        }
      ];

      mockSearchMethod.mockResolvedValue(mockScholarResults);

      // Mock request body for DOI extraction
      const requestBody = {
        source: '10.1234/test.2023.001',
        type: 'doi',
        conversationId: 'test-conversation-123'
      };

      mockContext.req.json.mockResolvedValue(requestBody);
      mockContext.json.mockImplementation((data: any) => ({ data }));

      // Execute the extraction
      await handler.extract(mockContext);

      // Verify the search was called with DOI query
      expect(mockSearchMethod).toHaveBeenCalledWith(
        '"10.1234/test.2023.001"',
        expect.objectContaining({
          maxResults: 1
        })
      );

      // Verify the extracted metadata
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          metadata: expect.objectContaining({
            title: 'Paper Found by DOI',
            authors: ['Author, A.', 'Coauthor, B.'],
            journal: 'Test Journal',
            doi: '10.1234/test.2023.001',
            confidence: 0.95
          })
        })
      );
    });

    it('should handle metadata extraction failures gracefully', async () => {
      // Mock search failure
      mockSearchMethod.mockRejectedValue(new Error('Search failed'));

      // Mock request body
      const requestBody = {
        source: '10.1234/nonexistent.doi',
        type: 'doi',
        conversationId: 'test-conversation-123'
      };

      mockContext.req.json.mockResolvedValue(requestBody);
      mockContext.json.mockImplementation((data: any) => ({ data }));

      // Execute the extraction
      await handler.extract(mockContext);

      // Verify that a fallback response is provided
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          metadata: expect.objectContaining({
            title: 'Extraction Failed',
            authors: ['Unknown Author'],
            confidence: 0.1,
            doi: '10.1234/nonexistent.doi'
          })
        })
      );
    });

    it('should extract metadata from URL using title search', async () => {
      // Mock successful URL-based search
      const mockScholarResults: ScholarSearchResult[] = [
        {
          title: 'Machine Learning Paper',
          authors: ['Researcher, A.'],
          journal: 'ML Journal',
          year: 2023,
          publication_date: '2023',
          confidence: 0.7, // Lower confidence for URL extraction
          relevance_score: 0.8
        }
      ];

      mockSearchMethod.mockResolvedValue(mockScholarResults);

      // Mock request body for URL extraction
      const requestBody = {
        source: 'https://example.com/papers/machine-learning-paper.pdf',
        type: 'url',
        conversationId: 'test-conversation-123'
      };

      mockContext.req.json.mockResolvedValue(requestBody);
      mockContext.json.mockImplementation((data: any) => ({ data }));

      // Execute the extraction
      await handler.extract(mockContext);

      // Verify the search was called with extracted title
      expect(mockSearchMethod).toHaveBeenCalledWith(
        'machine learning paper',
        expect.objectContaining({
          maxResults: 3
        })
      );

      // Verify the extracted metadata has reduced confidence
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          metadata: expect.objectContaining({
            title: 'Machine Learning Paper',
            confidence: expect.any(Number),
            url: 'https://example.com/papers/machine-learning-paper.pdf'
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limit errors appropriately', async () => {
      // Mock rate limit error
      const rateLimitError = new Error('Rate limit exceeded');
      mockSearchMethod.mockRejectedValue(rateLimitError);

      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      };

      mockContext.req.json.mockResolvedValue(requestBody);
      mockContext.json.mockImplementation((data: any) => ({ data }));

      // Execute the search
      await handler.search(mockContext);

      // Verify that the error was handled and a response was still provided
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.any(Array),
          query: 'test query'
        })
      );
    });

    it('should provide helpful fallback results when search fails', async () => {
      // Mock blocked access error
      const blockedError = new Error('Access blocked');
      mockSearchMethod.mockRejectedValue(blockedError);

      // Mock request body
      const requestBody = {
        query: 'important research query',
        conversationId: 'test-conversation-123'
      };

      mockContext.req.json.mockResolvedValue(requestBody);
      mockContext.json.mockImplementation((data: any) => ({ data }));

      // Execute the search
      await handler.search(mockContext);

      // Verify that helpful fallback results are provided
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          results: expect.arrayContaining([
            expect.objectContaining({
              title: expect.stringContaining('important research query'),
              abstract: expect.stringContaining('currently unable to search'),
              url: expect.stringContaining('scholar.google.com')
            })
          ])
        })
      );
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent search requests', async () => {
      // Mock successful search
      mockSearchMethod.mockResolvedValue([
        {
          title: 'Test Paper',
          authors: ['Author, A.'],
          confidence: 0.8,
          relevance_score: 0.7
        }
      ]);

      // Create multiple concurrent requests
      const requests = Array.from({ length: 3 }, (_, i) => {
        const context = {
          ...mockContext,
          req: {
            json: vi.fn().mockResolvedValue({
              query: `test query ${i}`,
              conversationId: `test-conversation-${i}`
            })
          },
          json: vi.fn()
        };
        return handler.search(context);
      });

      // Execute all requests concurrently
      await Promise.all(requests);

      // Verify all searches were executed
      expect(mockSearchMethod).toHaveBeenCalledTimes(3);
    });

    it('should include processing time in response', async () => {
      // Mock search with delay
      mockSearchMethod.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      // Mock request body
      const requestBody = {
        query: 'test query',
        conversationId: 'test-conversation-123'
      };

      mockContext.req.json.mockResolvedValue(requestBody);
      mockContext.json.mockImplementation((data: any) => ({ data }));

      // Execute the search
      await handler.search(mockContext);

      // Verify that processing time is included
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          processingTime: expect.any(Number)
        })
      );
    });
  });
});