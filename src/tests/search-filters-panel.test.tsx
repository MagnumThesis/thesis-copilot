import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SearchFiltersPanel } from '../components/ui/search-filters-panel'
import { SearchFilters } from '../lib/ai-types'

describe('SearchFiltersPanel', () => {
  const mockOnFiltersChange = vi.fn()
  const mockOnReset = vi.fn()
  const mockOnToggleVisibility = vi.fn()

  const defaultFilters: SearchFilters = {
    sortBy: 'relevance'
  }

  const defaultProps = {
    filters: defaultFilters,
    onFiltersChange: mockOnFiltersChange,
    onReset: mockOnReset,
    isVisible: true,
    onToggleVisibility: mockOnToggleVisibility
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the filters panel when visible', () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      expect(screen.getByText('Search Filters')).toBeInTheDocument()
      expect(screen.getByText('Publication Date Range')).toBeInTheDocument()
      expect(screen.getByText('Authors')).toBeInTheDocument()
      expect(screen.getByText('Journals')).toBeInTheDocument()
      expect(screen.getByText('Minimum Citation Count')).toBeInTheDocument()
      expect(screen.getByText('Maximum Results')).toBeInTheDocument()
      expect(screen.getByText('Sort Results By')).toBeInTheDocument()
    })

    it('should not render filter content when not visible', () => {
      render(<SearchFiltersPanel {...defaultProps} isVisible={false} />)
      
      expect(screen.getByText('Search Filters')).toBeInTheDocument()
      expect(screen.queryByText('Publication Date Range')).not.toBeInTheDocument()
    })

    it('should show active filters count badge', () => {
      const filtersWithActive: SearchFilters = {
        dateRange: { start: 2020, end: 2023 },
        authors: ['Smith'],
        sortBy: 'relevance'
      }

      render(<SearchFiltersPanel {...defaultProps} filters={filtersWithActive} />)
      
      expect(screen.getByText('2 active')).toBeInTheDocument()
    })
  })

  describe('Publication Date Range Filter', () => {
    it('should handle start year input', async () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      const startYearInput = screen.getByLabelText('From Year')
      fireEvent.change(startYearInput, { target: { value: '2020' } })
      
      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          ...defaultFilters,
          dateRange: { start: 2020, end: new Date().getFullYear() }
        })
      })
    })

    it('should handle end year input', async () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      const endYearInput = screen.getByLabelText('To Year')
      fireEvent.change(endYearInput, { target: { value: '2023' } })
      
      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          ...defaultFilters,
          dateRange: { start: 1900, end: 2023 }
        })
      })
    })

    it('should display date range summary when set', () => {
      const filtersWithDateRange: SearchFilters = {
        dateRange: { start: 2020, end: 2023 },
        sortBy: 'relevance'
      }

      render(<SearchFiltersPanel {...defaultProps} filters={filtersWithDateRange} />)
      
      expect(screen.getByText(/Filtering papers published between 2020 and 2023/)).toBeInTheDocument()
    })
  })

  describe('Authors Filter', () => {
    it('should handle authors input', async () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      const authorsInput = screen.getByPlaceholderText(/Enter author names separated by commas/)
      fireEvent.change(authorsInput, { target: { value: 'Smith, Johnson, Brown' } })
      
      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          ...defaultFilters,
          authors: ['Smith', 'Johnson', 'Brown']
        })
      })
    })

    it('should display author badges when authors are set', () => {
      const filtersWithAuthors: SearchFilters = {
        authors: ['Smith', 'Johnson'],
        sortBy: 'relevance'
      }

      render(<SearchFiltersPanel {...defaultProps} filters={filtersWithAuthors} />)
      
      expect(screen.getByText('Smith')).toBeInTheDocument()
      expect(screen.getByText('Johnson')).toBeInTheDocument()
    })

    it('should remove author when badge X is clicked', async () => {
      const filtersWithAuthors: SearchFilters = {
        authors: ['Smith', 'Johnson'],
        sortBy: 'relevance'
      }

      render(<SearchFiltersPanel {...defaultProps} filters={filtersWithAuthors} />)
      
      const removeButtons = screen.getAllByRole('button')
      const smithRemoveButton = removeButtons.find(button => 
        button.closest('.bg-secondary')?.textContent?.includes('Smith')
      )
      
      if (smithRemoveButton) {
        fireEvent.click(smithRemoveButton)
        
        await waitFor(() => {
          expect(mockOnFiltersChange).toHaveBeenCalledWith({
            ...defaultFilters,
            authors: ['Johnson']
          })
        })
      }
    })

    it('should handle empty authors input', () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      const authorsInput = screen.getByPlaceholderText(/Enter author names separated by commas/)
      expect(authorsInput).toHaveValue('')
      
      // Test that the input accepts empty values
      fireEvent.change(authorsInput, { target: { value: '' } })
      expect(authorsInput).toHaveValue('')
    })
  })

  describe('Journals Filter', () => {
    it('should handle journals input', async () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      const journalsInput = screen.getByPlaceholderText(/Enter journal names separated by commas/)
      fireEvent.change(journalsInput, { target: { value: 'Nature, Science, Cell' } })
      
      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          ...defaultFilters,
          journals: ['Nature', 'Science', 'Cell']
        })
      })
    })

    it('should display journal badges when journals are set', () => {
      const filtersWithJournals: SearchFilters = {
        journals: ['Nature', 'Science'],
        sortBy: 'relevance'
      }

      render(<SearchFiltersPanel {...defaultProps} filters={filtersWithJournals} />)
      
      expect(screen.getByText('Nature')).toBeInTheDocument()
      expect(screen.getByText('Science')).toBeInTheDocument()
    })

    it('should remove journal when badge X is clicked', async () => {
      const filtersWithJournals: SearchFilters = {
        journals: ['Nature', 'Science'],
        sortBy: 'relevance'
      }

      render(<SearchFiltersPanel {...defaultProps} filters={filtersWithJournals} />)
      
      const removeButtons = screen.getAllByRole('button')
      const natureRemoveButton = removeButtons.find(button => 
        button.closest('.bg-secondary')?.textContent?.includes('Nature')
      )
      
      if (natureRemoveButton) {
        fireEvent.click(natureRemoveButton)
        
        await waitFor(() => {
          expect(mockOnFiltersChange).toHaveBeenCalledWith({
            ...defaultFilters,
            journals: ['Science']
          })
        })
      }
    })
  })

  describe('Citation Count Filter', () => {
    it('should handle minimum citations input', async () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      const citationsInput = screen.getByLabelText('Minimum Citation Count')
      fireEvent.change(citationsInput, { target: { value: '50' } })
      
      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          ...defaultFilters,
          minCitations: 50
        })
      })
    })

    it('should display citation count summary when set', () => {
      const filtersWithCitations: SearchFilters = {
        minCitations: 25,
        sortBy: 'relevance'
      }

      render(<SearchFiltersPanel {...defaultProps} filters={filtersWithCitations} />)
      
      expect(screen.getByText(/Only showing papers with at least 25 citations/)).toBeInTheDocument()
    })

    it('should handle empty citation input', () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      const citationsInput = screen.getByLabelText('Minimum Citation Count')
      expect(citationsInput).toBeInTheDocument()
      expect(citationsInput).toHaveAttribute('type', 'number')
      
      // Test that the input accepts empty values
      fireEvent.change(citationsInput, { target: { value: '' } })
      expect(citationsInput).toHaveAttribute('value', '')
    })
  })

  describe('Maximum Results Filter', () => {
    it('should render maximum results section', () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      expect(screen.getByText('Maximum Results')).toBeInTheDocument()
      // Check that there are combobox elements (Select components)
      const comboboxes = screen.getAllByRole('combobox')
      expect(comboboxes.length).toBeGreaterThanOrEqual(2) // At least max results and sort by
    })
  })

  describe('Sort Options', () => {
    it('should render sort options section', () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      expect(screen.getByText('Sort Results By')).toBeInTheDocument()
      // Check that there are combobox elements (Select components)
      const comboboxes = screen.getAllByRole('combobox')
      expect(comboboxes.length).toBeGreaterThanOrEqual(2) // At least max results and sort by
    })
  })

  describe('Reset Functionality', () => {
    it('should call onReset when reset button is clicked', () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      const resetButton = screen.getByText('Reset')
      fireEvent.click(resetButton)
      
      expect(mockOnReset).toHaveBeenCalled()
    })

    it('should reset filters to default values', async () => {
      const filtersWithValues: SearchFilters = {
        dateRange: { start: 2020, end: 2023 },
        authors: ['Smith'],
        journals: ['Nature'],
        minCitations: 50,
        maxResults: 25,
        sortBy: 'date'
      }

      render(<SearchFiltersPanel {...defaultProps} filters={filtersWithValues} />)
      
      const resetButton = screen.getByText('Reset')
      fireEvent.click(resetButton)
      
      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          sortBy: 'relevance'
        })
      })
    })
  })

  describe('Visibility Toggle', () => {
    it('should call onToggleVisibility when show/hide button is clicked', () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      const toggleButton = screen.getByText('Hide')
      fireEvent.click(toggleButton)
      
      expect(mockOnToggleVisibility).toHaveBeenCalled()
    })

    it('should show correct button text based on visibility', () => {
      const { rerender } = render(<SearchFiltersPanel {...defaultProps} isVisible={true} />)
      expect(screen.getByText('Hide')).toBeInTheDocument()
      
      rerender(<SearchFiltersPanel {...defaultProps} isVisible={false} />)
      expect(screen.getByText('Show')).toBeInTheDocument()
    })
  })

  describe('Active Filters Summary', () => {
    it('should display active filters summary when filters are applied', () => {
      const filtersWithMultiple: SearchFilters = {
        dateRange: { start: 2020, end: 2023 },
        authors: ['Smith', 'Johnson'],
        journals: ['Nature'],
        minCitations: 25,
        maxResults: 100,
        sortBy: 'date'
      }

      render(<SearchFiltersPanel {...defaultProps} filters={filtersWithMultiple} />)
      
      expect(screen.getByText('Active Filters (5)')).toBeInTheDocument()
      expect(screen.getByText('• Publication years: 2020 - 2023')).toBeInTheDocument()
      expect(screen.getByText('• Authors: Smith, Johnson')).toBeInTheDocument()
      expect(screen.getByText('• Journals: Nature')).toBeInTheDocument()
      expect(screen.getByText('• Minimum citations: 25')).toBeInTheDocument()
      expect(screen.getByText('• Maximum results: 100')).toBeInTheDocument()
      expect(screen.getByText('• Sort by: date')).toBeInTheDocument()
    })

    it('should not display summary when no filters are active', () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      expect(screen.queryByText(/Active Filters/)).not.toBeInTheDocument()
    })
  })

  describe('Input Validation', () => {
    it('should handle year input validation', async () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      const startYearInput = screen.getByLabelText('From Year')
      
      // Test minimum year
      fireEvent.change(startYearInput, { target: { value: '1800' } })
      expect(startYearInput).toHaveAttribute('min', '1900')
      
      // Test maximum year
      const currentYear = new Date().getFullYear()
      expect(startYearInput).toHaveAttribute('max', currentYear.toString())
    })

    it('should handle citation count validation', async () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      const citationsInput = screen.getByLabelText('Minimum Citation Count')
      
      expect(citationsInput).toHaveAttribute('type', 'number')
      expect(citationsInput).toHaveAttribute('min', '0')
    })
  })

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      expect(screen.getByLabelText('From Year')).toBeInTheDocument()
      expect(screen.getByLabelText('To Year')).toBeInTheDocument()
      expect(screen.getByLabelText('Authors')).toBeInTheDocument()
      expect(screen.getByLabelText('Journals')).toBeInTheDocument()
      expect(screen.getByLabelText('Minimum Citation Count')).toBeInTheDocument()
      
      // Check that select components are present
      const comboboxes = screen.getAllByRole('combobox')
      expect(comboboxes.length).toBe(2) // Maximum Results and Sort By selects
    })

    it('should have proper button attributes', () => {
      render(<SearchFiltersPanel {...defaultProps} />)
      
      const resetButton = screen.getByText('Reset')
      expect(resetButton).toHaveAttribute('data-slot', 'button')
      
      const toggleButton = screen.getByText('Hide')
      expect(toggleButton).toHaveAttribute('data-slot', 'button')
    })
  })
})