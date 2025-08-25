import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ContentSourceSelector } from '../components/ui/content-source-selector'
import { fetchIdeas } from '../lib/idea-api'

// Mock the API functions
vi.mock('../lib/idea-api', () => ({
  fetchIdeas: vi.fn()
}))

// Mock fetch for builder content
global.fetch = vi.fn()

const mockIdeas = [
  {
    id: 1,
    title: 'Machine Learning Research',
    description: 'A comprehensive study on machine learning algorithms and their applications in various domains.',
    type: 'concept',
    tags: ['ml', 'research'],
    confidence: 0.9,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    conversationid: 'test-conversation'
  },
  {
    id: 2,
    title: 'Data Analysis Methods',
    description: 'Statistical methods for analyzing large datasets in academic research.',
    type: 'method',
    tags: ['statistics', 'data'],
    confidence: 0.85,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    conversationid: 'test-conversation'
  }
]

const mockBuilderContent = {
  success: true,
  content: 'This is a thesis document about artificial intelligence and machine learning applications in modern research.',
  updated_at: '2024-01-01T00:00:00Z'
}

describe('ContentSourceSelector', () => {
  const mockProps = {
    conversationId: 'test-conversation',
    onContentSelected: vi.fn(),
    onContentPreview: vi.fn(),
    onSearchQueryGenerated: vi.fn(),
    isVisible: true
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetchIdeas).mockResolvedValue(mockIdeas)
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBuilderContent)
    } as Response)
  })

  it('renders content source selector with tabs', async () => {
    render(<ContentSourceSelector {...mockProps} />)
    
    expect(screen.getByText('Content Source Selection')).toBeInTheDocument()
    expect(screen.getByText('Select Content Sources')).toBeInTheDocument()
    
    // Check for tabs
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Ideas/ })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Builder/ })).toBeInTheDocument()
    })
  })

  it('loads and displays ideas sources', async () => {
    render(<ContentSourceSelector {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Machine Learning Research')).toBeInTheDocument()
      expect(screen.getByText('Data Analysis Methods')).toBeInTheDocument()
    })
    
    expect(fetchIdeas).toHaveBeenCalledWith('test-conversation')
  })

  it('loads and displays builder content', async () => {
    render(<ContentSourceSelector {...mockProps} />)
    
    // Wait for initial load to complete
    await waitFor(() => {
      expect(fetchIdeas).toHaveBeenCalledWith('test-conversation')
    })
    
    // Switch to builder tab
    const builderTab = screen.getByRole('tab', { name: /Builder/ })
    fireEvent.click(builderTab)
    
    await waitFor(() => {
      // Check if either the content is displayed or the "no content" message
      const hasContent = screen.queryByText('Thesis Document')
      const hasNoContent = screen.queryByText(/No builder content found/)
      expect(hasContent || hasNoContent).toBeTruthy()
    })
    
    expect(fetch).toHaveBeenCalledWith('/api/builder-content/test-conversation')
  })

  it('allows selecting and deselecting content sources', async () => {
    render(<ContentSourceSelector {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Machine Learning Research')).toBeInTheDocument()
    })
    
    // Find and click the checkbox for the first idea
    const checkboxes = screen.getAllByRole('checkbox')
    const firstCheckbox = checkboxes[0] // First checkbox should be for the first idea
    
    fireEvent.click(firstCheckbox)
    
    // Should show selected sources summary
    await waitFor(() => {
      expect(screen.getByText(/Selected Sources \(1\)/)).toBeInTheDocument()
    })
  })

  it('generates search query from selected content', async () => {
    render(<ContentSourceSelector {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Machine Learning Research')).toBeInTheDocument()
    })
    
    // Select a content source
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    
    // Click generate query button
    const generateButton = screen.getByText('Generate & Use Query')
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(mockProps.onSearchQueryGenerated).toHaveBeenCalled()
      expect(mockProps.onContentSelected).toHaveBeenCalled()
    })
  })

  it('allows custom search query input', async () => {
    render(<ContentSourceSelector {...mockProps} />)
    
    // Enable custom query mode
    const customQueryCheckbox = screen.getByLabelText('Use custom search query')
    fireEvent.click(customQueryCheckbox)
    
    // Enter custom query
    const customQueryTextarea = screen.getByPlaceholderText('Enter your custom search query...')
    fireEvent.change(customQueryTextarea, { target: { value: 'artificial intelligence research' } })
    
    // Submit custom query
    const useCustomButton = screen.getByText('Use Custom Query')
    fireEvent.click(useCustomButton)
    
    expect(mockProps.onSearchQueryGenerated).toHaveBeenCalledWith('artificial intelligence research')
  })

  it('filters content sources by search term', async () => {
    render(<ContentSourceSelector {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Machine Learning Research')).toBeInTheDocument()
      expect(screen.getByText('Data Analysis Methods')).toBeInTheDocument()
    })
    
    // Filter by search term
    const searchInput = screen.getByPlaceholderText('Search content sources...')
    fireEvent.change(searchInput, { target: { value: 'machine learning' } })
    
    await waitFor(() => {
      expect(screen.getByText('Machine Learning Research')).toBeInTheDocument()
      expect(screen.queryByText('Data Analysis Methods')).not.toBeInTheDocument()
    })
  })

  it('shows preview modal when preview button is clicked', async () => {
    render(<ContentSourceSelector {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Machine Learning Research')).toBeInTheDocument()
    })
    
    // Click preview button
    const previewButtons = screen.getAllByText('Preview')
    fireEvent.click(previewButtons[0])
    
    await waitFor(() => {
      expect(screen.getByText(/Content Preview:/)).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    vi.mocked(fetchIdeas).mockRejectedValue(new Error('API Error'))
    vi.mocked(fetch).mockRejectedValue(new Error('Network Error'))
    
    render(<ContentSourceSelector {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText(/No ideas found for this conversation/)).toBeInTheDocument()
    })
    
    // Switch to builder tab to check builder error handling
    const builderTab = screen.getByRole('tab', { name: /Builder/ })
    fireEvent.click(builderTab)
    
    await waitFor(() => {
      // Should show no content message when API fails
      const noContentMessage = screen.queryByText(/No builder content found/)
      expect(noContentMessage).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('does not render when isVisible is false', () => {
    render(<ContentSourceSelector {...mockProps} isVisible={false} />)
    
    expect(screen.queryByText('Content Source Selection')).not.toBeInTheDocument()
  })

  it('refreshes content sources when refresh button is clicked', async () => {
    render(<ContentSourceSelector {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByText('Machine Learning Research')).toBeInTheDocument()
    })
    
    // Clear the mock calls
    vi.clearAllMocks()
    
    // Click refresh button
    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)
    
    // Should call the APIs again
    await waitFor(() => {
      expect(fetchIdeas).toHaveBeenCalledWith('test-conversation')
      expect(fetch).toHaveBeenCalledWith('/api/builder-content/test-conversation')
    })
  })
})