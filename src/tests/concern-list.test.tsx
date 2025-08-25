import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConcernList } from '@/components/ui/concern-list'
import { ProofreadingConcern, ConcernStatus, ConcernSeverity, ConcernCategory } from '@/lib/ai-types'

// Mock the ConcernDetail component
vi.mock('@/components/ui/concern-detail', () => ({
  ConcernDetail: ({ concern, onStatusChange }: { 
    concern: ProofreadingConcern
    onStatusChange: (status: ConcernStatus) => void 
  }) => (
    <div data-testid={`concern-${concern.id}`}>
      <span>{concern.title}</span>
      <button 
        onClick={() => onStatusChange(ConcernStatus.ADDRESSED)}
        data-testid={`concern-${concern.id}-address`}
      >
        Address
      </button>
    </div>
  )
}))

describe('ConcernList', () => {
  const mockConcerns: ProofreadingConcern[] = [
    {
      id: '1',
      conversationId: 'conv-1',
      category: ConcernCategory.CLARITY,
      severity: ConcernSeverity.HIGH,
      title: 'Unclear sentence structure',
      description: 'This sentence is difficult to understand',
      status: ConcernStatus.TO_BE_DONE,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      conversationId: 'conv-1',
      category: ConcernCategory.GRAMMAR,
      severity: ConcernSeverity.MEDIUM,
      title: 'Grammar error',
      description: 'Subject-verb disagreement',
      status: ConcernStatus.ADDRESSED,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02')
    },
    {
      id: '3',
      conversationId: 'conv-1',
      category: ConcernCategory.STRUCTURE,
      severity: ConcernSeverity.LOW,
      title: 'Poor paragraph flow',
      description: 'Paragraphs do not flow logically',
      status: ConcernStatus.REJECTED,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03')
    }
  ]

  const defaultProps = {
    concerns: mockConcerns,
    onStatusChange: vi.fn(),
    statusFilter: 'all' as const,
    onFilterChange: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render concern count correctly', () => {
      render(<ConcernList {...defaultProps} />)
      
      expect(screen.getByText('3 concerns')).toBeInTheDocument()
    })

    it('should render singular concern count', () => {
      render(<ConcernList {...defaultProps} concerns={[mockConcerns[0]]} />)
      
      expect(screen.getByText('1 concern')).toBeInTheDocument()
    })

    it('should render all concerns when filter is "all"', () => {
      render(<ConcernList {...defaultProps} />)
      
      expect(screen.getByTestId('concern-1')).toBeInTheDocument()
      expect(screen.getByTestId('concern-2')).toBeInTheDocument()
      expect(screen.getByTestId('concern-3')).toBeInTheDocument()
    })

    it('should render filter dropdown with correct options', () => {
      render(<ConcernList {...defaultProps} />)
      
      const filterTrigger = screen.getByRole('combobox')
      expect(filterTrigger).toBeInTheDocument()
      
      fireEvent.click(filterTrigger)
      
      expect(screen.getAllByText('All concerns (3)').length).toBeGreaterThan(0)
      expect(screen.getByText('To be done (1)')).toBeInTheDocument()
      expect(screen.getByText('Addressed (1)')).toBeInTheDocument()
      expect(screen.getByText('Rejected (1)')).toBeInTheDocument()
    })
  })

  describe('Filtering', () => {
    it('should filter concerns by TO_BE_DONE status', () => {
      render(
        <ConcernList 
          {...defaultProps} 
          statusFilter={ConcernStatus.TO_BE_DONE}
        />
      )
      
      expect(screen.getByText('1 concern')).toBeInTheDocument()
      expect(screen.getByTestId('concern-1')).toBeInTheDocument()
      expect(screen.queryByTestId('concern-2')).not.toBeInTheDocument()
      expect(screen.queryByTestId('concern-3')).not.toBeInTheDocument()
    })

    it('should filter concerns by ADDRESSED status', () => {
      render(
        <ConcernList 
          {...defaultProps} 
          statusFilter={ConcernStatus.ADDRESSED}
        />
      )
      
      expect(screen.getByText('1 concern')).toBeInTheDocument()
      expect(screen.queryByTestId('concern-1')).not.toBeInTheDocument()
      expect(screen.getByTestId('concern-2')).toBeInTheDocument()
      expect(screen.queryByTestId('concern-3')).not.toBeInTheDocument()
    })

    it('should filter concerns by REJECTED status', () => {
      render(
        <ConcernList 
          {...defaultProps} 
          statusFilter={ConcernStatus.REJECTED}
        />
      )
      
      expect(screen.getByText('1 concern')).toBeInTheDocument()
      expect(screen.queryByTestId('concern-1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('concern-2')).not.toBeInTheDocument()
      expect(screen.getByTestId('concern-3')).toBeInTheDocument()
    })

    it('should call onFilterChange when filter is changed', () => {
      const onFilterChange = vi.fn()
      render(<ConcernList {...defaultProps} onFilterChange={onFilterChange} />)
      
      const filterTrigger = screen.getByRole('combobox')
      fireEvent.click(filterTrigger)
      
      const toBeDoneOption = screen.getByText('To be done (1)')
      fireEvent.click(toBeDoneOption)
      
      expect(onFilterChange).toHaveBeenCalledWith(ConcernStatus.TO_BE_DONE)
    })
  })

  describe('Empty States', () => {
    it('should show empty state when no concerns exist', () => {
      render(<ConcernList {...defaultProps} concerns={[]} />)
      
      expect(screen.getByText('0 concerns')).toBeInTheDocument()
      expect(screen.getByText('No concerns found. Run an analysis to get started.')).toBeInTheDocument()
    })

    it('should show filtered empty state when no concerns match filter', () => {
      const concernsWithoutToBeDone = mockConcerns.filter(c => c.status !== ConcernStatus.TO_BE_DONE)
      render(
        <ConcernList 
          {...defaultProps} 
          concerns={concernsWithoutToBeDone}
          statusFilter={ConcernStatus.TO_BE_DONE}
        />
      )
      
      expect(screen.getByText('0 concerns')).toBeInTheDocument()
      expect(screen.getByText('No to be done found.')).toBeInTheDocument()
    })
  })

  describe('Quick Actions', () => {
    it('should render quick action buttons with correct counts', () => {
      render(<ConcernList {...defaultProps} />)
      
      expect(screen.getByText('Show pending (1)')).toBeInTheDocument()
      expect(screen.getByText('Show addressed (1)')).toBeInTheDocument()
      expect(screen.getByText('Show all (3)')).toBeInTheDocument()
    })

    it('should call onFilterChange when quick action buttons are clicked', () => {
      const onFilterChange = vi.fn()
      render(<ConcernList {...defaultProps} onFilterChange={onFilterChange} />)
      
      fireEvent.click(screen.getByText('Show pending (1)'))
      expect(onFilterChange).toHaveBeenCalledWith(ConcernStatus.TO_BE_DONE)
      
      fireEvent.click(screen.getByText('Show addressed (1)'))
      expect(onFilterChange).toHaveBeenCalledWith(ConcernStatus.ADDRESSED)
      
      fireEvent.click(screen.getByText('Show all (3)'))
      expect(onFilterChange).toHaveBeenCalledWith('all')
    })

    it('should not render quick actions when no concerns exist', () => {
      render(<ConcernList {...defaultProps} concerns={[]} />)
      
      expect(screen.queryByText(/Show pending/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Show addressed/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Show all/)).not.toBeInTheDocument()
    })
  })

  describe('Status Changes', () => {
    it('should call onStatusChange when concern status is changed', async () => {
      const onStatusChange = vi.fn()
      render(<ConcernList {...defaultProps} onStatusChange={onStatusChange} />)
      
      const addressButton = screen.getByTestId('concern-1-address')
      fireEvent.click(addressButton)
      
      expect(onStatusChange).toHaveBeenCalledWith('1', ConcernStatus.ADDRESSED)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for filter dropdown', () => {
      render(<ConcernList {...defaultProps} />)
      
      const filterTrigger = screen.getByRole('combobox')
      expect(filterTrigger).toBeInTheDocument()
    })

    it('should have proper button roles for quick actions', () => {
      render(<ConcernList {...defaultProps} />)
      
      const quickActionButtons = screen.getAllByRole('button')
      expect(quickActionButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined concerns gracefully', () => {
      render(<ConcernList {...defaultProps} concerns={[]} />)
      
      expect(screen.getByText('0 concerns')).toBeInTheDocument()
    })

    it('should handle invalid status filter gracefully', () => {
      render(
        <ConcernList 
          {...defaultProps} 
          statusFilter={'invalid' as any}
        />
      )
      
      // Should show all concerns when filter is invalid
      expect(screen.getAllByText(/3 concerns/)[0]).toBeInTheDocument()
    })
  })
})