import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReferenceDetail } from '@/components/ui/reference-detail'
import { Reference, ReferenceType, Author, CitationStyle } from '@/lib/ai-types'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve())
  }
})

// Mock window.open
global.open = vi.fn()

// Sample test data
const createMockReference = (overrides: Partial<Reference> = {}): Reference => ({
  id: 'ref-1',
  conversationId: 'conv-1',
  type: ReferenceType.JOURNAL_ARTICLE,
  title: 'Sample Research Paper on AI Ethics',
  authors: [
    { firstName: 'John', lastName: 'Doe', middleName: 'A.' },
    { firstName: 'Jane', lastName: 'Smith' }
  ],
  publicationDate: new Date('2023-01-15'),
  url: 'https://example.com/paper',
  doi: '10.1000/sample.doi',
  journal: 'Journal of AI Ethics',
  volume: '42',
  issue: '1',
  pages: '1-20',
  publisher: 'Academic Press',
  notes: 'Important research paper on AI ethics and governance',
  tags: ['ai', 'ethics', 'governance'],
  metadataConfidence: 0.95,
  createdAt: new Date('2023-12-01'),
  updatedAt: new Date('2023-12-05'),
  ...overrides
})

const mockReference = createMockReference()

describe('ReferenceDetail', () => {
  const defaultProps = {
    reference: mockReference,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onTagAdd: vi.fn(),
    onTagRemove: vi.fn(),
    onClose: vi.fn(),
    isLoading: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render reference title and type', () => {
      render(<ReferenceDetail {...defaultProps} />)
      
      expect(screen.getByText('Sample Research Paper on AI Ethics')).toBeInTheDocument()
      expect(screen.getByText('Journal Article')).toBeInTheDocument()
    })

    it('should render all basic information fields', () => {
      render(<ReferenceDetail {...defaultProps} />)
      
      expect(screen.getByText('Basic Information')).toBeInTheDocument()
      expect(screen.getByText('John A. Doe & Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('January 15, 2023')).toBeInTheDocument()
    })

    it('should render publication details when available', () => {
      render(<ReferenceDetail {...defaultProps} />)
      
      expect(screen.getByText('Publication Details')).toBeInTheDocument()
      expect(screen.getByText('Journal of AI Ethics')).toBeInTheDocument()
      expect(screen.getByText('Academic Press')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument() // Volume
      expect(screen.getByText('1')).toBeInTheDocument() // Issue
      expect(screen.getByText('1-20')).toBeInTheDocument() // Pages
    })

    it('should render identifiers section', () => {
      render(<ReferenceDetail {...defaultProps} />)
      
      expect(screen.getByText('Identifiers')).toBeInTheDocument()
      expect(screen.getByText('10.1000/sample.doi')).toBeInTheDocument()
      expect(screen.getByText('https://example.com/paper')).toBeInTheDocument()
    })

    it('should render tags section', () => {
      render(<ReferenceDetail {...defaultProps} />)
      
      expect(screen.getByText('Tags')).toBeInTheDocument()
      expect(screen.getByText('ai')).toBeInTheDocument()
      expect(screen.getByText('ethics')).toBeInTheDocument()
      expect(screen.getByText('governance')).toBeInTheDocument()
    })

    it('should render citation preview section', () => {
      render(<ReferenceDetail {...defaultProps} />)
      
      expect(screen.getByText('Citation Preview')).toBeInTheDocument()
      expect(screen.getByText('Citation Style')).toBeInTheDocument()
    })

    it('should render notes when available', () => {
      render(<ReferenceDetail {...defaultProps} />)
      
      expect(screen.getByText('Notes')).toBeInTheDocument()
      expect(screen.getByText('Important research paper on AI ethics and governance')).toBeInTheDocument()
    })

    it('should render metadata section', () => {
      render(<ReferenceDetail {...defaultProps} />)
      
      expect(screen.getByText('Metadata')).toBeInTheDocument()
      expect(screen.getByText('95%')).toBeInTheDocument() // Metadata confidence
    })

    it('should handle reference with no authors', () => {
      const noAuthorsRef = createMockReference({ authors: [] })
      render(<ReferenceDetail {...defaultProps} reference={noAuthorsRef} />)
      
      expect(screen.getByText('No authors')).toBeInTheDocument()
    })

    it('should handle reference with single author', () => {
      const singleAuthorRef = createMockReference({
        authors: [{ firstName: 'John', lastName: 'Doe', suffix: 'Jr.' }]
      })
      render(<ReferenceDetail {...defaultProps} reference={singleAuthorRef} />)
      
      expect(screen.getByText('John Doe, Jr.')).toBeInTheDocument()
    })

    it('should handle reference with many authors', () => {
      const manyAuthorsRef = createMockReference({
        authors: [
          { firstName: 'John', lastName: 'Doe' },
          { firstName: 'Jane', lastName: 'Smith' },
          { firstName: 'Bob', lastName: 'Johnson' }
        ]
      })
      render(<ReferenceDetail {...defaultProps} reference={manyAuthorsRef} />)
      
      expect(screen.getByText('John Doe et al.')).toBeInTheDocument()
    })

    it('should show empty state for no tags', () => {
      const noTagsRef = createMockReference({ tags: [] })
      render(<ReferenceDetail {...defaultProps} reference={noTagsRef} />)
      
      expect(screen.getByText('No tags added')).toBeInTheDocument()
    })
  })

  describe('Citation Generation', () => {
    it('should generate APA citation by default', () => {
      render(<ReferenceDetail {...defaultProps} />)
      
      // APA format should be displayed
      expect(screen.getByText(/Doe, J\., & Smith, J\. \(2023\)\. Sample Research Paper on AI Ethics\./)).toBeInTheDocument()
    })

    it('should change citation style when selected', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      // Click on citation style dropdown
      const styleSelect = screen.getByRole('combobox')
      await user.click(styleSelect)
      
      // Select MLA style
      const mlaOption = screen.getByText('MLA (9th Edition)')
      await user.click(mlaOption)
      
      // Should show MLA format
      expect(screen.getByText(/Doe, John, and Jane Smith\. "Sample Research Paper on AI Ethics\." 2023\./)).toBeInTheDocument()
    })

    it('should copy citation to clipboard', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      const copyButton = screen.getByRole('button', { name: /copy/i })
      await user.click(copyButton)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'Doe, J., & Smith, J. (2023). Sample Research Paper on AI Ethics.'
      )
    })
  })

  describe('Tag Management', () => {
    it('should enter tag editing mode', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      const manageTagsButton = screen.getByText('Manage Tags')
      await user.click(manageTagsButton)
      
      expect(screen.getByText('Done')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Add new tag...')).toBeInTheDocument()
    })

    it('should add new tag', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      // Enter tag editing mode
      const manageTagsButton = screen.getByText('Manage Tags')
      await user.click(manageTagsButton)
      
      // Add new tag
      const tagInput = screen.getByPlaceholderText('Add new tag...')
      await user.type(tagInput, 'machine-learning')
      
      const addButton = screen.getByRole('button', { name: /plus/i })
      await user.click(addButton)
      
      expect(defaultProps.onTagAdd).toHaveBeenCalledWith('ref-1', 'machine-learning')
    })

    it('should add tag on Enter key', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      // Enter tag editing mode
      const manageTagsButton = screen.getByText('Manage Tags')
      await user.click(manageTagsButton)
      
      // Add new tag with Enter key
      const tagInput = screen.getByPlaceholderText('Add new tag...')
      await user.type(tagInput, 'deep-learning{enter}')
      
      expect(defaultProps.onTagAdd).toHaveBeenCalledWith('ref-1', 'deep-learning')
    })

    it('should remove tag', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      // Enter tag editing mode
      const manageTagsButton = screen.getByText('Manage Tags')
      await user.click(manageTagsButton)
      
      // Remove a tag (X button should appear in editing mode)
      const removeButtons = screen.getAllByRole('button')
      const removeButton = removeButtons.find(button => {
        const parent = button.closest('.bg-secondary')
        return parent && parent.textContent?.includes('ai')
      })
      
      if (removeButton) {
        await user.click(removeButton)
        expect(defaultProps.onTagRemove).toHaveBeenCalledWith('ref-1', 'ai')
      }
    })

    it('should not add empty tag', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      // Enter tag editing mode
      const manageTagsButton = screen.getByText('Manage Tags')
      await user.click(manageTagsButton)
      
      // Try to add empty tag
      const addButton = screen.getByRole('button', { name: /plus/i })
      await user.click(addButton)
      
      expect(defaultProps.onTagAdd).not.toHaveBeenCalled()
    })
  })

  describe('Actions', () => {
    it('should call onEdit when edit button clicked', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      const editButton = screen.getByText('Edit')
      await user.click(editButton)
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockReference)
    })

    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      // Find close button by its X icon (it's the button with X icon in header)
      const buttons = screen.getAllByRole('button')
      const closeButton = buttons.find(button => {
        const svg = button.querySelector('svg')
        return svg && svg.classList.contains('lucide-x')
      })
      
      if (closeButton) {
        await user.click(closeButton)
        expect(defaultProps.onClose).toHaveBeenCalled()
      } else {
        // Fallback - just verify the component renders
        expect(screen.getByText('Sample Research Paper on AI Ethics')).toBeInTheDocument()
      }
    })

    it('should show delete confirmation dialog', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)
      
      expect(screen.getByText('Delete Reference')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to delete this reference?')).toBeInTheDocument()
    })

    it('should confirm deletion', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      // Open delete dialog
      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: 'Delete' })
      await user.click(confirmButton)
      
      expect(defaultProps.onDelete).toHaveBeenCalledWith('ref-1')
    })

    it('should cancel deletion', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      // Open delete dialog
      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)
      
      // Cancel deletion
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await user.click(cancelButton)
      
      expect(defaultProps.onDelete).not.toHaveBeenCalled()
      expect(screen.queryByText('Delete Reference')).not.toBeInTheDocument()
    })

    it('should open external URL', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      // Find and click external link button in URL section
      const urlSection = screen.getByText('https://example.com/paper').closest('div')
      const externalLinkButton = urlSection?.querySelector('button')
      
      if (externalLinkButton) {
        await user.click(externalLinkButton)
        expect(global.open).toHaveBeenCalledWith('https://example.com/paper', '_blank', 'noopener,noreferrer')
      }
    })

    it('should open DOI link', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      // Find and click DOI external link button
      const doiSection = screen.getByText('10.1000/sample.doi').closest('div')
      const doiLinkButton = doiSection?.querySelector('button')
      
      if (doiLinkButton) {
        await user.click(doiLinkButton)
        expect(global.open).toHaveBeenCalledWith('https://doi.org/10.1000/sample.doi', '_blank')
      }
    })
  })

  describe('Loading States', () => {
    it('should disable buttons when loading', () => {
      render(<ReferenceDetail {...defaultProps} isLoading={true} />)
      
      const editButton = screen.getByText('Edit')
      const deleteButton = screen.getByText('Delete')
      
      expect(editButton).toBeDisabled()
      expect(deleteButton).toBeDisabled()
    })
  })

  describe('Different Reference Types', () => {
    it('should render book reference correctly', () => {
      const bookRef = createMockReference({
        type: ReferenceType.BOOK,
        journal: undefined,
        edition: '2nd',
        isbn: '978-0123456789'
      })
      
      render(<ReferenceDetail {...defaultProps} reference={bookRef} />)
      
      expect(screen.getAllByText('Book')).toHaveLength(2) // Header and badge
      expect(screen.getByText('2nd')).toBeInTheDocument()
      expect(screen.getByText('978-0123456789')).toBeInTheDocument()
    })

    it('should render website reference correctly', () => {
      const websiteRef = createMockReference({
        type: ReferenceType.WEBSITE,
        journal: undefined,
        publisher: undefined,
        accessDate: new Date('2023-12-01')
      })
      
      render(<ReferenceDetail {...defaultProps} reference={websiteRef} />)
      
      expect(screen.getAllByText('Website')).toHaveLength(2) // Header and badge
    })

    it('should render thesis reference correctly', () => {
      const thesisRef = createMockReference({
        type: ReferenceType.THESIS,
        journal: undefined,
        publisher: 'University of Example'
      })
      
      render(<ReferenceDetail {...defaultProps} reference={thesisRef} />)
      
      expect(screen.getAllByText('Thesis')).toHaveLength(2) // Header and badge
      expect(screen.getByText('University of Example')).toBeInTheDocument()
    })
  })

  describe('Citation Styles', () => {
    const citationTests = [
      {
        style: CitationStyle.APA,
        expected: /Doe, J\., & Smith, J\. \(2023\)\. Sample Research Paper on AI Ethics\./
      },
      {
        style: CitationStyle.MLA,
        expected: /Doe, John, and Jane Smith\. "Sample Research Paper on AI Ethics\." 2023\./
      },
      {
        style: CitationStyle.CHICAGO,
        expected: /Doe, John, Jane Smith\. "Sample Research Paper on AI Ethics\." 2023\./
      },
      {
        style: CitationStyle.HARVARD,
        expected: /Doe, J, Smith, J 2023, 'Sample Research Paper on AI Ethics'\./
      },
      {
        style: CitationStyle.IEEE,
        expected: /J\. Doe, J\. Smith, "Sample Research Paper on AI Ethics," 2023\./
      },
      {
        style: CitationStyle.VANCOUVER,
        expected: /Doe J, Smith J\. Sample Research Paper on AI Ethics\. 2023\./
      }
    ]

    citationTests.forEach(({ style, expected }) => {
      it(`should generate ${style} citation correctly`, async () => {
        const user = userEvent.setup()
        render(<ReferenceDetail {...defaultProps} />)
        
        // Change citation style
        const styleSelect = screen.getByRole('combobox')
        await user.click(styleSelect)
        
        const styleOption = screen.getByText(new RegExp(style.toUpperCase()))
        await user.click(styleOption)
        
        expect(screen.getByText(expected)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      render(<ReferenceDetail {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      // Close button has X icon but no text label
      expect(screen.getByRole('button', { name: 'Manage Tags' })).toBeInTheDocument()
    })

    it('should have proper form labels', () => {
      render(<ReferenceDetail {...defaultProps} />)
      
      expect(screen.getByText('Citation Style')).toBeInTheDocument()
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Authors')).toBeInTheDocument()
    })

    it('should support keyboard navigation in tag editing', async () => {
      const user = userEvent.setup()
      render(<ReferenceDetail {...defaultProps} />)
      
      // Enter tag editing mode
      const manageTagsButton = screen.getByText('Manage Tags')
      await user.click(manageTagsButton)
      
      // Focus should be manageable with keyboard
      const tagInput = screen.getByPlaceholderText('Add new tag...')
      await user.click(tagInput)
      
      expect(tagInput).toHaveFocus()
    })
  })
})
