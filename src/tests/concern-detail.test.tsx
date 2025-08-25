import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConcernDetail } from '@/components/ui/concern-detail'
import { ProofreadingConcern, ConcernStatus, ConcernSeverity, ConcernCategory } from '@/lib/ai-types'

describe('ConcernDetail', () => {
  const mockConcern: ProofreadingConcern = {
    id: '1',
    conversationId: 'conv-1',
    category: ConcernCategory.CLARITY,
    severity: ConcernSeverity.HIGH,
    title: 'Unclear sentence structure',
    description: 'This sentence is difficult to understand and needs clarification.',
    location: {
      section: 'Introduction',
      paragraph: 2,
      context: 'The methodology used in this study...'
    },
    suggestions: [
      'Break down complex sentences into simpler ones',
      'Use active voice instead of passive voice',
      'Define technical terms clearly'
    ],
    relatedIdeas: ['idea-1', 'idea-2'],
    status: ConcernStatus.TO_BE_DONE,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }

  const defaultProps = {
    concern: mockConcern,
    onStatusChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render concern title and basic info', () => {
      render(<ConcernDetail {...defaultProps} />)
      
      expect(screen.getByText('Unclear sentence structure')).toBeInTheDocument()
      expect(screen.getByText('high')).toBeInTheDocument()
      expect(screen.getByText('Clarity')).toBeInTheDocument()
      expect(screen.getByText('To be done')).toBeInTheDocument()
    })

    it('should render collapsed by default', () => {
      render(<ConcernDetail {...defaultProps} />)
      
      // Description should not be visible when collapsed
      expect(screen.queryByText(mockConcern.description)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument()
    })

    it('should show chevron right when collapsed', () => {
      render(<ConcernDetail {...defaultProps} />)
      
      const chevronRight = screen.getByTestId('chevron-right') || 
                          document.querySelector('[data-lucide="chevron-right"]')
      expect(chevronRight).toBeInTheDocument()
    })
  })

  describe('Expansion', () => {
    it('should expand when clicked', async () => {
      render(<ConcernDetail {...defaultProps} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText(mockConcern.description)).toBeInTheDocument()
      })
    })

    it('should show chevron down when expanded', async () => {
      render(<ConcernDetail {...defaultProps} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      await waitFor(() => {
        const chevronDown = screen.getByTestId('chevron-down') || 
                           document.querySelector('[data-lucide="chevron-down"]')
        expect(chevronDown).toBeInTheDocument()
      })
    })

    it('should use controlled expansion when provided', () => {
      const onToggleExpanded = vi.fn()
      render(
        <ConcernDetail 
          {...defaultProps} 
          isExpanded={true}
          onToggleExpanded={onToggleExpanded}
        />
      )
      
      expect(screen.getByText(mockConcern.description)).toBeInTheDocument()
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      expect(onToggleExpanded).toHaveBeenCalled()
    })
  })

  describe('Severity Colors', () => {
    it('should apply correct color for CRITICAL severity', () => {
      const criticalConcern = { ...mockConcern, severity: ConcernSeverity.CRITICAL }
      render(<ConcernDetail {...defaultProps} concern={criticalConcern} />)
      
      const severityBadge = screen.getByText('critical')
      expect(severityBadge).toHaveClass('text-red-800')
    })

    it('should apply correct color for HIGH severity', () => {
      render(<ConcernDetail {...defaultProps} />)
      
      const severityBadge = screen.getByText('high')
      expect(severityBadge).toHaveClass('text-orange-800')
    })

    it('should apply correct color for MEDIUM severity', () => {
      const mediumConcern = { ...mockConcern, severity: ConcernSeverity.MEDIUM }
      render(<ConcernDetail {...defaultProps} concern={mediumConcern} />)
      
      const severityBadge = screen.getByText('medium')
      expect(severityBadge).toHaveClass('text-yellow-800')
    })

    it('should apply correct color for LOW severity', () => {
      const lowConcern = { ...mockConcern, severity: ConcernSeverity.LOW }
      render(<ConcernDetail {...defaultProps} concern={lowConcern} />)
      
      const severityBadge = screen.getByText('low')
      expect(severityBadge).toHaveClass('text-blue-800')
    })
  })

  describe('Status Background Colors', () => {
    it('should apply correct background for ADDRESSED status', () => {
      const addressedConcern = { ...mockConcern, status: ConcernStatus.ADDRESSED }
      const { container } = render(<ConcernDetail {...defaultProps} concern={addressedConcern} />)
      
      const concernContainer = container.querySelector('.bg-green-50')
      expect(concernContainer).toBeInTheDocument()
    })

    it('should apply correct background for REJECTED status', () => {
      const rejectedConcern = { ...mockConcern, status: ConcernStatus.REJECTED }
      const { container } = render(<ConcernDetail {...defaultProps} concern={rejectedConcern} />)
      
      const concernContainer = container.querySelector('.bg-red-50')
      expect(concernContainer).toBeInTheDocument()
    })

    it('should apply correct background for TO_BE_DONE status', () => {
      const { container } = render(<ConcernDetail {...defaultProps} />)
      
      const concernContainer = container.querySelector('.bg-yellow-50')
      expect(concernContainer).toBeInTheDocument()
    })
  })

  describe('Expanded Content', () => {
    beforeEach(async () => {
      render(<ConcernDetail {...defaultProps} />)
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      await waitFor(() => {
        expect(screen.getByText(mockConcern.description)).toBeInTheDocument()
      })
    })

    it('should show description when expanded', () => {
      expect(screen.getByText(mockConcern.description)).toBeInTheDocument()
    })

    it('should show location information', () => {
      expect(screen.getByText('Location')).toBeInTheDocument()
      expect(screen.getByText('Section: Introduction')).toBeInTheDocument()
      expect(screen.getByText('Paragraph: 2')).toBeInTheDocument()
      expect(screen.getByText('"The methodology used in this study..."')).toBeInTheDocument()
    })

    it('should show suggestions', () => {
      expect(screen.getByText('Suggestions')).toBeInTheDocument()
      expect(screen.getByText('Break down complex sentences into simpler ones')).toBeInTheDocument()
      expect(screen.getByText('Use active voice instead of passive voice')).toBeInTheDocument()
      expect(screen.getByText('Define technical terms clearly')).toBeInTheDocument()
    })

    it('should show related ideas', () => {
      expect(screen.getByText('Related Ideas')).toBeInTheDocument()
      expect(screen.getByText('idea-1')).toBeInTheDocument()
      expect(screen.getByText('idea-2')).toBeInTheDocument()
    })

    it('should show status action buttons', () => {
      expect(screen.getByText('Mark Addressed')).toBeInTheDocument()
      expect(screen.getByText('Reject')).toBeInTheDocument()
    })
  })

  describe('Status Actions', () => {
    beforeEach(async () => {
      render(<ConcernDetail {...defaultProps} />)
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      await waitFor(() => {
        expect(screen.getByText('Mark Addressed')).toBeInTheDocument()
      })
    })

    it('should call onStatusChange when Mark Addressed is clicked', () => {
      const onStatusChange = vi.fn()
      render(<ConcernDetail {...defaultProps} onStatusChange={onStatusChange} />)
      
      fireEvent.click(screen.getByRole('button'))
      
      waitFor(() => {
        const addressButton = screen.getByText('Mark Addressed')
        fireEvent.click(addressButton)
        expect(onStatusChange).toHaveBeenCalledWith(ConcernStatus.ADDRESSED)
      })
    })

    it('should call onStatusChange when Reject is clicked', () => {
      const onStatusChange = vi.fn()
      render(<ConcernDetail {...defaultProps} onStatusChange={onStatusChange} />)
      
      fireEvent.click(screen.getByRole('button'))
      
      waitFor(() => {
        const rejectButton = screen.getByText('Reject')
        fireEvent.click(rejectButton)
        expect(onStatusChange).toHaveBeenCalledWith(ConcernStatus.REJECTED)
      })
    })

    it('should show Reset button for non-TO_BE_DONE status', async () => {
      const addressedConcern = { ...mockConcern, status: ConcernStatus.ADDRESSED }
      render(<ConcernDetail {...defaultProps} concern={addressedConcern} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText('Reset')).toBeInTheDocument()
      })
    })

    it('should call onStatusChange when Reset is clicked', async () => {
      const onStatusChange = vi.fn()
      const addressedConcern = { ...mockConcern, status: ConcernStatus.ADDRESSED }
      render(<ConcernDetail {...defaultProps} concern={addressedConcern} onStatusChange={onStatusChange} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      await waitFor(() => {
        const resetButton = screen.getByText('Reset')
        fireEvent.click(resetButton)
        expect(onStatusChange).toHaveBeenCalledWith(ConcernStatus.TO_BE_DONE)
      })
    })

    it('should highlight active status button', async () => {
      const addressedConcern = { ...mockConcern, status: ConcernStatus.ADDRESSED }
      render(<ConcernDetail {...defaultProps} concern={addressedConcern} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      await waitFor(() => {
        const addressButton = screen.getByText('Mark Addressed')
        expect(addressButton).toHaveClass('bg-primary') // or similar active class
      })
    })
  })

  describe('Optional Content', () => {
    it('should not show location section when location is not provided', async () => {
      const concernWithoutLocation = { ...mockConcern, location: undefined }
      render(<ConcernDetail {...defaultProps} concern={concernWithoutLocation} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      await waitFor(() => {
        expect(screen.queryByText('Location')).not.toBeInTheDocument()
      })
    })

    it('should not show suggestions section when suggestions are not provided', async () => {
      const concernWithoutSuggestions = { ...mockConcern, suggestions: undefined }
      render(<ConcernDetail {...defaultProps} concern={concernWithoutSuggestions} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      await waitFor(() => {
        expect(screen.queryByText('Suggestions')).not.toBeInTheDocument()
      })
    })

    it('should not show related ideas section when relatedIdeas are not provided', async () => {
      const concernWithoutRelatedIdeas = { ...mockConcern, relatedIdeas: undefined }
      render(<ConcernDetail {...defaultProps} concern={concernWithoutRelatedIdeas} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      await waitFor(() => {
        expect(screen.queryByText('Related Ideas')).not.toBeInTheDocument()
      })
    })
  })

  describe('Category Labels', () => {
    it('should display correct label for ACADEMIC_STYLE category', () => {
      const academicStyleConcern = { ...mockConcern, category: ConcernCategory.ACADEMIC_STYLE }
      render(<ConcernDetail {...defaultProps} concern={academicStyleConcern} />)
      
      expect(screen.getByText('Academic Style')).toBeInTheDocument()
    })

    it('should display correct label for all categories', () => {
      const categories = [
        { category: ConcernCategory.CLARITY, label: 'Clarity' },
        { category: ConcernCategory.COHERENCE, label: 'Coherence' },
        { category: ConcernCategory.STRUCTURE, label: 'Structure' },
        { category: ConcernCategory.CONSISTENCY, label: 'Consistency' },
        { category: ConcernCategory.COMPLETENESS, label: 'Completeness' },
        { category: ConcernCategory.CITATIONS, label: 'Citations' },
        { category: ConcernCategory.GRAMMAR, label: 'Grammar' },
        { category: ConcernCategory.TERMINOLOGY, label: 'Terminology' }
      ]

      categories.forEach(({ category, label }) => {
        const concernWithCategory = { ...mockConcern, category }
        const { unmount } = render(<ConcernDetail {...defaultProps} concern={concernWithCategory} />)
        
        expect(screen.getByText(label)).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for collapsible', () => {
      render(<ConcernDetail {...defaultProps} />)
      
      const trigger = screen.getByRole('button')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('should update ARIA attributes when expanded', async () => {
      render(<ConcernDetail {...defaultProps} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true')
      })
    })

    it('should have proper button roles for status actions', async () => {
      render(<ConcernDetail {...defaultProps} />)
      
      const trigger = screen.getByRole('button')
      fireEvent.click(trigger)
      
      await waitFor(() => {
        const statusButtons = screen.getAllByRole('button')
        expect(statusButtons.length).toBeGreaterThan(1) // Trigger + status buttons
      })
    })
  })
})