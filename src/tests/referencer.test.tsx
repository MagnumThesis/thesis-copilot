import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Referencer } from '../components/ui/referencer'
import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Referencer Component', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentConversation: {
      title: 'Test Thesis',
      id: 'test-conversation-id'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Basic Rendering', () => {
    it('renders the referencer component correctly', () => {
      render(<Referencer {...mockProps} />)

      expect(screen.getByText('Reference Manager')).toBeInTheDocument()
      expect(screen.getByText('Manage references for "Test Thesis"')).toBeInTheDocument()
      expect(screen.getByText('References')).toBeInTheDocument()
      expect(screen.getByText('Citations')).toBeInTheDocument()
      expect(screen.getByText('Bibliography')).toBeInTheDocument()
    })

    it('displays the current citation style badge', () => {
      render(<Referencer {...mockProps} />)

      expect(screen.getByText('APA')).toBeInTheDocument()
    })

    it('renders global controls', () => {
      render(<Referencer {...mockProps} />)

      expect(screen.getByPlaceholderText('Search references...')).toBeInTheDocument()
      expect(screen.getByText('Add Reference')).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('defaults to references tab', () => {
      render(<Referencer {...mockProps} />)

      expect(screen.getByText('Manage your academic references and sources')).toBeInTheDocument()
    })

    it('switches to citations tab when clicked', () => {
      render(<Referencer {...mockProps} />)

      const citationsTab = screen.getByText('Citations')
      fireEvent.click(citationsTab)

      expect(screen.getByText('Citation Formatter')).toBeInTheDocument()
      expect(screen.getByText('Format citations and insert them into your document')).toBeInTheDocument()
    })

    it('switches to bibliography tab when clicked', () => {
      render(<Referencer {...mockProps} />)

      const bibliographyTab = screen.getByText('Bibliography')
      fireEvent.click(bibliographyTab)

      expect(screen.getByText('Bibliography Generator')).toBeInTheDocument()
      expect(screen.getByText('Generate and export bibliographies in different formats')).toBeInTheDocument()
    })

    it('highlights active tab correctly', () => {
      render(<Referencer {...mockProps} />)

      const referencesTab = screen.getByText('References')
      const citationsTab = screen.getByText('Citations')

      // References should be active by default
      expect(referencesTab.closest('button')).toHaveClass('bg-primary')

      // Click citations tab
      fireEvent.click(citationsTab)

      // Citations should now be active
      expect(citationsTab.closest('button')).toHaveClass('bg-primary')
      expect(referencesTab.closest('button')).not.toHaveClass('bg-primary')
    })
  })

  describe('Citation Style Management', () => {
    it('loads saved citation style from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('MLA')

      render(<Referencer {...mockProps} />)

      expect(localStorageMock.getItem).toHaveBeenCalledWith('referencer-citation-style')
      expect(screen.getByText('MLA')).toBeInTheDocument()
    })

    it('saves citation style changes to localStorage', () => {
      render(<Referencer {...mockProps} />)

      const styleSelect = screen.getByRole('combobox', { name: /citation style/i })
      fireEvent.click(styleSelect)

      const mlaOption = screen.getByText('MLA')
      fireEvent.click(mlaOption)

      expect(localStorageMock.setItem).toHaveBeenCalledWith('referencer-citation-style', 'MLA')
    })

    it('updates citation style badge when changed', () => {
      render(<Referencer {...mockProps} />)

      const styleSelect = screen.getByRole('combobox', { name: /citation style/i })
      fireEvent.click(styleSelect)

      const mlaOption = screen.getByText('MLA')
      fireEvent.click(mlaOption)

      expect(screen.getByText('MLA')).toBeInTheDocument()
    })

    it('ignores invalid citation style from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('INVALID_STYLE')

      render(<Referencer {...mockProps} />)

      // Should default to APA
      expect(screen.getByText('APA')).toBeInTheDocument()
    })
  })

  describe('Search and Filter Functionality', () => {
    it('updates search query state', () => {
      render(<Referencer {...mockProps} />)

      const searchInput = screen.getByPlaceholderText('Search references...')
      fireEvent.change(searchInput, { target: { value: 'test search' } })

      expect(searchInput).toHaveValue('test search')
    })

    it('updates filter type state', () => {
      render(<Referencer {...mockProps} />)

      const filterSelect = screen.getAllByRole('combobox')[0] // First select is filter
      fireEvent.click(filterSelect)

      const bookOption = screen.getByText('Books')
      fireEvent.click(bookOption)

      // The select should show the selected value
      expect(filterSelect).toHaveTextContent('Books')
    })

    it('maintains search and filter state across tab changes', () => {
      render(<Referencer {...mockProps} />)

      const searchInput = screen.getByPlaceholderText('Search references...')
      fireEvent.change(searchInput, { target: { value: 'test search' } })

      const citationsTab = screen.getByText('Citations')
      fireEvent.click(citationsTab)

      const referencesTab = screen.getByText('References')
      fireEvent.click(referencesTab)

      expect(searchInput).toHaveValue('test search')
    })
  })

  describe('Add Reference Functionality', () => {
    it('has add reference button', () => {
      render(<Referencer {...mockProps} />)

      const addButton = screen.getByText('Add Reference')
      expect(addButton).toBeInTheDocument()
    })

    it('add reference button has correct icon', () => {
      render(<Referencer {...mockProps} />)

      const addButton = screen.getByText('Add Reference')
      const plusIcon = addButton.querySelector('svg')
      expect(plusIcon).toBeInTheDocument()
    })
  })

  describe('Sheet Functionality', () => {
    it('calls onClose when sheet is closed', () => {
      render(<Referencer {...mockProps} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(mockProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('renders with correct sheet title and description', () => {
      render(<Referencer {...mockProps} />)

      expect(screen.getByText('Reference Manager')).toBeInTheDocument()
      expect(screen.getByText('Manage references for "Test Thesis"')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for controls', () => {
      render(<Referencer {...mockProps} />)

      expect(screen.getByLabelText(/search references/i)).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /citation style/i })).toBeInTheDocument()
    })

    it('tabs are keyboard accessible', () => {
      render(<Referencer {...mockProps} />)

      const referencesTab = screen.getByText('References')

      referencesTab.focus()
      expect(referencesTab).toHaveFocus()

      fireEvent.keyDown(referencesTab, { key: 'ArrowRight' })
      // Note: Full keyboard navigation testing would require more complex setup
    })
  })

  describe('Responsive Design', () => {
    it('uses responsive sheet sizing', () => {
      render(<Referencer {...mockProps} />)

      const sheetContent = screen.getByRole('dialog')
      expect(sheetContent).toHaveClass('sm:max-w-[900px]')
    })

    it('has scrollable content area', () => {
      render(<Referencer {...mockProps} />)

      // The ScrollArea component should be present
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]')
      expect(scrollArea).toBeInTheDocument()
    })
  })

  describe('Icon Display', () => {
    it('displays correct icons for each tab', () => {
      render(<Referencer {...mockProps} />)

      const referencesTab = screen.getByText('References').closest('button')
      const citationsTab = screen.getByText('Citations').closest('button')
      const bibliographyTab = screen.getByText('Bibliography').closest('button')

      // Check that icons are present (exact icon testing would require more setup)
      expect(referencesTab?.querySelector('svg')).toBeInTheDocument()
      expect(citationsTab?.querySelector('svg')).toBeInTheDocument()
      expect(bibliographyTab?.querySelector('svg')).toBeInTheDocument()
    })

    it('displays main title icon', () => {
      render(<Referencer {...mockProps} />)

      const titleIcon = screen.getByText('Reference Manager').querySelector('svg')
      expect(titleIcon).toBeInTheDocument()
    })
  })

  describe('State Management', () => {
    it('maintains tab state correctly', () => {
      render(<Referencer {...mockProps} />)

      const citationsTab = screen.getByText('Citations')
      fireEvent.click(citationsTab)

      const referencesTab = screen.getByText('References')
      fireEvent.click(referencesTab)

      // Should be back to references content
      expect(screen.getByText('Manage your academic references and sources')).toBeInTheDocument()
    })

    it('handles multiple state updates correctly', () => {
      render(<Referencer {...mockProps} />)

      const searchInput = screen.getByPlaceholderText('Search references...')
      const citationsTab = screen.getByText('Citations')

      fireEvent.change(searchInput, { target: { value: 'test' } })
      fireEvent.click(citationsTab)
      fireEvent.change(searchInput, { target: { value: 'test2' } })

      expect(searchInput).toHaveValue('test2')
    })
  })
})

describe('Referencer Component Integration', () => {
  it('integrates with bibliography controls', () => {
    const props = {
      isOpen: true,
      onClose: vi.fn(),
      currentConversation: { title: 'Test', id: 'test-id' }
    }

    render(<Referencer {...props} />)

    const bibliographyTab = screen.getByText('Bibliography')
    fireEvent.click(bibliographyTab)

    // Should render bibliography controls
    expect(screen.getByText('Bibliography Generator')).toBeInTheDocument()
  })

  it('handles conversation title changes', () => {
    const props = {
      isOpen: true,
      onClose: vi.fn(),
      currentConversation: { title: 'New Thesis Title', id: 'new-id' }
    }

    render(<Referencer {...props} />)

    expect(screen.getByText('Manage references for "New Thesis Title"')).toBeInTheDocument()
  })

  it('handles empty conversation gracefully', () => {
    const props = {
      isOpen: true,
      onClose: vi.fn(),
      currentConversation: { title: '', id: '' }
    }

    render(<Referencer {...props} />)

    expect(screen.getByText('Manage references for ""')).toBeInTheDocument()
  })
})
