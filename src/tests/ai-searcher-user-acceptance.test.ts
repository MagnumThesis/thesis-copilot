/**
 * User Acceptance Tests for AI Reference Searcher
 * Tests that validate the AI Reference Searcher meets user requirements and expectations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Referencer } from '@/components/ui/referencer';
import { AISearcher } from '@/components/ui/ai-searcher';

// Mock dependencies
vi.mock('@/hooks/use-privacy-manager', () => ({
  usePrivacyManager: () => ({
    hasConsent: true,
    loadSettings: vi.fn(),
    loadDataSummary: vi.fn()
  })
}));

vi.mock('@/hooks/use-search-analytics', () => ({
  useSearchResultTracking: () => ({
    trackReferenceAdded: vi.fn(),
    trackReferenceRejected: vi.fn(),
    trackReferenceViewed: vi.fn()
  })
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('AI Reference Searcher User Acceptance Tests', () => {
  const mockConversation = { 
    title: 'Test Thesis Project', 
    id: 'test-conversation-123' 
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic User Workflow', () => {
    it('should allow users to search for references using AI searcher', async () => {
      const user = userEvent.setup();
      
      // Mock successful search response
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            results: [
              {
                title: 'Machine Learning in Academic Writing',
                authors: ['Smith, J.', 'Johnson, A.'],
                journal: 'Journal of AI Research',
                year: 2023,
                citations: 45,
                doi: '10.1234/jair.2023.001',
                url: 'https://example.com/paper1',
                abstract: 'This paper explores the application of machine learning in academic writing assistance...',
                keywords: ['machine learning', 'academic writing', 'AI'],
                confidence: 0.92,
                relevance_score: 0.88,
                citation_count: 45
              },
              {
                title: 'Natural Language Processing for Thesis Writing',
                authors: ['Brown, C.', 'Davis, E.'],
                journal: 'Computational Linguistics',
                year: 2022,
                citations: 32,
                doi: '10.5678/cl.2022.002',
                url: 'https://example.com/paper2',
                abstract: 'A comprehensive study on NLP techniques for enhancing thesis writing quality...',
                keywords: ['NLP', 'thesis writing', 'language processing'],
                confidence: 0.87,
                relevance_score: 0.82,
                citation_count: 32
              }
            ],
            sessionId: 'test-session-123',
            query: '"machine learning" AND "academic writing"',
            total_results: 2,
            loaded_results: 2,
            has_more: false,
            processingTime: 1250
          })
        });

      render(
        <Referencer
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Switch to AI Searcher tab
      await user.click(screen.getByText('AI Searcher'));

      // Find and fill search input
      const searchInput = screen.getByPlaceholderText(/Enter your search query/i);
      await user.type(searchInput, 'machine learning in academic writing');

      // Click search button
      const searchButton = screen.getByText('Search');
      await user.click(searchButton);

      // Wait for results to load
      await waitFor(() => {
        expect(screen.getByText('Search Results (2)')).toBeInTheDocument();
      });

      // Verify first result
      const firstResult = screen.getByText('Machine Learning in Academic Writing').closest('.rounded-lg');
      expect(firstResult).toBeInTheDocument();
      
      if (firstResult) {
        expect(within(firstResult).getByText('Smith, J., Johnson, A.')).toBeInTheDocument();
        expect(within(firstResult).getByText('Journal of AI Research')).toBeInTheDocument();
        expect(within(firstResult).getByText('2023')).toBeInTheDocument();
        expect(within(firstResult).getByText('45')).toBeInTheDocument();
        
        // Check confidence badges
        expect(within(firstResult).getByText('Overall: 92%')).toBeInTheDocument();
        expect(within(firstResult).getByText('Relevance: 88%')).toBeInTheDocument();
      }

      // Verify second result
      const secondResult = screen.getByText('Natural Language Processing for Thesis Writing').closest('.rounded-lg');
      expect(secondResult).toBeInTheDocument();
      
      if (secondResult) {
        expect(within(secondResult).getByText('Brown, C., Davis, E.')).toBeInTheDocument();
        expect(within(secondResult).getByText('Computational Linguistics')).toBeInTheDocument();
        expect(within(secondResult).getByText('2022')).toBeInTheDocument();
        expect(within(secondResult).getByText('32')).toBeInTheDocument();
      }

      // Verify API was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ai-searcher/search',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('machine learning in academic writing')
        })
      );
    });

    it('should allow users to add references from search results', async () => {
      const user = userEvent.setup();
      
      // Mock search response
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            results: [
              {
                title: 'Test Paper for Addition',
                authors: ['Test, Author'],
                journal: 'Test Journal',
                year: 2023,
                citations: 15,
                doi: '10.1234/test.2023.001',
                url: 'https://example.com/test',
                abstract: 'Test abstract for paper addition',
                keywords: ['test', 'paper'],
                confidence: 0.85,
                relevance_score: 0.8,
                citation_count: 15
              }
            ],
            sessionId: 'test-session-123',
            query: 'test paper',
            total_results: 1,
            loaded_results: 1,
            has_more: false,
            processingTime: 800
          })
        })
        // Mock add reference response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            reference: {
              id: 'ref-123',
              title: 'Test Paper for Addition',
              authors: ['Test, Author'],
              journal: 'Test Journal',
              year: 2023,
              citations: 15,
              doi: '10.1234/test.2023.001',
              url: 'https://example.com/test'
            }
          })
        });

      render(
        <Referencer
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Switch to AI Searcher tab
      await user.click(screen.getByText('AI Searcher'));

      // Perform search
      const searchInput = screen.getByPlaceholderText(/Enter your search query/i);
      await user.type(searchInput, 'test paper');
      await user.click(screen.getByText('Search'));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('Test Paper for Addition')).toBeInTheDocument();
      });

      // Add reference
      const addButton = screen.getByText('Add Reference');
      await user.click(addButton);

      // Verify reference was added
      await waitFor(() => {
        expect(screen.getByText(/Reference "Test Paper for Addition" added successfully!/i)).toBeInTheDocument();
      });

      // Verify API calls
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        '/api/ai-searcher/search',
        expect.anything()
      );
      
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        '/api/referencer/references',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test Paper for Addition')
        })
      );
    });
  });

  describe('Content-Based Search Workflow', () => {
    it('should allow users to search based on their content', async () => {
      const user = userEvent.setup();
      
      // Mock content extraction and search responses
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            extractedContent: [
              {
                source: 'ideas',
                id: '1',
                title: 'My Research Idea',
                content: 'I am researching machine learning applications in academic writing.',
                keywords: ['machine learning', 'academic writing', 'applications'],
                keyPhrases: ['machine learning applications', 'academic writing'],
                topics: ['AI in education', 'writing assistance'],
                confidence: 0.9
              }
            ],
            totalExtracted: 1,
            processingTime: 300
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            queries: [
              {
                id: 'query-1',
                query: '"machine learning" AND "academic writing" AND "applications"',
                confidence: 0.9,
                keywords: ['machine learning', 'academic writing', 'applications'],
                topics: ['AI in education', 'writing assistance']
              }
            ],
            extractedContent: [
              {
                source: 'ideas',
                id: '1',
                title: 'My Research Idea',
                content: 'I am researching machine learning applications in academic writing.',
                keywords: ['machine learning', 'academic writing', 'applications'],
                keyPhrases: ['machine learning applications', 'academic writing'],
                topics: ['AI in education', 'writing assistance'],
                confidence: 0.9
              }
            ],
            processingTime: 400
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            results: [
              {
                title: 'Automated Academic Writing with ML',
                authors: ['Researcher, A.', 'Assistant, B.'],
                journal: 'AI in Education Journal',
                year: 2023,
                citations: 67,
                doi: '10.1234/aie.2023.001',
                url: 'https://example.com/ml-writing',
                abstract: 'This study investigates automated writing assistance using machine learning...',
                keywords: ['machine learning', 'academic writing', 'automation'],
                confidence: 0.95,
                relevance_score: 0.92,
                citation_count: 67
              }
            ],
            sessionId: 'test-session-456',
            query: '"machine learning" AND "academic writing" AND "applications"',
            total_results: 1,
            loaded_results: 1,
            has_more: false,
            processingTime: 1100
          })
        });

      render(
        <Referencer
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Switch to AI Searcher tab
      await user.click(screen.getByText('AI Searcher'));

      // Click content selection button
      const contentSelectButton = screen.getByText('Show Content Selection');
      await user.click(contentSelectButton);

      // Select content source
      const ideasCheckbox = screen.getByLabelText('Ideas Content 1');
      await user.click(ideasCheckbox);

      // Generate query
      const generateQueryButton = screen.getByText('Generate Query');
      await user.click(generateQueryButton);

      // Verify generated query
      await waitFor(() => {
        expect(screen.getByDisplayValue('"machine learning" AND "academic writing" AND "applications"')).toBeInTheDocument();
      });

      // Perform search
      const searchButton = screen.getByText('Search');
      await user.click(searchButton);

      // Verify results
      await waitFor(() => {
        expect(screen.getByText('Automated Academic Writing with ML')).toBeInTheDocument();
      });

      const result = screen.getByText('Automated Academic Writing with ML').closest('.rounded-lg');
      expect(result).toBeInTheDocument();
      
      if (result) {
        expect(within(result).getByText('Researcher, A., Assistant, B.')).toBeInTheDocument();
        expect(within(result).getByText('AI in Education Journal')).toBeInTheDocument();
        expect(within(result).getByText('2023')).toBeInTheDocument();
        expect(within(result).getByText('67')).toBeInTheDocument();
      }

      // Verify all API calls were made
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        '/api/ai-searcher/extract-content',
        expect.anything()
      );
      
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        '/api/ai-searcher/generate-query',
        expect.anything()
      );
      
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        '/api/ai-searcher/search',
        expect.anything()
      );
    });
  });

  describe('User Feedback Workflow', () => {
    it('should allow users to provide feedback on search results', async () => {
      const user = userEvent.setup();
      
      // Mock search response with feedback endpoint
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            results: [
              {
                title: 'Feedback Test Paper',
                authors: ['Feedback, Tester'],
                journal: 'User Experience Journal',
                year: 2023,
                citations: 25,
                doi: '10.1234/ux.2023.001',
                url: 'https://example.com/feedback',
                abstract: 'Testing user feedback mechanisms in academic search...',
                keywords: ['feedback', 'user experience', 'search'],
                confidence: 0.8,
                relevance_score: 0.75,
                citation_count: 25
              }
            ],
            sessionId: 'test-session-789',
            query: 'feedback test',
            total_results: 1,
            loaded_results: 1,
            has_more: false,
            processingTime: 900
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            feedbackId: 'feedback-123',
            message: 'Feedback recorded successfully',
            processingTime: 150
          })
        });

      render(
        <Referencer
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Switch to AI Searcher tab
      await user.click(screen.getByText('AI Searcher'));

      // Perform search
      const searchInput = screen.getByPlaceholderText(/Enter your search query/i);
      await user.type(searchInput, 'feedback test');
      await user.click(screen.getByText('Search'));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('Feedback Test Paper')).toBeInTheDocument();
      });

      // Provide feedback
      const feedbackButton = screen.getByText('Feedback');
      await user.click(feedbackButton);

      // Fill out feedback form
      const ratingInputs = screen.getAllByRole('radio');
      await user.click(ratingInputs[3]); // 4-star rating
      
      const commentsTextarea = screen.getByPlaceholderText(/Additional comments/i);
      await user.type(commentsTextarea, 'This paper is highly relevant to my research.');

      const submitButton = screen.getByText('Submit Feedback');
      await user.click(submitButton);

      // Verify feedback submission
      await waitFor(() => {
        expect(screen.getByText(/Thank you for your feedback!/i)).toBeInTheDocument();
      });

      // Verify feedback API call
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        '/api/ai-searcher/feedback',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('feedback test')
        })
      );
    });
  });

  describe('Search Result Management', () => {
    it('should allow users to bookmark and compare search results', async () => {
      const user = userEvent.setup();
      
      // Mock search response
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            results: [
              {
                title: 'Bookmark Test Paper 1',
                authors: ['Bookmarker, A.'],
                journal: 'Bookmark Journal',
                year: 2023,
                citations: 40,
                doi: '10.1234/bookmark.2023.001',
                url: 'https://example.com/bookmark1',
                abstract: 'First paper for bookmark testing...',
                keywords: ['bookmark', 'test'],
                confidence: 0.85,
                relevance_score: 0.8,
                citation_count: 40
              },
              {
                title: 'Bookmark Test Paper 2',
                authors: ['Bookmarker, B.'],
                journal: 'Comparison Journal',
                year: 2022,
                citations: 35,
                doi: '10.1234/comparison.2022.002',
                url: 'https://example.com/bookmark2',
                abstract: 'Second paper for comparison testing...',
                keywords: ['comparison', 'test'],
                confidence: 0.82,
                relevance_score: 0.78,
                citation_count: 35
              }
            ],
            sessionId: 'test-session-101',
            query: 'bookmark test',
            total_results: 2,
            loaded_results: 2,
            has_more: false,
            processingTime: 1000
          })
        });

      render(
        <Referencer
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Switch to AI Searcher tab
      await user.click(screen.getByText('AI Searcher'));

      // Perform search
      const searchInput = screen.getByPlaceholderText(/Enter your search query/i);
      await user.type(searchInput, 'bookmark test');
      await user.click(screen.getByText('Search'));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('Bookmark Test Paper 1')).toBeInTheDocument();
      });

      // Bookmark first result
      const firstResult = screen.getByText('Bookmark Test Paper 1').closest('.rounded-lg');
      if (firstResult) {
        const bookmarkButton = within(firstResult).getByLabelText('Bookmark result');
        await user.click(bookmarkButton);
      }

      // Bookmark second result
      const secondResult = screen.getByText('Bookmark Test Paper 2').closest('.rounded-lg');
      if (secondResult) {
        const bookmarkButton = within(secondResult).getByLabelText('Bookmark result');
        await user.click(bookmarkButton);
      }

      // Compare bookmarked results
      const compareButton = screen.getByText('Compare');
      await user.click(compareButton);

      // Verify comparison view
      await waitFor(() => {
        expect(screen.getByText('Comparing 2 Bookmarked Results')).toBeInTheDocument();
      });

      // Verify both papers are in comparison
      expect(screen.getByText('Bookmark Test Paper 1')).toBeInTheDocument();
      expect(screen.getByText('Bookmark Test Paper 2')).toBeInTheDocument();
    });

    it('should allow users to export search results', async () => {
      const user = userEvent.setup();
      
      // Mock search and export responses
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            results: [
              {
                title: 'Export Test Paper',
                authors: ['Exporter, Test'],
                journal: 'Export Journal',
                year: 2023,
                citations: 30,
                doi: '10.1234/export.2023.001',
                url: 'https://example.com/export',
                abstract: 'Paper for export testing...',
                keywords: ['export', 'test'],
                confidence: 0.88,
                relevance_score: 0.85,
                citation_count: 30
              }
            ],
            sessionId: 'test-session-102',
            query: 'export test',
            total_results: 1,
            loaded_results: 1,
            has_more: false,
            processingTime: 850
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            exportData: 'Exported data content',
            format: 'bibtex',
            citation_count: 1
          })
        });

      render(
        <Referencer
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Switch to AI Searcher tab
      await user.click(screen.getByText('AI Searcher'));

      // Perform search
      const searchInput = screen.getByPlaceholderText(/Enter your search query/i);
      await user.type(searchInput, 'export test');
      await user.click(screen.getByText('Search'));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('Export Test Paper')).toBeInTheDocument();
      });

      // Export results
      const exportButton = screen.getByText('Export Results');
      await user.click(exportButton);

      // Select export format
      const formatSelect = screen.getByLabelText(/Export format/i);
      await user.selectOptions(formatSelect, 'bibtex');

      // Confirm export
      const confirmButton = screen.getByText('Export');
      await user.click(confirmButton);

      // Verify export
      await waitFor(() => {
        expect(screen.getByText(/Export completed successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and User Experience', () => {
    it('should gracefully handle search errors and provide helpful messages', async () => {
      const user = userEvent.setup();
      
      // Mock search error response
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({
            success: false,
            error: 'Search service temporarily unavailable',
            processingTime: 500
          })
        });

      render(
        <Referencer
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Switch to AI Searcher tab
      await user.click(screen.getByText('AI Searcher'));

      // Perform search that will fail
      const searchInput = screen.getByPlaceholderText(/Enter your search query/i);
      await user.type(searchInput, 'error test');
      await user.click(screen.getByText('Search'));

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/Search failed after 3 attempts/i)).toBeInTheDocument();
      });

      // Verify helpful error message
      expect(screen.getByText(/Please try your search again/i)).toBeInTheDocument();

      // Verify fallback results are shown
      expect(screen.getByText(/Search temporarily unavailable/i)).toBeInTheDocument();
    });

    it('should handle rate limiting gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock rate limit error
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({
            success: false,
            error: 'Rate limit exceeded',
            retryAfter: 60,
            processingTime: 100
          })
        });

      render(
        <Referencer
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Switch to AI Searcher tab
      await user.click(screen.getByText('AI Searcher'));

      // Perform search that triggers rate limit
      const searchInput = screen.getByPlaceholderText(/Enter your search query/i);
      await user.type(searchInput, 'rate limit test');
      await user.click(screen.getByText('Search'));

      // Verify rate limit handling
      await waitFor(() => {
        expect(screen.getByText(/Search rate limit exceeded/i)).toBeInTheDocument();
      });

      // Verify retry instructions
      expect(screen.getByText(/Please wait before trying again/i)).toBeInTheDocument();
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should provide responsive feedback during long searches', async () => {
      const user = userEvent.setup();
      
      // Mock slow search response
      (global.fetch as any)
        .mockResolvedValueOnce(new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                success: true,
                results: [
                  {
                    title: 'Performance Test Paper',
                    authors: ['Performer, Test'],
                    journal: 'Performance Journal',
                    year: 2023,
                    citations: 50,
                    doi: '10.1234/perf.2023.001',
                    url: 'https://example.com/perf',
                    abstract: 'Paper for performance testing...',
                    keywords: ['performance', 'test'],
                    confidence: 0.9,
                    relevance_score: 0.88,
                    citation_count: 50
                  }
                ],
                sessionId: 'test-session-103',
                query: 'performance test',
                total_results: 1,
                loaded_results: 1,
                has_more: false,
                processingTime: 2500
              })
            });
          }, 1000);
        }));

      render(
        <Referencer
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Switch to AI Searcher tab
      await user.click(screen.getByText('AI Searcher'));

      // Perform search
      const searchInput = screen.getByPlaceholderText(/Enter your search query/i);
      await user.type(searchInput, 'performance test');
      await user.click(screen.getByText('Search'));

      // Initially should show loading state
      expect(screen.getByText(/Searching and ranking results/i)).toBeInTheDocument();

      // After delay, should show results
      await waitFor(() => {
        expect(screen.getByText('Performance Test Paper')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify performance metrics are reasonable
      expect(screen.getByText(/Processing time: 2500ms/i)).toBeInTheDocument();
    });

    it('should handle large result sets with pagination', async () => {
      const user = userEvent.setup();
      
      // Mock large result set
      const largeResultSet = Array.from({ length: 50 }, (_, i) => ({
        title: `Large Result Set Paper ${i + 1}`,
        authors: [`Author, ${i + 1}`],
        journal: `Journal ${Math.floor(i / 10) + 1}`,
        year: 2020 + (i % 4),
        citations: Math.floor(Math.random() * 100) + 10,
        doi: `10.1234/large.${2020 + (i % 4)}.${String(i + 1).padStart(3, '0')}`,
        url: `https://example.com/large${i + 1}`,
        abstract: `Abstract for large result set paper ${i + 1}...`,
        keywords: [`keyword${i + 1}`, `test${Math.floor(i / 10) + 1}`],
        confidence: 0.5 + (Math.random() * 0.4),
        relevance_score: 0.4 + (Math.random() * 0.5),
        citation_count: Math.floor(Math.random() * 100) + 10
      }));

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            results: largeResultSet.slice(0, 20), // First page
            sessionId: 'test-session-104',
            query: 'large result set',
            total_results: 50,
            loaded_results: 20,
            has_more: true,
            processingTime: 1500
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            results: largeResultSet.slice(20, 40), // Second page
            loaded_results: 20,
            is_complete: false,
            processingTime: 800
          })
        });

      render(
        <Referencer
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Switch to AI Searcher tab
      await user.click(screen.getByText('AI Searcher'));

      // Perform search
      const searchInput = screen.getByPlaceholderText(/Enter your search query/i);
      await user.type(searchInput, 'large result set');
      await user.click(screen.getByText('Search'));

      // Wait for first page of results
      await waitFor(() => {
        expect(screen.getByText('Large Result Set Paper 1')).toBeInTheDocument();
      });

      // Verify pagination controls
      expect(screen.getByText('Search Results (50)')).toBeInTheDocument();
      expect(screen.getByText('Load More Results')).toBeInTheDocument();

      // Load more results
      const loadMoreButton = screen.getByText('Load More Results');
      await user.click(loadMoreButton);

      // Wait for second page
      await waitFor(() => {
        expect(screen.getByText('Large Result Set Paper 21')).toBeInTheDocument();
      });

      // Verify result counting
      expect(screen.getByText('Search Results (50)')).toBeInTheDocument();
    });
  });
});