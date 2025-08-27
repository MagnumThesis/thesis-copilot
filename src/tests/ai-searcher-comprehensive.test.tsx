/**
 * Comprehensive AI Searcher Tests
 * Complete test suite for the AI Reference Searcher feature
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AISearcher } from '../components/ui/ai-searcher'
import { ScholarSearchResult, ExtractedContent } from '../lib/ai-types'

// Mock all dependencies
vi.mock('../hooks/useSearchAnalytics', () => ({
  useSearchResultTracking: () => ({
    trackReferenceAdded: vi.fn(),
    trackReferenceRejected: vi.fn(),
    trackReferenceViewed: vi.fn()
  })
}))

vi.mock('../hooks/usePrivacyManager', () => ({
  usePrivacyManager: () => ({
    hasConsent: true,
    loadSettings: vi.fn(),
    loadDataSummary: vi.fn()
  })
}))

vi.mock('../components/ui/content-source-selector', () => ({
  ContentSourceSelector: ({ 
    conversationId, 
    onContentSelected, 
    onContentPreview, 
    onSearchQueryGenerated,
    isVisible
  }: any) => {
    if (!isVisible) return null
    return (
      <div data-testid="content-source-selector">
        <h3>Content Source Selector</h3>
        <button 
          onClick={() => onContentSelected([
            {
              source: 'ideas',
              id: '1',
              title: 'Test Idea',
              content: 'Test content from ideas',
              keywords: ['test', 'idea'],
              topics: ['research'],
              confidence: 0.8
            }
          ])}
        >
          Select Test Content
        </button>
        <button 
          onClick={() => onSearchQueryGenerated('generated test query')}
        >
          Generate Query
        </button>
      </div>
    )
  }
}))

vi.mock('../components/ui/query-refinement-panel', () => ({
  QueryRefinementPanel: ({ 
    originalQuery, 
    refinement, 
    onQueryUpdate, 
    onApplyRefinement,
    onRegenerateRefinement,
    isLoading
  }: any) => (
    <div data-testid="query-refinement-panel">
      <h3>Query Refinement Panel</h3>
      <p>Original Query: {originalQuery}</p>
      <button onClick={() => onQueryUpdate('refined query')}>
        Update Query
      </button>
      <button onClick={() => onApplyRefinement({ query: 'applied query' })}>
        Apply Refinement
      </button>
      <button onClick={onRegenerateRefinement}>
        Regenerate
      </button>
    </div>
  )
}))

vi.mock('../components/ui/duplicate-conflict-resolver', () => ({
  DuplicateConflictResolver: ({ 
    duplicateGroups, 
    onResolveConflicts, 
    onCancel
  }: any) => (
    <div data-testid="duplicate-conflict-resolver">
      <h3>Duplicate Conflict Resolver</h3>
      <p>Duplicate Groups: {duplicateGroups.length}</p>
      <button onClick={() => onResolveConflicts([
        {
          title: 'Resolved Paper',
          authors: ['Author, A.'],
          confidence: 0.9,
          relevance_score: 0.8
        }
      ])}>
        Resolve Conflicts
      </button>
      <button onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}))

vi.mock('../components/ui/deduplication-settings', () => ({
  DeduplicationSettings: ({ 
    options, 
    onOptionsChange, 
    onReset
  }: any) => (
    <div data-testid="deduplication-settings">
      <h3>Deduplication Settings</h3>
      <p>Title Threshold: {options.titleSimilarityThreshold}</p>
      <button onClick={() => onOptionsChange({
        ...options,
        titleSimilarityThreshold: 0.9
      })}>
        Update Threshold
      </button>
      <button onClick={onReset}>
        Reset
      </button>
    </div>
  )
}))

vi.mock('../components/ui/search-results-display', () => ({
  SearchResultsDisplay: ({ 
    results, 
    extractedContent, 
    onAddReference, 
    onProvideFeedback,
    loading,
    error
  }: any) => {
    if (loading) {
      return <div data-testid="search-results-display">Loading...</div>
    }
    
    if (error) {
      return <div data-testid="search-results-display">Error: {error}</div>
    }
    
    return (
      <div data-testid="search-results-display">
        <h3>Search Results ({results.length})</h3>
        {results.map((result: any, index: number) => (
          <div key={index} data-testid={`search-result-${index}`}>
            <h4>{result.title}</h4>
            <p>Authors: {result.authors.join(', ')}</p>
            <button onClick={() => onAddReference(result)}>
              Add Reference
            </button>
          </div>
        ))}
      </div>
    )
  }
}))

vi.mock('../components/ui/search-session-feedback', () => ({
  SearchSessionFeedbackComponent: ({ 
    searchSessionId, 
    searchQuery, 
    resultsCount, 
    onSubmitFeedback, 
    onCancel
  }: any) => (
    <div data-testid="search-session-feedback">
      <h3>Search Session Feedback</h3>
      <p>Query: {searchQuery}</p>
      <p>Results: {resultsCount}</p>
      <button onClick={() => onSubmitFeedback({
        overallSatisfaction: 5,
        relevanceRating: 5,
        qualityRating: 5,
        easeOfUseRating: 5,
        feedbackComments: 'Great search results!',
        wouldRecommend: true
      })}>
        Submit Feedback
      </button>
      <button onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}))

vi.mock('../components/ui/search-filters-panel', () => ({
  SearchFiltersPanel: ({ 
    filters, 
    onFiltersChange, 
    onReset, 
    isVisible, 
    onToggleVisibility
  }: any) => {
    if (!isVisible) return null
    return (
      <div data-testid="search-filters-panel">
        <h3>Search Filters</h3>
        <input 
          data-testid="year-start-input"
          placeholder="From Year"
          onChange={(e) => onFiltersChange({
            ...filters,
            dateRange: { ...filters.dateRange, start: parseInt(e.target.value) || undefined }
          })}
        />
        <input 
          data-testid="year-end-input"
          placeholder="To Year"
          onChange={(e) => onFiltersChange({
            ...filters,
            dateRange: { ...filters.dateRange, end: parseInt(e.target.value) || undefined }
          })}
        />
        <button onClick={onReset}>Reset Filters</button>
      </div>
    )
  }
}))

vi.mock('../components/ui/consent-banner', () => ({
  ConsentBanner: ({ conversationId, onConsentChange }: any) => (
    <div data-testid="consent-banner">
      <h3>Consent Banner</h3>
      <button onClick={() => onConsentChange(true)}>Grant Consent</button>
    </div>
  )
}))

vi.mock('../components/ui/privacy-controls', () => ({
  PrivacyControls: ({ conversationId, onSettingsChange, onDataCleared, onDataExported }: any) => (
    <div data-testid="privacy-controls">
      <h3>Privacy Controls</h3>
      <button onClick={() => onSettingsChange({})}>Update Settings</button>
      <button onClick={() => onDataCleared()}>Clear Data</button>
      <button onClick={() => onDataExported({})}>Export Data</button>
    </div>
  )
}))

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AI Searcher Comprehensive Tests', () => {
  const mockProps = {
    conversationId: 'test-conversation-id',
    onAddReference: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        results: [
          {
            title: 'Test Paper 1',
            authors: ['Author A', 'Author B'],
            journal: 'Test Journal',
            publication_date: '2023',
            confidence: 0.9,
            relevance_score: 0.8
          },
          {
            title: 'Test Paper 2',
            authors: ['Author C'],
            journal: 'Another Journal',
            publication_date: '2022',
            confidence: 0.8,
            relevance_score: 0.7
          }
        ],
        sessionId: 'test-session-id'
      })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the AI Searcher component', () => {
      render(<AISearcher {...mockProps} />)
      
      expect(screen.getByText('AI-Powered Reference Search')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Enter your search query/)).toBeInTheDocument()
      expect(screen.getByText('Search')).toBeInTheDocument()
    })

    it('should display consent banner when user has not given consent', () => {
      // Mock privacy manager to return no consent
      vi.mocked(require('../hooks/usePrivacyManager')).usePrivacyManager = () => ({
        hasConsent: false,
        loadSettings: vi.fn(),
        loadDataSummary: vi.fn()
      })
      
      render(<AISearcher {...mockProps} />)
      
      expect(screen.getByTestId('consent-banner')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should perform search when search button is clicked', async () => {
      render(<AISearcher {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText(/Enter your search query/)
      fireEvent.change(searchInput, { target: { value: 'machine learning' } })
      
      const searchButton = screen.getByText('Search')
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/ai-searcher/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'machine learning',
            conversationId: 'test-conversation-id',
            filters: {
              sortBy: 'relevance'
            }
          })
        })
      })
    })

    it('should display search results after successful search', async () => {
      render(<AISearcher {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText(/Enter your search query/)
      fireEvent.change(searchInput, { target: { value: 'test query' } })
      
      const searchButton = screen.getByText('Search')
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results-display')).toBeInTheDocument()
      })
      
      const resultsDisplay = screen.getByTestId('search-results-display')
      expect(within(resultsDisplay).getByText('Search Results (2)')).toBeInTheDocument()
      expect(within(resultsDisplay).getByText('Test Paper 1')).toBeInTheDocument()
      expect(within(resultsDisplay).getByText('Test Paper 2')).toBeInTheDocument()
    })

    it('should handle search errors gracefully', async () => {
      // Mock API failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })
      
      render(<AISearcher {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText(/Enter your search query/)
      fireEvent.change(searchInput, { target: { value: 'failing query' } })
      
      const searchButton = screen.getByText('Search')
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument()
      })
    })

    it('should display loading state during search', async () => {
      // Mock delayed response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({
              success: true,
              results: [],
              sessionId: 'test-session-id'
            })
          }), 100)
        )
      )
      
      render(<AISearcher {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText(/Enter your search query/)
      fireEvent.change(searchInput, { target: { value: 'delayed query' } })
      
      const searchButton = screen.getByText('Search')
      fireEvent.click(searchButton)
      
      // Should show loading state immediately
      expect(screen.getByText('Searching...')).toBeInTheDocument()
      
      // Wait for response
      await waitFor(() => {
        expect(screen.queryByText('Searching...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Content Source Selection', () => {
    it('should toggle content source selector visibility', async () => {
      render(<AISearcher {...mockProps} />)
      
      // Initially content selector should not be visible
      expect(screen.queryByTestId('content-source-selector')).not.toBeInTheDocument()
      
      // Click show content selection button
      const toggleButton = screen.getByText(/Show Content Selection/)
      fireEvent.click(toggleButton)
      
      // Content selector should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('content-source-selector')).toBeInTheDocument()
      })
      
      // Click hide button
      const hideButton = screen.getByText(/Hide/)
      fireEvent.click(hideButton)
      
      // Content selector should be hidden again
      await waitFor(() => {
        expect(screen.queryByTestId('content-source-selector')).not.toBeInTheDocument()
      })
    })

    it('should handle content selection and query generation', async () => {
      render(<AISearcher {...mockProps} />)
      
      // Show content selector
      const toggleButton = screen.getByText(/Show Content Selection/)
      fireEvent.click(toggleButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('content-source-selector')).toBeInTheDocument()
      })
      
      // Select content
      const selectButton = screen.getByText('Select Test Content')
      fireEvent.click(selectButton)
      
      // Check that search query was updated
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Enter your search query/)
        expect(searchInput).toHaveValue('Test content from ideas')
      })
    })

    it('should handle generated query from content', async () => {
      render(<AISearcher {...mockProps} />)
      
      // Show content selector
      const toggleButton = screen.getByText(/Show Content Selection/)
      fireEvent.click(toggleButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('content-source-selector')).toBeInTheDocument()
      })
      
      // Generate query
      const generateButton = screen.getByText('Generate Query')
      fireEvent.click(generateButton)
      
      // Check that search query was updated
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Enter your search query/)
        expect(searchInput).toHaveValue('generated test query')
      })
    })
  })

  describe('Query Refinement', () => {
    it('should toggle query refinement panel', async () => {
      render(<AISearcher {...mockProps} />)
      
      // Initially refinement panel should not be visible
      expect(screen.queryByTestId('query-refinement-panel')).not.toBeInTheDocument()
      
      // Enter search query and click refine
      const searchInput = screen.getByPlaceholderText(/Enter your search query/)
      fireEvent.change(searchInput, { target: { value: 'test query' } })
      
      const refineButton = screen.getByText('Refine')
      fireEvent.click(refineButton)
      
      // Refinement panel should be visible
      await waitFor(() => {
        expect(screen.getByTestId('query-refinement-panel')).toBeInTheDocument()
      })
      
      // Close refinement panel
      const closeButton = within(screen.getByTestId('query-refinement-panel')).getByText('Close')
      fireEvent.click(closeButton)
      
      // Refinement panel should be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('query-refinement-panel')).not.toBeInTheDocument()
      })
    })

    it('should handle query refinement actions', async () => {
      render(<AISearcher {...mockProps} />)
      
      // Enter search query and click refine
      const searchInput = screen.getByPlaceholderText(/Enter your search query/)
      fireEvent.change(searchInput, { target: { value: 'test query' } })
      
      const refineButton = screen.getByText('Refine')
      fireEvent.click(refineButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('query-refinement-panel')).toBeInTheDocument()
      })
      
      // Apply refinement
      const applyButton = within(screen.getByTestId('query-refinement-panel')).getByText('Apply Refinement')
      fireEvent.click(applyButton)
      
      // Check that query was updated
      await waitFor(() => {
        expect(searchInput).toHaveValue('applied query')
      })
    })
  })

  describe('Duplicate Detection and Resolution', () => {
    it('should show duplicate detection settings', async () => {
      render(<AISearcher {...mockProps} />)
      
      // Initially deduplication settings should not be visible
      expect(screen.queryByTestId('deduplication-settings')).not.toBeInTheDocument()
      
      // Perform search to show results
      const searchInput = screen.getByPlaceholderText(/Enter your search query/)
      fireEvent.change(searchInput, { target: { value: 'test query' } })
      
      const searchButton = screen.getByText('Search')
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results-display')).toBeInTheDocument()
      })
      
      // Show deduplication settings
      const settingsButton = screen.getByText(/Deduplication Settings/)
      fireEvent.click(settingsButton)
      
      // Deduplication settings should be visible
      await waitFor(() => {
        expect(screen.getByTestId('deduplication-settings')).toBeInTheDocument()
      })
    })

    it('should handle duplicate resolution', async () => {
      // Mock search response with duplicates
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          results: [
            {
              title: 'Duplicate Paper',
              authors: ['Author A'],
              confidence: 0.9,
              relevance_score: 0.8
            }
          ],
          sessionId: 'test-session-id'
        })
      })
      
      render(<AISearcher {...mockProps} />)
      
      // Perform search
      const searchInput = screen.getByPlaceholderText(/Enter your search query/)
      fireEvent.change(searchInput, { target: { value: 'test query' } })
      
      const searchButton = screen.getByText('Search')
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results-display')).toBeInTheDocument()
      })
      
      // Show duplicate resolver
      const resolveButton = screen.getByText(/Resolve Duplicates/)
      fireEvent.click(resolveButton)
      
      // Duplicate resolver should be visible
      await waitFor(() => {
        expect(screen.getByTestId('duplicate-conflict-resolver')).toBeInTheDocument()
      })
      
      // Resolve conflicts
      const resolveButton2 = within(screen.getByTestId('duplicate-conflict-resolver')).getByText('Resolve Conflicts')
      fireEvent.click(resolveButton2)
      
      // Check that results were updated
      await waitFor(() => {
        expect(screen.getByText('Resolved Paper')).toBeInTheDocument()
      })
    })
  })

  describe('Search Filters', () => {
    it('should toggle search filters panel', async () => {
      render(<AISearcher {...mockProps} />)
      
      // Initially filters panel should not be visible
      expect(screen.queryByTestId('search-filters-panel')).not.toBeInTheDocument()
      
      // Click filters button
      const filtersButton = screen.getByText('Filters')
      fireEvent.click(filtersButton)
      
      // Filters panel should be visible
      await waitFor(() => {
        expect(screen.getByTestId('search-filters-panel')).toBeInTheDocument()
      })
      
      // Click filters button again to hide
      fireEvent.click(filtersButton)
      
      // Filters panel should be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('search-filters-panel')).not.toBeInTheDocument()
      })
    })

    it('should handle filter changes', async () => {
      render(<AISearcher {...mockProps} />)
      
      // Show filters panel
      const filtersButton = screen.getByText('Filters')
      fireEvent.click(filtersButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-filters-panel')).toBeInTheDocument()
      })
      
      // Set year range
      const startYearInput = screen.getByTestId('year-start-input')
      fireEvent.change(startYearInput, { target: { value: '2020' } })
      
      const endYearInput = screen.getByTestId('year-end-input')
      fireEvent.change(endYearInput, { target: { value: '2023' } })
      
      // Perform search
      const searchInput = screen.getByPlaceholderText(/Enter your search query/)
      fireEvent.change(searchInput, { target: { value: 'filtered query' } })
      
      const searchButton = screen.getByText('Search')
      fireEvent.click(searchButton)
      
      // Check that filters were included in API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/ai-searcher/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'filtered query',
            conversationId: 'test-conversation-id',
            filters: {
              dateRange: { start: 2020, end: 2023 },
              sortBy: 'relevance'
            }
          })
        })
      })
    })
  })

  describe('Feedback and Session Management', () => {
    it('should show session feedback form after search', async () => {
      render(<AISearcher {...mockProps} />)
      
      // Perform search
      const searchInput = screen.getByPlaceholderText(/Enter your search query/)
      fireEvent.change(searchInput, { target: { value: 'feedback query' } })
      
      const searchButton = screen.getByText('Search')
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results-display')).toBeInTheDocument()
      })
      
      // Show session feedback
      const feedbackButton = screen.getByText(/Rate Search/)
      fireEvent.click(feedbackButton)
      
      // Feedback form should be visible
      await waitFor(() => {
        expect(screen.getByTestId('search-session-feedback')).toBeInTheDocument()
      })
    })

    it('should handle feedback submission', async () => {
      render(<AISearcher {...mockProps} />)
      
      // Perform search
      const searchInput = screen.getByPlaceholderText(/Enter your search query/)
      fireEvent.change(searchInput, { target: { value: 'feedback query' } })
      
      const searchButton = screen.getByText('Search')
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-results-display')).toBeInTheDocument()
      })
      
      // Show session feedback
      const feedbackButton = screen.getByText(/Rate Search/)
      fireEvent.click(feedbackButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('search-session-feedback')).toBeInTheDocument()
      })
      
      // Submit feedback
      const submitButton = within(screen.getByTestId('search-session-feedback')).getByText('Submit Feedback')
      fireEvent.click(submitButton)
      
      // Check that feedback was submitted via API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/ai-searcher/feedback/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.any(String)
        })
      })
    })
  })

  describe('Privacy Controls', () => {
    it('should toggle privacy controls visibility', async () => {
      render(<AISearcher {...mockProps} />)
      
      // Initially privacy controls should not be visible
      expect(screen.queryByTestId('privacy-controls')).not.toBeInTheDocument()
      
      // Click privacy button
      const privacyButton = screen.getByText('Privacy')
      fireEvent.click(privacyButton)
      
      // Privacy controls should be visible
      await waitFor(() => {
        expect(screen.getByTestId('privacy-controls')).toBeInTheDocument()
      })
      
      // Click privacy button again to hide
      fireEvent.click(privacyButton)
      
      // Privacy controls should be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('privacy-controls')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty search query', async () => {
      render(<AISearcher {...mockProps} />)
      
      const searchButton = screen.getByText('Search')
      fireEvent.click(searchButton)
      
      // Should not make API call for empty query
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle search with no results', async () => {
      // Mock empty results
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          results: [],
          sessionId: 'test-session-id'
        })
      })
      
      render(<AISearcher {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText(/Enter your search query/)
      fireEvent.change(searchInput, { target: { value: 'no results query' } })
      
      const searchButton = screen.getByText('Search')
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('Search Results (0)')).toBeInTheDocument()
      })
    })

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      render(<AISearcher {...mockProps} />)
      
      const searchInput = screen.getByPlaceholderText(/Enter your search query/)
      fireEvent.change(searchInput, { target: { value: 'error query' } })
      
      const searchButton = screen.getByText('Search')
      fireEvent.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument()
      })
    })
  })
})