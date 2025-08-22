import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { toast } from 'sonner'
import { ReferenceForm } from '@/components/ui/reference-form'
import { ReferenceType, Reference, ReferenceFormData } from '@/lib/ai-types'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

// Mock fetch for metadata extraction
global.fetch = vi.fn()

describe('ReferenceForm', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  const defaultProps = {
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    isLoading: false
  }

  const sampleReference: Reference = {
    id: '1',
    conversationId: 'conv-1',
    type: ReferenceType.JOURNAL_ARTICLE,
    title: 'Sample Article',
    authors: [{ firstName: 'John', lastName: 'Doe' }],
    publicationDate: new Date('2023-01-01'),
    journal: 'Sample Journal',
    volume: '1',
    issue: '1',
    pages: '1-10',
    url: 'https://example.com',
    doi: '10.1000/182',
    tags: ['research', 'sample'],
    metadataConfidence: 0.9,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Form Rendering', () => {
    it('renders form with default values for new reference', () => {
      render(<ReferenceForm {...defaultProps} />)
      
      expect(screen.getByText(/reference type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add author/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save reference/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('renders form with existing reference data', () => {
      render(<ReferenceForm {...defaultProps} reference={sampleReference} />)
      
      expect(screen.getByDisplayValue('Sample Article')).toBeInTheDocument()
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Sample Journal')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update reference/i })).toBeInTheDocument()
    })

    it('shows loading state when isLoading is true', () => {
      render(<ReferenceForm {...defaultProps} isLoading={true} />)
      
      expect(screen.getByText(/saving/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    })
  })

  describe('Import Mode Selection', () => {
    it('switches between import modes', async () => {
      const user = userEvent.setup()
      render(<ReferenceForm {...defaultProps} />)
      
      // Default should be manual
      expect(screen.getByRole('button', { name: /manual entry/i })).toHaveClass('bg-primary')
      
      // Switch to URL mode
      await user.click(screen.getByRole('button', { name: /url/i }))
      expect(screen.getByPlaceholderText(/enter url/i)).toBeInTheDocument()
      
      // Switch to DOI mode
      await user.click(screen.getByRole('button', { name: /doi/i }))
      expect(screen.getByPlaceholderText(/enter doi/i)).toBeInTheDocument()
    })

    it('shows extraction input for URL and DOI modes', async () => {
      const user = userEvent.setup()
      render(<ReferenceForm {...defaultProps} />)
      
      // Switch to URL mode
      await user.click(screen.getByRole('button', { name: /url/i }))
      expect(screen.getByPlaceholderText(/enter url/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /extract/i })).toBeInTheDocument()
      
      // Switch to DOI mode
      await user.click(screen.getByRole('button', { name: /doi/i }))
      expect(screen.getByPlaceholderText(/enter doi/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /extract/i })).toBeInTheDocument()
    })
  })

  describe('Metadata Extraction', () => {
    it('extracts metadata from URL successfully', async () => {
      const user = userEvent.setup()
      const mockMetadata = {
        success: true,
        metadata: {
          title: 'Extracted Title',
          authors: [{ firstName: 'Jane', lastName: 'Smith' }],
          confidence: 0.8
        }
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetadata)
      } as Response)

      render(<ReferenceForm {...defaultProps} />)
      
      // Switch to URL mode
      await user.click(screen.getByRole('button', { name: /url/i }))
      
      // Enter URL and extract
      await user.type(screen.getByPlaceholderText(/enter url/i), 'https://example.com')
      await user.click(screen.getByRole('button', { name: /extract/i }))
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/referencer/extract-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'https://example.com',
            type: 'url',
            conversationId: ''
          })
        })
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Metadata extracted successfully (confidence: 80%)')
      })
    })

    it('handles metadata extraction failure', async () => {
      const user = userEvent.setup()
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      } as Response)

      render(<ReferenceForm {...defaultProps} />)
      
      // Switch to URL mode
      await user.click(screen.getByRole('button', { name: /url/i }))
      
      // Enter URL and extract
      await user.type(screen.getByPlaceholderText(/enter url/i), 'https://invalid.com')
      await user.click(screen.getByRole('button', { name: /extract/i }))
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to extract metadata: Not Found')
      })
    })

    it('disables extract button when no source is provided', async () => {
      const user = userEvent.setup()
      render(<ReferenceForm {...defaultProps} />)
      
      // Switch to URL mode
      await user.click(screen.getByRole('button', { name: /url/i }))
      
      expect(screen.getByRole('button', { name: /extract/i })).toBeDisabled()
    })
  })

  describe('Form Validation', () => {
    it('validates required fields for journal article', async () => {
      const user = userEvent.setup()
      render(<ReferenceForm {...defaultProps} />)
      
      // Try to submit without required fields
      await user.click(screen.getByRole('button', { name: /save reference/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
        expect(screen.getByText(/at least one author is required/i)).toBeInTheDocument()
        expect(screen.getByText(/journal is required/i)).toBeInTheDocument()
      })
      
      expect(toast.error).toHaveBeenCalledWith('Please fix the validation errors before saving')
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('validates URL format', async () => {
      const user = userEvent.setup()
      render(<ReferenceForm {...defaultProps} />)
      
      // Fill required fields
      await user.type(screen.getByLabelText(/title/i), 'Test Title')
      await user.click(screen.getByRole('button', { name: /add author/i }))
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/journal/i), 'Test Journal')
      
      // Enter invalid URL
      await user.type(screen.getByLabelText(/url/i), 'invalid-url')
      
      await user.click(screen.getByRole('button', { name: /save reference/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument()
      })
    })

    it('validates DOI format', async () => {
      const user = userEvent.setup()
      render(<ReferenceForm {...defaultProps} />)
      
      // Fill required fields
      await user.type(screen.getByLabelText(/title/i), 'Test Title')
      await user.click(screen.getByRole('button', { name: /add author/i }))
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/journal/i), 'Test Journal')
      
      // Enter invalid DOI
      await user.type(screen.getByLabelText(/doi/i), 'invalid-doi')
      
      await user.click(screen.getByRole('button', { name: /save reference/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid doi/i)).toBeInTheDocument()
      })
    })
  })

  describe('Author Management', () => {
    it('adds and removes authors', async () => {
      const user = userEvent.setup()
      render(<ReferenceForm {...defaultProps} />)
      
      // Add first author
      await user.click(screen.getByRole('button', { name: /add author/i }))
      expect(screen.getByText(/author 1/i)).toBeInTheDocument()
      
      // Add second author
      await user.click(screen.getByRole('button', { name: /add author/i }))
      expect(screen.getByText(/author 2/i)).toBeInTheDocument()
      
      // Remove first author
      const removeButtons = screen.getAllByRole('button', { name: '' }) // X buttons
      await user.click(removeButtons[0])
      
      // Should still have one author but renumbered
      expect(screen.getByText(/author 1/i)).toBeInTheDocument()
      expect(screen.queryByText(/author 2/i)).not.toBeInTheDocument()
    })

    it('validates author fields', async () => {
      const user = userEvent.setup()
      render(<ReferenceForm {...defaultProps} />)
      
      // Add author but leave fields empty
      await user.click(screen.getByRole('button', { name: /add author/i }))
      
      // Fill other required fields
      await user.type(screen.getByLabelText(/title/i), 'Test Title')
      await user.type(screen.getByLabelText(/journal/i), 'Test Journal')
      
      await user.click(screen.getByRole('button', { name: /save reference/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/first name and last name are required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Reference Type Specific Fields', () => {
    it('shows journal-specific fields for journal article', async () => {
      render(<ReferenceForm {...defaultProps} />)
      
      // Journal article is default
      expect(screen.getByLabelText(/journal/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/volume/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/issue/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/pages/i)).toBeInTheDocument()
    })

    it('renders with book reference type', async () => {
      const bookReference: Reference = {
        ...sampleReference,
        type: ReferenceType.BOOK,
        publisher: 'Test Publisher'
      }
      
      render(<ReferenceForm {...defaultProps} reference={bookReference} />)
      
      // Should display the reference title
      expect(screen.getByDisplayValue('Sample Article')).toBeInTheDocument()
    })

    it('renders with website reference type', async () => {
      const websiteReference: Reference = {
        ...sampleReference,
        type: ReferenceType.WEBSITE,
        url: 'https://example.com'
      }
      
      render(<ReferenceForm {...defaultProps} reference={websiteReference} />)
      
      // Should display the website reference data
      expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument()
    })
  })

  describe('Tag Management', () => {
    it('adds and removes tags', async () => {
      const user = userEvent.setup()
      render(<ReferenceForm {...defaultProps} />)
      
      const tagInput = screen.getByPlaceholderText(/add tag and press enter/i)
      
      // Add tag
      await user.type(tagInput, 'research')
      await user.keyboard('{Enter}')
      
      expect(screen.getByText('research')).toBeInTheDocument()
      
      // Add another tag
      await user.type(tagInput, 'academic')
      await user.keyboard('{Enter}')
      
      expect(screen.getByText('academic')).toBeInTheDocument()
      
      // Remove tag
      const removeTagButtons = screen.getAllByRole('button', { name: '' })
      await user.click(removeTagButtons[0])
      
      expect(screen.queryByText('research')).not.toBeInTheDocument()
      expect(screen.getByText('academic')).toBeInTheDocument()
    })

    it('prevents duplicate tags', async () => {
      const user = userEvent.setup()
      render(<ReferenceForm {...defaultProps} />)
      
      const tagInput = screen.getByPlaceholderText(/add tag and press enter/i)
      
      // Add tag twice
      await user.type(tagInput, 'research')
      await user.keyboard('{Enter}')
      await user.type(tagInput, 'research')
      await user.keyboard('{Enter}')
      
      // Should only appear once
      const researchTags = screen.getAllByText('research')
      expect(researchTags).toHaveLength(1)
    })
  })

  describe('Form Submission', () => {
    it('submits valid form data', async () => {
      const user = userEvent.setup()
      render(<ReferenceForm {...defaultProps} />)
      
      // Fill required fields
      await user.type(screen.getByLabelText(/title/i), 'Test Article')
      await user.click(screen.getByRole('button', { name: /add author/i }))
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/journal/i), 'Test Journal')
      await user.type(screen.getByLabelText(/publication date/i), '2023-01-01')
      
      await user.click(screen.getByRole('button', { name: /save reference/i }))
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          type: ReferenceType.JOURNAL_ARTICLE,
          title: 'Test Article',
          authors: [{ firstName: 'John', lastName: 'Doe', middleName: '', suffix: '' }],
          publicationDate: '2023-01-01',
          journal: 'Test Journal',
          url: '',
          doi: '',
          volume: '',
          issue: '',
          pages: '',
          publisher: '',
          isbn: '',
          edition: '',
          chapter: '',
          editor: '',
          accessDate: '',
          notes: '',
          tags: []
        })
      })
    })

    it('handles submission errors', async () => {
      const user = userEvent.setup()
      mockOnSave.mockRejectedValueOnce(new Error('Save failed'))
      
      render(<ReferenceForm {...defaultProps} />)
      
      // Fill required fields
      await user.type(screen.getByLabelText(/title/i), 'Test Article')
      await user.click(screen.getByRole('button', { name: /add author/i }))
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/journal/i), 'Test Journal')
      await user.type(screen.getByLabelText(/publication date/i), '2023-01-01')
      
      await user.click(screen.getByRole('button', { name: /save reference/i }))
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Save failed')
      })
    })

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<ReferenceForm {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /cancel/i }))
      
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Real-time Validation', () => {
    it('clears validation errors when fields are corrected', async () => {
      const user = userEvent.setup()
      render(<ReferenceForm {...defaultProps} />)
      
      // Submit to trigger validation errors
      await user.click(screen.getByRole('button', { name: /save reference/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument()
      })
      
      // Fix the title field
      await user.type(screen.getByLabelText(/title/i), 'Test Title')
      
      // Error should be cleared
      expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument()
    })
  })
})