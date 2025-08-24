import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { AISearcher } from '../components/ui/ai-searcher'
import { SearchFilters } from '../lib/ai-types'

// Mock the hooks and dependencies
vi.mock('../hooks/useSearchAnalytics', () => ({
  useSearchResultTracking: () => ({
    trackReferenceAdded: vi.fn(),
    trackReferenceRejected: vi.fn(),
    trackReferenceViewed: vi.fn()
  })
}))

vi.mock('../components/ui/content-source-selector', () => ({
  ContentSourceSelector: () => React.createElement('div', { 'data-testid': 'content-source-selector' }, 'Content Source Selector')
}))

vi.mock('../components/ui/query-refinement-panel', () => ({
  QueryRefinementPanel: () => React.createElement('div', { 'data-testid': 'query-refinement-panel' }, 'Query Refinement Panel')
}))

vi.mock('../components/ui/deduplication-settings', () => ({
  DeduplicationSettings: () => React.createElement('div', { 'data-testid': 'deduplication-settings' }, 'Deduplication Settings')
}))

vi.mock('../components/ui/duplicate-conflict-resolver', () => ({
  DuplicateConflictResolver: () => React.createElement('div', { 'data-testid': 'duplicate-conflict-resolver' }, 'Duplicate Conflict Resolver')
}))

vi.mock('../components/ui/search-results-display', () => ({
  SearchResultsDisplay: () => React.createElement('div', { 'data-testid': 'search-results-display' }, 'Search Results Display')
}))

vi.mock('../components/ui/search-session-feedback', () => ({
  SearchSessionFeedbackComponent: () => React.createElement('div', { 'data-testid': 'search-session-feedback' }, 'Search Session Feedback')
}))

vi.mock('../components/ui/search-filters-panel', () => ({
  SearchFiltersPanel: ({ isVisible, filters, onFiltersChange }: any) => {
    if (!isVisible) return null
    return React.createElement('div', { 'data-testid': 'search-filters-panel' }, 
      React.createElement('h3', {}, 'Search Filters'),
      React.createElement('input', { 
        'data-testid': 'start-year-input',
        'aria-label': 'From Year',
        onChange: (e: any) => onFiltersChange({ 
          ...filters, 
          dateRange: { ...filters.dateRange, start: parseInt(e.target.value) || undefined }
        })
      }),
      React.createElement('input', { 
        'data-testid': 'end-year-input',
        'aria-label': 'To Year',
        onChange: (e: any) => onFiltersChange({ 
          ...filters, 
          dateRange: { ...filters.dateRange, end: parseInt(e.target.value) || undefined }
        })
      }),
      React.createElement('input', { 
        'data-testid': 'authors-input',
        placeholder: 'Enter author names separated by commas',
        onChange: (e: any) => {
          const authors = e.target.value.split(',').map((a: string) => a.trim()).filter(Boolean)
          onFiltersChange({ ...filters, authors })
        }
      }),
      React.createElement('button', { 
        'data-testid': 'reset-filters',
        onClick: () => onFiltersChange({ sortBy: 'relevance' })
      }, 'Reset'),
      filters.dateRange?.start && React.createElement('span', {}, '1 active'),
      filters.authors?.length > 0 && filters.dateRange?.start && React.createElement('span', {}, '2 active')
    )
  }
}))

vi.mock('../worker/lib/duplicate-detection-engine', () => ({
  DuplicateDetectionEngine: vi.fn().mockImplementation(() => ({
    detectDuplicates: vi.fn().mockReturnValue([]),
    removeDuplicates: vi.fn().mockReturnValue([])
  }))
}))

// Mock fetch for API calls
global.fetch = vi.fn()

describe('AI Searcher Integration', () => {
  const mockProps = {
    conversationId: 'test-conversation-id',
    onAddReference: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API response
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        results: [
          {
            title: "Test Paper 1",
            authors: ["Author A", "Author B"],
            journal: "Test Journal",
            publication_date: "2023",
            confidence: 0.9,
            relevance_score: 0.8
          }
        ],
        sessionId: 'test-session-id'
      })
    })
  })

  it('should render search filters panel', () => {
    render(<AISearcher {...mockProps} />)
    
    // Check if the filters button is present
    expect(screen.getByText('Filters')).toBeInTheDocument()
  })

  it('should toggle search filters panel visibility', async () => {
    render(<AISearcher {...mockProps} />)
    
    const filtersButton = screen.getByText('Filters')
    
    // Initially filters panel should not be visible
    expect(screen.queryByText('Search Filters')).not.toBeInTheDocument()
    
    // Click to show filters
    fireEvent.click(filtersButton)
    
    // Now filters panel should be visible
    await waitFor(() => {
      expect(screen.getByText('Search Filters')).toBeInTheDocument()
    })
  })

  it('should include filters in search API request', async () => {
    render(<AISearcher {...mockProps} />)
    
    // Open filters panel
    const filtersButton = screen.getByText('Filters')
    fireEvent.click(filtersButton)
    
    await waitFor(() => {
      expect(screen.getByText('Search Filters')).toBeInTheDocument()
    })
    
    // Set a search query
    const searchInput = screen.getByPlaceholderText(/Enter your search query/)
    fireEvent.change(searchInput, { target: { value: 'machine learning' } })
    
    // Perform search
    const searchButton = screen.getByText('Search')
    fireEvent.click(searchButton)
    
    // Verify API was called with filters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/ai-searcher/search', {
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

  it('should handle search with custom filters', async () => {
    render(<AISearcher {...mockProps} />)
    
    // Open filters panel
    const filtersButton = screen.getByText('Filters')
    fireEvent.click(filtersButton)
    
    await waitFor(() => {
      expect(screen.getByText('Search Filters')).toBeInTheDocument()
    })
    
    // Set date range filter
    const startYearInput = screen.getByLabelText('From Year')
    fireEvent.change(startYearInput, { target: { value: '2020' } })
    
    const endYearInput = screen.getByLabelText('To Year')
    fireEvent.change(endYearInput, { target: { value: '2023' } })
    
    // Set search query
    const searchInput = screen.getByPlaceholderText(/Enter your search query/)
    fireEvent.change(searchInput, { target: { value: 'AI research' } })
    
    // Perform search
    const searchButton = screen.getByText('Search')
    fireEvent.click(searchButton)
    
    // Verify API was called with date range filters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/ai-searcher/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'AI research',
          conversationId: 'test-conversation-id',
          filters: {
            dateRange: { start: 2020, end: 2023 },
            sortBy: 'relevance'
          }
        })
      })
    })
  })

  it('should reset filters when reset button is clicked', async () => {
    render(<AISearcher {...mockProps} />)
    
    // Open filters panel
    const filtersButton = screen.getByText('Filters')
    fireEvent.click(filtersButton)
    
    await waitFor(() => {
      expect(screen.getByText('Search Filters')).toBeInTheDocument()
    })
    
    // Set some filters
    const startYearInput = screen.getByLabelText('From Year')
    fireEvent.change(startYearInput, { target: { value: '2020' } })
    
    const authorsInput = screen.getByPlaceholderText(/Enter author names/)
    fireEvent.change(authorsInput, { target: { value: 'Smith, Johnson' } })
    
    // Reset filters
    const resetButton = screen.getByText('Reset')
    fireEvent.click(resetButton)
    
    // Verify filters are reset
    await waitFor(() => {
      expect(startYearInput).toHaveValue('')
      expect(authorsInput).toHaveValue('')
    })
  })

  it('should show active filters count', async () => {
    render(<AISearcher {...mockProps} />)
    
    // Open filters panel
    const filtersButton = screen.getByText('Filters')
    fireEvent.click(filtersButton)
    
    await waitFor(() => {
      expect(screen.getByText('Search Filters')).toBeInTheDocument()
    })
    
    // Initially no active filters badge
    expect(screen.queryByText(/active/)).not.toBeInTheDocument()
    
    // Set a date range filter
    const startYearInput = screen.getByLabelText('From Year')
    fireEvent.change(startYearInput, { target: { value: '2020' } })
    
    // Should show active filters count
    await waitFor(() => {
      expect(screen.getByText('1 active')).toBeInTheDocument()
    })
    
    // Add another filter
    const authorsInput = screen.getByPlaceholderText(/Enter author names/)
    fireEvent.change(authorsInput, { target: { value: 'Smith' } })
    
    // Should show updated count
    await waitFor(() => {
      expect(screen.getByText('2 active')).toBeInTheDocument()
    })
  })
})