/**
 * Search Result Management Component Tests
 * Tests for bookmark, comparison, export, and sharing UI components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchResultBookmark, BookmarkedResultsList } from '../components/ui/search-result-bookmark'
import { SearchResultComparison } from '../components/ui/search-result-comparison'
import { SearchResultExport } from '../components/ui/search-result-export'
import { SearchResultSharing } from '../components/ui/search-result-sharing'
import { ScholarSearchResult, CitationStyle } from '../lib/ai-types'

// Mock data
const mockResult: ScholarSearchResult = {
  title: 'Test Paper Title',
  authors: ['John Doe', 'Jane Smith'],
  journal: 'Test Journal',
  year: 2023,
  citations: 42,
  doi: '10.1234/test.2023.001',
  url: 'https://example.com/paper',
  abstract: 'This is a test abstract for the paper.',
  keywords: ['test', 'research', 'paper'],
  confidence: 0.85,
  relevance_score: 0.92
}

const mockBookmarkedResult = {
  ...mockResult,
  bookmarkId: 'bookmark-123',
  bookmarkedAt: new Date('2023-01-01'),
  tags: ['important', 'research'],
  notes: 'Key paper for my research'
}

const mockComparisonResult = {
  ...mockResult,
  comparisonId: 'comparison-123',
  addedAt: new Date('2023-01-01'),
  relevanceScore: 0.92,
  qualityScore: 0.78,
  confidenceScore: 0.85
}

describe('SearchResultBookmark', () => {
  const mockOnBookmark = vi.fn()
  const mockOnRemoveBookmark = vi.fn()
  const mockOnView = vi.fn()
  const mockOnCompare = vi.fn()
  const mockOnShare = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render bookmark button for unbookmarked result', () => {
    render(
      <SearchResultBookmark
        result={mockResult}
        isBookmarked={false}
        onBookmark={mockOnBookmark}
        onRemoveBookmark={mockOnRemoveBookmark}
      />
    )

    expect(screen.getByText('Bookmark')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bookmark result/i })).toBeInTheDocument()
  })

  it('should render bookmarked state for bookmarked result', () => {
    render(
      <SearchResultBookmark
        result={mockResult}
        isBookmarked={true}
        onBookmark={mockOnBookmark}
        onRemoveBookmark={mockOnRemoveBookmark}
      />
    )

    expect(screen.getByText('Bookmarked')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove bookmark/i })).toBeInTheDocument()
  })

  it('should call onBookmark when bookmark button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchResultBookmark
        result={mockResult}
        isBookmarked={false}
        onBookmark={mockOnBookmark}
        onRemoveBookmark={mockOnRemoveBookmark}
      />
    )

    await user.click(screen.getByRole('button', { name: /bookmark result/i }))
    
    expect(mockOnBookmark).toHaveBeenCalledWith(mockResult)
  })

  it('should call onRemoveBookmark when remove bookmark button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchResultBookmark
        result={mockResult}
        isBookmarked={true}
        onBookmark={mockOnBookmark}
        onRemoveBookmark={mockOnRemoveBookmark}
      />
    )

    await user.click(screen.getByRole('button', { name: /remove bookmark/i }))
    
    expect(mockOnRemoveBookmark).toHaveBeenCalledWith(mockResult)
  })

  it('should render additional action buttons when provided', () => {
    render(
      <SearchResultBookmark
        result={mockResult}
        isBookmarked={false}
        onBookmark={mockOnBookmark}
        onRemoveBookmark={mockOnRemoveBookmark}
        onView={mockOnView}
        onCompare={mockOnCompare}
        onShare={mockOnShare}
      />
    )

    expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add to comparison/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /share result/i })).toBeInTheDocument()
  })

  it('should disable buttons when disabled prop is true', () => {
    render(
      <SearchResultBookmark
        result={mockResult}
        isBookmarked={false}
        onBookmark={mockOnBookmark}
        onRemoveBookmark={mockOnRemoveBookmark}
        disabled={true}
      />
    )

    expect(screen.getByRole('button', { name: /bookmark result/i })).toBeDisabled()
  })
})

describe('BookmarkedResultsList', () => {
  const mockOnRemoveBookmark = vi.fn()
  const mockOnView = vi.fn()
  const mockOnCompare = vi.fn()
  const mockOnShare = vi.fn()
  const mockOnAddReference = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render empty state when no bookmarks', () => {
    render(
      <BookmarkedResultsList
        bookmarkedResults={[]}
        onRemoveBookmark={mockOnRemoveBookmark}
      />
    )

    expect(screen.getByText('No bookmarked results')).toBeInTheDocument()
    expect(screen.getByText('Bookmark search results to save them for later.')).toBeInTheDocument()
  })

  it('should render bookmarked results', () => {
    render(
      <BookmarkedResultsList
        bookmarkedResults={[mockBookmarkedResult]}
        onRemoveBookmark={mockOnRemoveBookmark}
      />
    )

    expect(screen.getByText('Bookmarked Results (1)')).toBeInTheDocument()
    expect(screen.getByText(mockBookmarkedResult.title)).toBeInTheDocument()
    expect(screen.getByText('John Doe, Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('important')).toBeInTheDocument()
    expect(screen.getByText('research')).toBeInTheDocument()
  })

  it('should display bookmark metadata', () => {
    render(
      <BookmarkedResultsList
        bookmarkedResults={[mockBookmarkedResult]}
        onRemoveBookmark={mockOnRemoveBookmark}
      />
    )

    expect(screen.getByText('Key paper for my research')).toBeInTheDocument()
    expect(screen.getByText(/Bookmarked: 1\/1\/2023/)).toBeInTheDocument()
  })
})

describe('SearchResultComparison', () => {
  const mockOnRemoveFromComparison = vi.fn()
  const mockOnAddReference = vi.fn()
  const mockOnExportComparison = vi.fn()
  const mockOnShareComparison = vi.fn()
  const mockOnClearComparison = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render empty state when no comparison results', () => {
    render(
      <SearchResultComparison
        comparisonResults={[]}
        onRemoveFromComparison={mockOnRemoveFromComparison}
      />
    )

    expect(screen.getByText('No results selected for comparison')).toBeInTheDocument()
    expect(screen.getByText('Add search results to compare them side-by-side.')).toBeInTheDocument()
  })

  it('should render comparison results', () => {
    render(
      <SearchResultComparison
        comparisonResults={[mockComparisonResult]}
        onRemoveFromComparison={mockOnRemoveFromComparison}
      />
    )

    expect(screen.getByText('Result Comparison (1)')).toBeInTheDocument()
    expect(screen.getByText(mockComparisonResult.title)).toBeInTheDocument()
  })

  it('should display score badges', () => {
    render(
      <SearchResultComparison
        comparisonResults={[mockComparisonResult]}
        onRemoveFromComparison={mockOnRemoveFromComparison}
      />
    )

    expect(screen.getByText('92%')).toBeInTheDocument() // Relevance score
    expect(screen.getByText('78%')).toBeInTheDocument() // Quality score
    expect(screen.getByText('85%')).toBeInTheDocument() // Confidence score
  })

  it('should render action buttons when provided', () => {
    render(
      <SearchResultComparison
        comparisonResults={[mockComparisonResult]}
        onRemoveFromComparison={mockOnRemoveFromComparison}
        onExportComparison={mockOnExportComparison}
        onShareComparison={mockOnShareComparison}
        onClearComparison={mockOnClearComparison}
      />
    )

    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument()
  })
})

describe('SearchResultExport', () => {
  const mockOnExport = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnExport.mockResolvedValue('{"test": "data"}')
  })

  it('should render export form', () => {
    render(
      <SearchResultExport
        results={[mockResult]}
        onExport={mockOnExport}
      />
    )

    expect(screen.getByText('Export Search Results (1 results)')).toBeInTheDocument()
    expect(screen.getByText('Export Format')).toBeInTheDocument()
    expect(screen.getByText('Include in Export')).toBeInTheDocument()
  })

  it('should render format options', () => {
    render(
      <SearchResultExport
        results={[mockResult]}
        onExport={mockOnExport}
      />
    )

    fireEvent.click(screen.getByRole('combobox'))
    
    expect(screen.getByText('JSON - Structured data')).toBeInTheDocument()
    expect(screen.getByText('CSV - Spreadsheet format')).toBeInTheDocument()
    expect(screen.getByText('BibTeX - LaTeX citations')).toBeInTheDocument()
  })

  it('should show citation style selector for appropriate formats', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchResultExport
        results={[mockResult]}
        onExport={mockOnExport}
      />
    )

    // Change to BibTeX format
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('BibTeX - LaTeX citations'))
    
    expect(screen.getByText('Citation Style')).toBeInTheDocument()
  })

  it('should call onExport when generate button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchResultExport
        results={[mockResult]}
        onExport={mockOnExport}
      />
    )

    await user.click(screen.getByRole('button', { name: /generate json export/i }))
    
    expect(mockOnExport).toHaveBeenCalledWith([mockResult], expect.objectContaining({
      format: 'json',
      includeScores: true,
      includeAbstracts: true
    }))
  })

  it('should show export preview after generation', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchResultExport
        results={[mockResult]}
        onExport={mockOnExport}
      />
    )

    await user.click(screen.getByRole('button', { name: /generate json export/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Export Preview')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /download file/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /copy to clipboard/i })).toBeInTheDocument()
    })
  })
})

describe('SearchResultSharing', () => {
  const mockOnShare = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnShare.mockResolvedValue({
      id: 'share-123',
      results: [mockResult],
      shareOptions: {
        shareType: 'link',
        includeScores: true,
        includeAbstracts: true,
        includePersonalNotes: false
      },
      shareUrl: 'https://example.com/shared/share-123',
      createdAt: new Date(),
      viewCount: 0,
      isActive: true
    })
  })

  it('should render sharing form', () => {
    render(
      <SearchResultSharing
        results={[mockResult]}
        onShare={mockOnShare}
      />
    )

    expect(screen.getByText('Share Search Results (1 results)')).toBeInTheDocument()
    expect(screen.getByText('Share Method')).toBeInTheDocument()
    expect(screen.getByText('Content to Include')).toBeInTheDocument()
  })

  it('should render share method options', () => {
    render(
      <SearchResultSharing
        results={[mockResult]}
        onShare={mockOnShare}
      />
    )

    fireEvent.click(screen.getByRole('combobox'))
    
    expect(screen.getByText('Public Link - Anyone with the link can view')).toBeInTheDocument()
    expect(screen.getByText('Email Share - Send to specific recipients')).toBeInTheDocument()
    expect(screen.getByText('Embed Code - For websites or documents')).toBeInTheDocument()
  })

  it('should show email recipients field for email sharing', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchResultSharing
        results={[mockResult]}
        onShare={mockOnShare}
      />
    )

    // Change to email sharing
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Email Share - Send to specific recipients'))
    
    expect(screen.getByText('Email Recipients')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter email addresses (comma-separated)')).toBeInTheDocument()
  })

  it('should call onShare when share button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchResultSharing
        results={[mockResult]}
        onShare={mockOnShare}
      />
    )

    await user.click(screen.getByRole('button', { name: /share 1 results/i }))
    
    expect(mockOnShare).toHaveBeenCalledWith([mockResult], expect.objectContaining({
      shareType: 'link',
      includeScores: true,
      includeAbstracts: true
    }))
  })

  it('should show success state after sharing', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchResultSharing
        results={[mockResult]}
        onShare={mockOnShare}
      />
    )

    await user.click(screen.getByRole('button', { name: /share 1 results/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Results Shared Successfully')).toBeInTheDocument()
      expect(screen.getByText('Share URL')).toBeInTheDocument()
      expect(screen.getByDisplayValue('https://example.com/shared/share-123')).toBeInTheDocument()
    })
  })

  it('should disable share button when no email recipients for email sharing', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchResultSharing
        results={[mockResult]}
        onShare={mockOnShare}
      />
    )

    // Change to email sharing
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Email Share - Send to specific recipients'))
    
    expect(screen.getByRole('button', { name: /share 1 results/i })).toBeDisabled()
    expect(screen.getByText('Please add at least one email recipient to share via email.')).toBeInTheDocument()
  })
})

// Mock clipboard API for tests
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})

// Mock URL.createObjectURL for download tests
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()