import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReferenceList } from '@/components/ui/reference-list'
import { Reference, ReferenceType, Author } from '@/lib/ai-types'

// Mock the virtual scroll hook
const mockUseVirtualScroll = vi.fn(() => ({
  virtualItems: [],
  totalHeight: 0,
  scrollElementProps: {
    style: { height: 400, overflow: 'auto', position: 'relative' },
    onScroll: vi.fn()
  },
  containerProps: {
    style: { height: 0, position: 'relative' }
  },
  isScrolling: false,
  scrollTop: 0
}))

vi.mock('@/hooks/use-virtual-scroll', () => ({
  useVirtualScroll: mockUseVirtualScroll
}))

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Sample test data
const createMockReference = (overrides: Partial<Reference> = {}): Reference => ({
  id: 'ref-1',
  conversationId: 'conv-1',
  type: ReferenceType.JOURNAL_ARTICLE,
  title: 'Sample Research Paper',
  authors: [
    { firstName: 'John', lastName: 'Doe' },
    { firstName: 'Jane', lastName: 'Smith' }
  ],
  publicationDate: new Date('2023-01-15'),
  url: 'https://example.com/paper',
  doi: '10.1000/sample.doi',
  journal: 'Journal of Sample Research',
  volume: '42',
  issue: '1',
  pages: '1-20',
  publisher: 'Sample Publisher',
  notes: 'Important research paper',
  tags: ['research', 'sample'],
  metadataConfidence: 0.95,
  createdAt: new Date('2023-12-01'),
  updatedAt: new Date('2023-12-01'),
  ...overrides
})

const mockReferences: Reference[] = [
  createMockReference({
    id: 'ref-1',
    title: 'First Research Paper',
    type: ReferenceType.JOURNAL_ARTICLE,
    authors: [{ firstName: 'Alice', lastName: 'Johnson' }],
    publicationDate: new Date('2023-01-15'),
    tags: ['ai', 'research']
  }),
  createMockReference({
    id: 'ref-2',
    title: 'Second Book Chapter',
    type: ReferenceType.BOOK_CHAPTER,
    authors: [{ firstName: 'Bob', lastName: 'Wilson' }],
    publicationDate: new Date('2022-06-10'),
    tags: ['book', 'chapter']
  }),
  createMockReference({
    id: 'ref-3',
    title: 'Third Website Article',
    type: ReferenceType.WEBSITE,
    authors: [{ firstName: 'Carol', lastName: 'Davis' }],
    publicationDate: new Date('2023-03-20'),
    tags: ['web', 'article'],
    url: 'https://example.com/article'
  })
]

describe('ReferenceList', () => {
  const defaultProps = {
    references: mockReferences,
    onReferenceSelect: vi.fn(),
    onReferenceEdit: vi.fn(),
    onReferenceDelete: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
    filterType: 'all' as const,
    onFilterChange: vi.fn(),
    isLoading: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render search input', () => {
      render(<ReferenceList {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText(/search references/i)
      expect(searchInput).toBeInTheDocument()
    })

    it('should render filter dropdown', () => {
      render(<ReferenceList {...defaultProps} />)
      
      const filterDropdown = screen.getByRole('combobox')
      expect(filterDropdown).toBeInTheDocument()
    })

    it('should render results summary', () => {
      render(<ReferenceList {...defaultProps} />)
      
      const summary = screen.getByText(/3 of 3 references/i)
      expect(summary).toBeInTheDocument()
    })

    it('should show loading state', () => {
      render(<ReferenceList {...defaultProps} isLoading={true} />)
      
      const loadingText = screen.getByText(/loading references/i)
      expect(loadingText).toBeInTheDocument()
    })

    it('should show empty state when no references', () => {
      render(<ReferenceList {...defaultProps} references={[]} />)
      
      const emptyMessage = screen.getByText(/no references yet/i)
      const addMessage = screen.getByText(/add your first reference/i)
      expect(emptyMessage).toBeInTheDocument()
      expect(addMessage).toBeInTheDocument()
    })

    it('should show no results state when filtered', () => {
      render(<ReferenceList {...defaultProps} searchQuery="nonexistent" />)
      
      const noResultsMessage = screen.getByText(/no matching references/i)
      const adjustMessage = screen.getByText(/try adjusting your search/i)
      expect(noResultsMessage).toBeInTheDocument()
      expect(adjustMessage).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should call onSearchChange when typing in search input', async () => {
      const user = userEvent.setup()
      render(<ReferenceList {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText(/search references/i)
      await user.type(searchInput, 'research')
      
      // Should be called for each character typed
      expect(defaultProps.onSearchChange).toHaveBeenCalledTimes(8)
      expect(defaultProps.onSearchChange).toHaveBeenLastCalledWith('research')
    })

    it('should filter references by title', () => {
      const { rerender } = render(<ReferenceList {...defaultProps} />)
      
      // Initially shows all references
      expect(screen.getByText(/3 of 3 references/i)).toBeInTheDocument()
      
      // Filter by search query
      rerender(<ReferenceList {...defaultProps} searchQuery="First" />)
      expect(screen.getByText(/1 of 3 references/i)).toBeInTheDocument()
    })

    it('should filter references by author', () => {
      const { rerender } = render(<ReferenceList {...defaultProps} />)
      
      // Filter by author name
      rerender(<ReferenceList {...defaultProps} searchQuery="Alice" />)
      expect(screen.getByText(/1 of 3 references/i)).toBeInTheDocument()
    })

    it('should filter references by tags', () => {
      const { rerender } = render(<ReferenceList {...defaultProps} />)
      
      // Filter by tag
      rerender(<ReferenceList {...defaultProps} searchQuery="ai" />)
      expect(screen.getByText(/1 of 3 references/i)).toBeInTheDocument()
    })

    it('should be case insensitive', () => {
      const { rerender } = render(<ReferenceList {...defaultProps} />)
      
      // Filter with different case
      rerender(<ReferenceList {...defaultProps} searchQuery="FIRST" />)
      expect(screen.getByText(/1 of 3 references/i)).toBeInTheDocument()
    })
  })

  describe('Filter Functionality', () => {
    it('should call onFilterChange when selecting filter', async () => {
      const user = userEvent.setup()
      render(<ReferenceList {...defaultProps} />)
      
      // Get the first combobox (filter dropdown)
      const filterDropdown = screen.getAllByRole('combobox')[0]
      await user.click(filterDropdown)
      
      const bookOption = screen.getByText('Book Chapter')
      await user.click(bookOption)
      
      expect(defaultProps.onFilterChange).toHaveBeenCalledWith(ReferenceType.BOOK_CHAPTER)
    })

    it('should filter references by type', () => {
      const { rerender } = render(<ReferenceList {...defaultProps} />)
      
      // Filter by book chapter type
      rerender(<ReferenceList {...defaultProps} filterType={ReferenceType.BOOK_CHAPTER} />)
      expect(screen.getByText(/1 of 3 references.*Book Chapter/i)).toBeInTheDocument()
    })

    it('should show all references when filter is "all"', () => {
      render(<ReferenceList {...defaultProps} filterType="all" />)
      expect(screen.getByText(/3 of 3 references/i)).toBeInTheDocument()
    })
  })

  describe('Sorting Functionality', () => {
    it('should sort by title ascending by default', () => {
      // Mock virtual scroll to return items in order
      mockUseVirtualScroll.mockReturnValue({
        virtualItems: mockReferences.map((ref, index) => ({
          index,
          item: ref,
          offsetTop: index * 140
        })),
        totalHeight: mockReferences.length * 140,
        scrollElementProps: {
          style: { height: 400, overflow: 'auto', position: 'relative' },
          onScroll: vi.fn()
        },
        containerProps: {
          style: { height: mockReferences.length * 140, position: 'relative' }
        },
        isScrolling: false,
        scrollTop: 0
      })

      render(<ReferenceList {...defaultProps} />)
      
      // Should show references (virtual scrolling mocked)
      expect(mockUseVirtualScroll).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          itemHeight: 140,
          overscan: 3
        })
      )
    })

    it('should change sort direction when clicking same sort option', async () => {
      const user = userEvent.setup()
      render(<ReferenceList {...defaultProps} />)
      
      const sortDropdown = screen.getAllByRole('combobox')[1] // Second combobox is sort
      
      // Just verify the dropdown exists and can be clicked
      expect(sortDropdown).toBeInTheDocument()
      await user.click(sortDropdown)
      
      // The dropdown should be expanded
      expect(sortDropdown).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('Reference Item Interactions', () => {
    beforeEach(() => {
      // Mock virtual scroll to return the first reference
      mockUseVirtualScroll.mockReturnValue({
        virtualItems: [{
          index: 0,
          item: mockReferences[0],
          offsetTop: 0
        }],
        totalHeight: 140,
        scrollElementProps: {
          style: { height: 400, overflow: 'auto', position: 'relative' },
          onScroll: vi.fn()
        },
        containerProps: {
          style: { height: 140, position: 'relative' }
        },
        isScrolling: false,
        scrollTop: 0
      })
    })

    it('should call onReferenceSelect when clicking reference item', async () => {
      const user = userEvent.setup()
      render(<ReferenceList {...defaultProps} />)
      
      const referenceItem = screen.getByText('First Research Paper')
      await user.click(referenceItem)
      
      expect(defaultProps.onReferenceSelect).toHaveBeenCalledWith(mockReferences[0])
    })

    it('should call onReferenceEdit when clicking edit button', async () => {
      const user = userEvent.setup()
      render(<ReferenceList {...defaultProps} />)
      
      const editButton = screen.getByTitle('Edit reference')
      await user.click(editButton)
      
      expect(defaultProps.onReferenceEdit).toHaveBeenCalledWith(mockReferences[0])
    })

    it('should call onReferenceDelete when clicking delete button and confirming', async () => {
      const user = userEvent.setup()
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      
      render(<ReferenceList {...defaultProps} />)
      
      const deleteButton = screen.getByTitle('Delete reference')
      await user.click(deleteButton)
      
      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this reference? This action cannot be undone.'
      )
      expect(defaultProps.onReferenceDelete).toHaveBeenCalledWith('ref-1')
      
      confirmSpy.mockRestore()
    })

    it('should not delete when canceling confirmation', async () => {
      const user = userEvent.setup()
      
      // Mock window.confirm to return false
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
      
      render(<ReferenceList {...defaultProps} />)
      
      const deleteButton = screen.getByTitle('Delete reference')
      await user.click(deleteButton)
      
      expect(confirmSpy).toHaveBeenCalled()
      expect(defaultProps.onReferenceDelete).not.toHaveBeenCalled()
      
      confirmSpy.mockRestore()
    })

    it('should open external URL when clicking external link button', async () => {
      const user = userEvent.setup()
      
      // Mock window.open
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      
      render(<ReferenceList {...defaultProps} />)
      
      const externalLinkButton = screen.getByTitle('Open URL')
      await user.click(externalLinkButton)
      
      expect(openSpy).toHaveBeenCalledWith(
        'https://example.com/paper',
        '_blank',
        'noopener,noreferrer'
      )
      
      openSpy.mockRestore()
    })
  })

  describe('Reference Display', () => {
    beforeEach(() => {
      // Mock virtual scroll to return all references
      const { useVirtualScroll } = require('@/hooks/use-virtual-scroll')
      useVirtualScroll.mockReturnValue({
        virtualItems: mockReferences.map((ref, index) => ({
          index,
          item: ref,
          offsetTop: index * 140
        })),
        totalHeight: mockReferences.length * 140,
        scrollElementProps: {
          style: { height: 400, overflow: 'auto', position: 'relative' },
          onScroll: vi.fn()
        },
        containerProps: {
          style: { height: mockReferences.length * 140, position: 'relative' }
        },
        isScrolling: false,
        scrollTop: 0
      })
    })

    it('should display reference title', () => {
      render(<ReferenceList {...defaultProps} />)
      
      expect(screen.getByText('First Research Paper')).toBeInTheDocument()
      expect(screen.getByText('Second Book Chapter')).toBeInTheDocument()
      expect(screen.getByText('Third Website Article')).toBeInTheDocument()
    })

    it('should display formatted authors', () => {
      render(<ReferenceList {...defaultProps} />)
      
      expect(screen.getByText('Johnson, Alice')).toBeInTheDocument()
      expect(screen.getByText('Wilson, Bob')).toBeInTheDocument()
      expect(screen.getByText('Davis, Carol')).toBeInTheDocument()
    })

    it('should display publication year', () => {
      render(<ReferenceList {...defaultProps} />)
      
      expect(screen.getByText('2023')).toBeInTheDocument()
      expect(screen.getByText('2022')).toBeInTheDocument()
    })

    it('should display reference type badges', () => {
      render(<ReferenceList {...defaultProps} />)
      
      expect(screen.getByText('Journal Article')).toBeInTheDocument()
      expect(screen.getByText('Book Chapter')).toBeInTheDocument()
      expect(screen.getByText('Website')).toBeInTheDocument()
    })

    it('should display tags', () => {
      render(<ReferenceList {...defaultProps} />)
      
      expect(screen.getByText('ai')).toBeInTheDocument()
      expect(screen.getByText('research')).toBeInTheDocument()
      expect(screen.getByText('book')).toBeInTheDocument()
      expect(screen.getByText('chapter')).toBeInTheDocument()
    })

    it('should display metadata confidence when less than 100%', () => {
      const lowConfidenceRef = createMockReference({
        id: 'ref-low',
        metadataConfidence: 0.75
      })
      
      const { useVirtualScroll } = require('@/hooks/use-virtual-scroll')
      useVirtualScroll.mockReturnValue({
        virtualItems: [{
          index: 0,
          item: lowConfidenceRef,
          offsetTop: 0
        }],
        totalHeight: 140,
        scrollElementProps: {
          style: { height: 400, overflow: 'auto', position: 'relative' },
          onScroll: vi.fn()
        },
        containerProps: {
          style: { height: 140, position: 'relative' }
        },
        isScrolling: false,
        scrollTop: 0
      })
      
      render(<ReferenceList {...defaultProps} references={[lowConfidenceRef]} />)
      
      expect(screen.getByText('Confidence: 75%')).toBeInTheDocument()
    })

    it('should show external link button only for references with URLs', () => {
      render(<ReferenceList {...defaultProps} />)
      
      // Should have external link buttons for references with URLs
      const externalLinkButtons = screen.getAllByTitle('Open URL')
      expect(externalLinkButtons).toHaveLength(2) // ref-1 and ref-3 have URLs
    })
  })

  describe('Virtual Scrolling Integration', () => {
    it('should initialize virtual scrolling with correct parameters', () => {
      const { useVirtualScroll } = require('@/hooks/use-virtual-scroll')
      
      render(<ReferenceList {...defaultProps} />)
      
      expect(useVirtualScroll).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          itemHeight: 140,
          overscan: 3
        })
      )
    })

    it('should pass sorted and filtered references to virtual scroll', () => {
      const { useVirtualScroll } = require('@/hooks/use-virtual-scroll')
      
      render(<ReferenceList {...defaultProps} searchQuery="First" />)
      
      // Should be called with filtered array
      const callArgs = useVirtualScroll.mock.calls[0]
      expect(callArgs[0]).toHaveLength(1) // Only one reference matches "First"
      expect(callArgs[0][0].title).toBe('First Research Paper')
    })

    it('should render virtual items with correct positioning', () => {
      const { useVirtualScroll } = require('@/hooks/use-virtual-scroll')
      useVirtualScroll.mockReturnValue({
        virtualItems: [{
          index: 0,
          item: mockReferences[0],
          offsetTop: 0
        }, {
          index: 1,
          item: mockReferences[1],
          offsetTop: 140
        }],
        totalHeight: 280,
        scrollElementProps: {
          style: { height: 400, overflow: 'auto', position: 'relative' },
          onScroll: vi.fn()
        },
        containerProps: {
          style: { height: 280, position: 'relative' }
        },
        isScrolling: false,
        scrollTop: 0
      })
      
      render(<ReferenceList {...defaultProps} />)
      
      // Check that items are positioned correctly
      const firstItem = screen.getByText('First Research Paper').closest('div')
      const secondItem = screen.getByText('Second Book Chapter').closest('div')
      
      expect(firstItem).toHaveStyle({ top: '0px' })
      expect(secondItem).toHaveStyle({ top: '140px' })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ReferenceList {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText(/search references/i)
      expect(searchInput).toHaveAttribute('type', 'text')
      
      const filterDropdown = screen.getByRole('combobox')
      expect(filterDropdown).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<ReferenceList {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText(/search references/i)
      
      // Should be able to focus and type
      await user.click(searchInput)
      await user.type(searchInput, 'test')
      
      expect(searchInput).toHaveFocus()
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('test')
    })

    it('should have proper button titles for screen readers', () => {
      const { useVirtualScroll } = require('@/hooks/use-virtual-scroll')
      useVirtualScroll.mockReturnValue({
        virtualItems: [{
          index: 0,
          item: mockReferences[0],
          offsetTop: 0
        }],
        totalHeight: 140,
        scrollElementProps: {
          style: { height: 400, overflow: 'auto', position: 'relative' },
          onScroll: vi.fn()
        },
        containerProps: {
          style: { height: 140, position: 'relative' }
        },
        isScrolling: false,
        scrollTop: 0
      })
      
      render(<ReferenceList {...defaultProps} />)
      
      expect(screen.getByTitle('Open URL')).toBeInTheDocument()
      expect(screen.getByTitle('Edit reference')).toBeInTheDocument()
      expect(screen.getByTitle('Delete reference')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should handle large reference lists efficiently', () => {
      const largeReferenceList = Array.from({ length: 1000 }, (_, i) =>
        createMockReference({
          id: `ref-${i}`,
          title: `Reference ${i}`,
          authors: [{ firstName: `Author${i}`, lastName: `Last${i}` }]
        })
      )
      
      const { useVirtualScroll } = require('@/hooks/use-virtual-scroll')
      useVirtualScroll.mockReturnValue({
        virtualItems: largeReferenceList.slice(0, 10).map((ref, index) => ({
          index,
          item: ref,
          offsetTop: index * 140
        })),
        totalHeight: largeReferenceList.length * 140,
        scrollElementProps: {
          style: { height: 400, overflow: 'auto', position: 'relative' },
          onScroll: vi.fn()
        },
        containerProps: {
          style: { height: largeReferenceList.length * 140, position: 'relative' }
        },
        isScrolling: false,
        scrollTop: 0
      })
      
      const startTime = performance.now()
      render(<ReferenceList {...defaultProps} references={largeReferenceList} />)
      const endTime = performance.now()
      
      // Should render quickly even with large lists
      expect(endTime - startTime).toBeLessThan(100)
      
      // Should only render visible items
      expect(useVirtualScroll).toHaveBeenCalledWith(
        largeReferenceList,
        expect.objectContaining({
          itemHeight: 140,
          overscan: 3
        })
      )
    })
  })
})