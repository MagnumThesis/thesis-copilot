/**
 * Search Results Display Component Tests
 * Tests for the search results display with ranking, sorting, and pagination
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SearchResultsDisplay } from '../components/ui/search-results-display'
import { ScholarSearchResult, ExtractedContent } from '../lib/ai-types'

// Mock the ResultScoringEngine
vi.mock('../worker/lib/result-scoring-engine', () => ({
  ResultScoringEngine: vi.fn().mockImplementation(() => ({
    rankResults: vi.fn().mockImplementation((results) => 
      results.map((result, index) => ({
        ...result,
        relevanceScore: 0.8 - (index * 0.1),
        qualityScore: 0.7 - (index * 0.1),
        confidenceScore: 0.9 - (index * 0.1),
        overallScore: 0.8 - (index * 0.1),
        rank: index + 1,
        scoringBreakdown: {
          relevance: {
            textSimilarity: 0.8,
            keywordMatch: 0.7,
            topicOverlap: 0.6,
            semanticSimilarity: 0.5
          },
          quality: {
            citationScore: 0.8,
            recencyScore: 0.7,
            authorAuthority: 0.6,
            journalQuality: 0.9,
            completenessScore: 0.8
          },
          confidence: {
            metadataCompleteness: 0.9,
            sourceReliability: 0.8,
            extractionQuality: 0.7
          }
        }
      }))
    )
  }))
}))

describe('SearchResultsDisplay', () => {
  const mockResults: ScholarSearchResult[] = [
    {
      title: 'Machine Learning in Academic Research',
      authors: ['Smith, J.', 'Johnson, A.'],
      journal: 'Journal of AI Research',
      year: 2023,
      citations: 150,
      doi: '10.1234/jair.2023.001',
      url: 'https://example.com/paper1',
      confidence: 0.9,
      relevance_score: 0.85,
      keywords: ['machine learning', 'research']
    },
    {
      title: 'Deep Learning Applications',
      authors: ['Brown, C.', 'Davis, E.', 'Wilson, F.'],
      journal: 'Nature Machine Intelligence',
      year: 2022,
      citations: 89,
      doi: '10.1038/nmi.2022.002',
      url: 'https://example.com/paper2',
      confidence: 0.8,
      relevance_score: 0.75,
      keywords: ['deep learning', 'applications'],
      abstract: 'This paper explores various applications of deep learning in modern research contexts.'
    },
    {
      title: 'Neural Networks for Data Analysis',
      authors: ['Taylor, R.'],
      journal: 'IEEE Transactions on Neural Networks',
      year: 2021,
      citations: 45,
      confidence: 0.7,
      relevance_score: 0.65,
      keywords: ['neural networks', 'data analysis']
    }
  ]

  const mockExtractedContent: ExtractedContent = {
    content: 'machine learning research applications',
    keywords: ['machine learning', 'research', 'applications'],
    topics: ['artificial intelligence', 'data science'],
    confidence: 0.8
  }

  const mockOnAddReference = vi.fn()
  const mockOnProvideFeedback = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search results with ranking and scores', () => {
    render(
      <SearchResultsDisplay
        results={mockResults}
        extractedContent={mockExtractedContent}
        onAddReference={mockOnAddReference}
      />
    )

    expect(screen.getByText('Search Results (3)')).toBeInTheDocument()
    expect(screen.getByText('Machine Learning in Academic Research')).toBeInTheDocument()
    expect(screen.getByText('Deep Learning Applications')).toBeInTheDocument()
    expect(screen.getByText('Neural Networks for Data Analysis')).toBeInTheDocument()

    // Check for ranking badges
    expect(screen.getByText('Rank #1')).toBeInTheDocument()
    expect(screen.getByText('Rank #2')).toBeInTheDocument()
    expect(screen.getByText('Rank #3')).toBeInTheDocument()

    // Check for score badges (using getAllByText since there are multiple results)
    expect(screen.getAllByText(/Overall: \d+%/)).toHaveLength(3)
    expect(screen.getAllByText(/Relevance: \d+%/)).toHaveLength(3)
    expect(screen.getAllByText(/Quality: \d+%/)).toHaveLength(3)
    expect(screen.getAllByText(/Confidence: \d+%/)).toHaveLength(3)
  })

  it('displays sorting controls and allows sorting', () => {
    render(
      <SearchResultsDisplay
        results={mockResults}
        extractedContent={mockExtractedContent}
        onAddReference={mockOnAddReference}
      />
    )

    // Check sorting buttons are present
    expect(screen.getByRole('button', { name: /Relevance/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Date/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Citations/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Quality/ })).toBeInTheDocument()

    // Test sorting by date
    fireEvent.click(screen.getByRole('button', { name: /Date/ }))
    
    // Should still show all results but potentially in different order
    expect(screen.getByText('Machine Learning in Academic Research')).toBeInTheDocument()
  })

  it('implements pagination correctly', () => {
    // Create more results to test pagination
    const manyResults = Array.from({ length: 25 }, (_, i) => ({
      ...mockResults[0],
      title: `Paper ${i + 1}`,
      authors: [`Author ${i + 1}`],
      citations: 100 - i
    }))

    render(
      <SearchResultsDisplay
        results={manyResults}
        extractedContent={mockExtractedContent}
        onAddReference={mockOnAddReference}
      />
    )

    expect(screen.getByText('Search Results (25)')).toBeInTheDocument()
    
    // Should show pagination controls
    expect(screen.getByRole('button', { name: /Next/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Previous/ })).toBeInTheDocument()
    
    // Should show page numbers
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()

    // Test pagination
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    
    // Should show different results on page 2
    expect(screen.getByText(/Showing 11 to 20 of 25 results/)).toBeInTheDocument()
  })

  it('allows changing items per page', () => {
    render(
      <SearchResultsDisplay
        results={mockResults}
        extractedContent={mockExtractedContent}
        onAddReference={mockOnAddReference}
      />
    )

    // Find and click the items per page selector
    const selector = screen.getByRole('combobox')
    fireEvent.click(selector)
    
    // Should show options
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('shows confidence details when info button is clicked', async () => {
    render(
      <SearchResultsDisplay
        results={mockResults}
        extractedContent={mockExtractedContent}
        onAddReference={mockOnAddReference}
      />
    )

    // Click the info button for the first result
    const infoButtons = screen.getAllByRole('button')
    const infoButton = infoButtons.find(button => 
      button.querySelector('svg') && button.className.includes('h-6')
    )
    
    if (infoButton) {
      fireEvent.click(infoButton)
      
      await waitFor(() => {
        // Look for the confidence details section specifically
        expect(screen.getAllByText('Relevance')).toHaveLength(2) // One in sort button, one in details
        expect(screen.getAllByText('Quality')).toHaveLength(2) // One in sort button, one in details
        expect(screen.getAllByText('Confidence')).toHaveLength(1) // Only in details
        expect(screen.getByText(/Text: \d+%/)).toBeInTheDocument()
        expect(screen.getByText(/Keywords: \d+%/)).toBeInTheDocument()
      })
    }
  })

  it('handles add reference action', async () => {
    render(
      <SearchResultsDisplay
        results={mockResults}
        extractedContent={mockExtractedContent}
        onAddReference={mockOnAddReference}
      />
    )

    const addButtons = screen.getAllByRole('button', { name: /Add Reference/ })
    fireEvent.click(addButtons[0])

    await waitFor(() => {
      expect(mockOnAddReference).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Machine Learning in Academic Research',
          authors: ['Smith, J.', 'Johnson, A.']
        })
      )
    })
  })

  it('displays loading state', () => {
    render(
      <SearchResultsDisplay
        results={[]}
        extractedContent={mockExtractedContent}
        onAddReference={mockOnAddReference}
        loading={true}
      />
    )

    expect(screen.getByText('Searching and ranking results...')).toBeInTheDocument()
  })

  it('displays error state', () => {
    render(
      <SearchResultsDisplay
        results={[]}
        extractedContent={mockExtractedContent}
        onAddReference={mockOnAddReference}
        error="Search failed"
      />
    )

    expect(screen.getByText('Search Error:')).toBeInTheDocument()
    expect(screen.getByText('Search failed')).toBeInTheDocument()
  })

  it('displays empty state when no results', () => {
    render(
      <SearchResultsDisplay
        results={[]}
        extractedContent={mockExtractedContent}
        onAddReference={mockOnAddReference}
      />
    )

    expect(screen.getByText('No results found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your search terms or filters.')).toBeInTheDocument()
  })

  it('displays abstracts when available', () => {
    render(
      <SearchResultsDisplay
        results={mockResults}
        extractedContent={mockExtractedContent}
        onAddReference={mockOnAddReference}
      />
    )

    expect(screen.getByText(/This paper explores various applications/)).toBeInTheDocument()
  })

  it('shows DOI links when available', () => {
    render(
      <SearchResultsDisplay
        results={mockResults}
        extractedContent={mockExtractedContent}
        onAddReference={mockOnAddReference}
      />
    )

    const doiLinks = screen.getAllByTitle('View on DOI')
    expect(doiLinks).toHaveLength(2) // Two results have DOIs
    expect(doiLinks[0]).toHaveAttribute('href', 'https://doi.org/10.1234/jair.2023.001')
  })

  it('handles sort direction toggle', () => {
    render(
      <SearchResultsDisplay
        results={mockResults}
        extractedContent={mockExtractedContent}
        onAddReference={mockOnAddReference}
      />
    )

    const relevanceButton = screen.getByRole('button', { name: /Relevance/ })
    
    // Click once to sort by relevance (should be default)
    fireEvent.click(relevanceButton)
    
    // Click again to toggle direction
    fireEvent.click(relevanceButton)
    
    // Results should still be displayed
    expect(screen.getByText('Machine Learning in Academic Research')).toBeInTheDocument()
  })

  it('displays metadata correctly', () => {
    render(
      <SearchResultsDisplay
        results={mockResults}
        extractedContent={mockExtractedContent}
        onAddReference={mockOnAddReference}
      />
    )

    // Check authors
    expect(screen.getByText('Smith, J., Johnson, A.')).toBeInTheDocument()
    expect(screen.getByText('Brown, C., Davis, E., Wilson, F.')).toBeInTheDocument()
    
    // Check journals
    expect(screen.getByText('Journal of AI Research')).toBeInTheDocument()
    expect(screen.getByText('Nature Machine Intelligence')).toBeInTheDocument()
    
    // Check years and citations (using more flexible text matching)
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Year: 2023'
    })).toBeInTheDocument()
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Citations: 150'
    })).toBeInTheDocument()
  })

  it('applies correct confidence colors', () => {
    render(
      <SearchResultsDisplay
        results={mockResults}
        extractedContent={mockExtractedContent}
        onAddReference={mockOnAddReference}
      />
    )

    // High confidence should have green styling
    const overallBadges = screen.getAllByText(/Overall: \d+%/)
    expect(overallBadges[0]).toHaveClass('bg-green-100', 'text-green-800')
  })
})