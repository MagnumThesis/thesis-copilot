/**
 * Verification test for concern display and interaction system
 * This test verifies that all core functionality is working correctly
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConcernList } from '@/components/ui/concern-list'
import { ConcernDetail } from '@/components/ui/concern-detail'
import { 
  ProofreadingConcern, 
  ConcernStatus, 
  ConcernSeverity, 
  ConcernCategory 
} from '@/lib/ai-types'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

describe('Concern Display and Interaction System - Verification', () => {
  const mockConcerns: ProofreadingConcern[] = [
    {
      id: '1',
      conversationId: 'conv-1',
      category: ConcernCategory.CLARITY,
      severity: ConcernSeverity.HIGH,
      title: 'Unclear thesis statement',
      description: 'The thesis statement lacks clarity and specificity.',
      location: {
        section: 'Introduction',
        paragraph: 1,
        context: 'This paper explores various aspects...'
      },
      suggestions: [
        'Make the thesis statement more specific',
        'Clearly state your main argument'
      ],
      relatedIdeas: ['idea-1', 'idea-2'],
      status: ConcernStatus.TO_BE_DONE,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      conversationId: 'conv-1',
      category: ConcernCategory.STRUCTURE,
      severity: ConcernSeverity.MEDIUM,
      title: 'Poor paragraph organization',
      description: 'Paragraphs lack logical flow.',
      status: ConcernStatus.ADDRESSED,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-03')
    }
  ]

  describe('Core Functionality Verification', () => {
    it('should display concerns with status indicators', () => {
      const mockProps = {
        concerns: mockConcerns,
        onStatusChange: vi.fn(),
        statusFilter: 'all' as const,
        onFilterChange: vi.fn()
      }

      render(<ConcernList {...mockProps} />)

      // Verify concerns are displayed
      expect(screen.getByText('Unclear thesis statement')).toBeInTheDocument()
      expect(screen.getByText('Poor paragraph organization')).toBeInTheDocument()
      
      // Verify count is displayed
      expect(screen.getByText('2 concerns')).toBeInTheDocument()
      
      // Verify status indicators exist (through severity badges)
      expect(screen.getByText('high')).toBeInTheDocument()
      expect(screen.getByText('medium')).toBeInTheDocument()
    })

    it('should support expandable concern details', () => {
      const mockProps = {
        concern: mockConcerns[0],
        onStatusChange: vi.fn(),
        isExpanded: true,
        onToggleExpanded: vi.fn()
      }

      render(<ConcernDetail {...mockProps} />)

      // Verify basic info is displayed
      expect(screen.getByText('Unclear thesis statement')).toBeInTheDocument()
      expect(screen.getByText('Clarity')).toBeInTheDocument()
      
      // Verify expanded content is shown
      expect(screen.getByText('The thesis statement lacks clarity and specificity.')).toBeInTheDocument()
      expect(screen.getByText('Make the thesis statement more specific')).toBeInTheDocument()
      expect(screen.getByText('Section: Introduction')).toBeInTheDocument()
    })

    it('should provide status update controls', () => {
      const onStatusChange = vi.fn()
      const mockProps = {
        concern: mockConcerns[0],
        onStatusChange,
        isExpanded: true,
        onToggleExpanded: vi.fn()
      }

      render(<ConcernDetail {...mockProps} />)

      // Verify status action buttons exist
      const addressedButton = screen.getByText('Mark Addressed')
      const rejectButton = screen.getByText('Reject')
      
      expect(addressedButton).toBeInTheDocument()
      expect(rejectButton).toBeInTheDocument()

      // Test status change
      fireEvent.click(addressedButton)
      expect(onStatusChange).toHaveBeenCalledWith(ConcernStatus.ADDRESSED)
    })

    it('should support filtering by status', () => {
      const onFilterChange = vi.fn()
      const mockProps = {
        concerns: mockConcerns,
        onStatusChange: vi.fn(),
        statusFilter: ConcernStatus.TO_BE_DONE,
        onFilterChange
      }

      render(<ConcernList {...mockProps} />)

      // Should show only TO_BE_DONE concerns (1 out of 2)
      expect(screen.getByText('1 concern')).toBeInTheDocument()
      expect(screen.getByText('Unclear thesis statement')).toBeInTheDocument()
      expect(screen.queryByText('Poor paragraph organization')).not.toBeInTheDocument()
    })

    it('should provide comprehensive filtering options', () => {
      const mockProps = {
        concerns: mockConcerns,
        onStatusChange: vi.fn(),
        statusFilter: 'all' as const,
        onFilterChange: vi.fn()
      }

      render(<ConcernList {...mockProps} />)

      // Verify filter controls exist
      const comboboxes = screen.getAllByRole('combobox')
      expect(comboboxes.length).toBeGreaterThanOrEqual(3) // Status, Category, Severity filters

      // Verify expand/collapse controls
      expect(screen.getByText('Expand All')).toBeInTheDocument()
      expect(screen.getByText('Collapse All')).toBeInTheDocument()
    })

    it('should show summary statistics', () => {
      const mockProps = {
        concerns: mockConcerns,
        onStatusChange: vi.fn(),
        statusFilter: 'all' as const,
        onFilterChange: vi.fn()
      }

      render(<ConcernList {...mockProps} />)

      // Verify summary statistics are displayed
      expect(screen.getByText('Pending')).toBeInTheDocument()
      expect(screen.getByText('Addressed')).toBeInTheDocument()
      expect(screen.getByText('Rejected')).toBeInTheDocument()
    })

    it('should handle visual feedback for different concern states', () => {
      const addressedConcern = { ...mockConcerns[0], status: ConcernStatus.ADDRESSED }
      const mockProps = {
        concern: addressedConcern,
        onStatusChange: vi.fn(),
        isExpanded: false,
        onToggleExpanded: vi.fn()
      }

      render(<ConcernDetail {...mockProps} />)

      // Verify the concern has appropriate styling for addressed status
      const concernElement = screen.getByText('Unclear thesis statement').closest('div')
      expect(concernElement).toHaveClass('bg-green-50')
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete concern management workflow', () => {
      const onStatusChange = vi.fn()
      const onFilterChange = vi.fn()
      
      const mockProps = {
        concerns: mockConcerns,
        onStatusChange,
        statusFilter: 'all' as const,
        onFilterChange
      }

      render(<ConcernList {...mockProps} />)

      // 1. Verify all concerns are visible initially
      expect(screen.getByText('2 concerns')).toBeInTheDocument()

      // 2. Test expand all functionality
      const expandAllButton = screen.getByText('Expand All')
      fireEvent.click(expandAllButton)

      // Should expand concerns (verify by checking for description text)
      expect(screen.getByText('The thesis statement lacks clarity and specificity.')).toBeInTheDocument()

      // 3. Test quick filter actions
      const pendingButton = screen.getByText('Pending')
      fireEvent.click(pendingButton)
      
      expect(onFilterChange).toHaveBeenCalledWith(ConcernStatus.TO_BE_DONE)
    })

    it('should handle empty states gracefully', () => {
      const mockProps = {
        concerns: [],
        onStatusChange: vi.fn(),
        statusFilter: 'all' as const,
        onFilterChange: vi.fn()
      }

      render(<ConcernList {...mockProps} />)

      expect(screen.getByText('0 concerns')).toBeInTheDocument()
      expect(screen.getByText('No concerns found. Run an analysis to get started.')).toBeInTheDocument()
    })
  })
})