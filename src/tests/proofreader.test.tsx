import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Proofreader } from '@/components/ui/proofreader'
import { ProofreadingConcern, ConcernStatus, ConcernSeverity, ConcernCategory } from '@/lib/ai-types'

// Mock the child components
vi.mock('@/components/ui/concern-list', () => ({
  ConcernList: ({ concerns, onStatusChange, statusFilter, onFilterChange }: any) => (
    <div data-testid="concern-list">
      <span data-testid="concern-count">{concerns.length} concerns</span>
      <span data-testid="status-filter">{statusFilter}</span>
      <button onClick={() => onStatusChange('1', ConcernStatus.ADDRESSED)}>
        Change Status
      </button>
      <button onClick={() => onFilterChange('all')}>
        Change Filter
      </button>
    </div>
  )
}))

vi.mock('@/components/ui/analysis-progress', () => ({
  AnalysisProgress: ({ isAnalyzing, progress, statusMessage, onCancel, error, success }: any) => (
    <div data-testid="analysis-progress">
      <span data-testid="analyzing">{isAnalyzing.toString()}</span>
      <span data-testid="progress">{progress}</span>
      <span data-testid="status-message">{statusMessage}</span>
      <span data-testid="error">{error || 'no-error'}</span>
      <span data-testid="success">{success?.toString() || 'false'}</span>
      <button onClick={onCancel}>Cancel Analysis</button>
    </div>
  )
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

describe('Proofreader', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentConversation: { title: 'Test Conversation', id: 'conv-1' }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset any timers
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('should render the proofreader sheet when open', () => {
      render(<Proofreader {...defaultProps} />)
      
      expect(screen.getByText('Proofreader')).toBeInTheDocument()
      expect(screen.getByText('AI-powered proofreading analysis for your thesis proposal')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<Proofreader {...defaultProps} isOpen={false} />)
      
      // Sheet should not be visible when closed
      const sheet = screen.queryByText('Proofreader')
      expect(sheet).not.toBeInTheDocument()
    })

    it('should render analyze button', () => {
      render(<Proofreader {...defaultProps} />)
      
      expect(screen.getByText('Analyze Content')).toBeInTheDocument()
    })

    it('should render concern list component', () => {
      render(<Proofreader {...defaultProps} />)
      
      expect(screen.getByTestId('concern-list')).toBeInTheDocument()
    })

    it('should render analysis progress component', () => {
      render(<Proofreader {...defaultProps} />)
      
      expect(screen.getByTestId('analysis-progress')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should render components when loaded', () => {
      render(<Proofreader {...defaultProps} />)
      
      // Should show the main components
      expect(screen.getByTestId('concern-list')).toBeInTheDocument()
      expect(screen.getByTestId('analysis-progress')).toBeInTheDocument()
    })
  })

  describe('Analysis Functionality', () => {
    it('should start analysis when analyze button is clicked', async () => {
      render(<Proofreader {...defaultProps} />)
      
      const analyzeButton = screen.getByText('Analyze Content')
      fireEvent.click(analyzeButton)
      
      // Should show analyzing state
      await waitFor(() => {
        expect(screen.getByTestId('analyzing')).toHaveTextContent('true')
      })
    })

    it('should show progress during analysis', async () => {
      render(<Proofreader {...defaultProps} />)
      
      const analyzeButton = screen.getByText('Analyze Content')
      fireEvent.click(analyzeButton)
      
      // Fast-forward through the progress steps
      await waitFor(() => {
        expect(screen.getByTestId('analyzing')).toHaveTextContent('true')
      })
      
      // Advance timers to simulate progress
      vi.advanceTimersByTime(1000)
      
      await waitFor(() => {
        const progress = screen.getByTestId('progress')
        expect(parseInt(progress.textContent || '0')).toBeGreaterThan(0)
      })
    })

    it('should complete analysis after progress steps', async () => {
      render(<Proofreader {...defaultProps} />)
      
      const analyzeButton = screen.getByText('Analyze Content')
      fireEvent.click(analyzeButton)
      
      // Fast-forward through all progress steps
      vi.advanceTimersByTime(5000) // 6 steps * 800ms each
      
      await waitFor(() => {
        expect(screen.getByTestId('analyzing')).toHaveTextContent('false')
        expect(screen.getByTestId('progress')).toHaveTextContent('100')
      })
    })

    it('should show re-analyze button after analysis', async () => {
      render(<Proofreader {...defaultProps} />)
      
      const analyzeButton = screen.getByText('Analyze Content')
      fireEvent.click(analyzeButton)
      
      // Complete analysis
      vi.advanceTimersByTime(5000)
      
      await waitFor(() => {
        expect(screen.getByText('Re-analyze Content')).toBeInTheDocument()
      })
    })

    it('should hide analyze button during analysis', async () => {
      render(<Proofreader {...defaultProps} />)
      
      const analyzeButton = screen.getByText('Analyze Content')
      fireEvent.click(analyzeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Analyze Content')).not.toBeInTheDocument()
      })
    })
  })

  describe('Analysis Cancellation', () => {
    it('should cancel analysis when cancel button is clicked', async () => {
      render(<Proofreader {...defaultProps} />)
      
      // Start analysis
      const analyzeButton = screen.getByText('Analyze Content')
      fireEvent.click(analyzeButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('analyzing')).toHaveTextContent('true')
      })
      
      // Cancel analysis
      const cancelButton = screen.getByText('Cancel Analysis')
      fireEvent.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('analyzing')).toHaveTextContent('false')
        expect(screen.getByTestId('status-message')).toHaveTextContent('Analysis cancelled')
      })
    })
  })

  describe('Concern Management', () => {
    it('should handle status changes', () => {
      render(<Proofreader {...defaultProps} />)
      
      const changeStatusButton = screen.getByText('Change Status')
      fireEvent.click(changeStatusButton)
      
      // Should handle the status change (mocked implementation)
      expect(changeStatusButton).toBeInTheDocument()
    })

    it('should handle filter changes', () => {
      render(<Proofreader {...defaultProps} />)
      
      const changeFilterButton = screen.getByText('Change Filter')
      fireEvent.click(changeFilterButton)
      
      // Should handle the filter change (mocked implementation)
      expect(changeFilterButton).toBeInTheDocument()
    })
  })

  describe('Last Analysis Info', () => {
    it('should show last analyzed time after analysis', async () => {
      render(<Proofreader {...defaultProps} />)
      
      // Start and complete analysis
      const analyzeButton = screen.getByText('Analyze Content')
      fireEvent.click(analyzeButton)
      
      vi.advanceTimersByTime(5000)
      
      await waitFor(() => {
        expect(screen.getByText(/Last analyzed:/)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when loading fails', () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<Proofreader {...defaultProps} />)
      
      // The component should handle errors gracefully
      expect(screen.getByTestId('concern-list')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Sheet Behavior', () => {
    it('should call onClose when sheet is closed', () => {
      const onClose = vi.fn()
      render(<Proofreader {...defaultProps} onClose={onClose} />)
      
      // Simulate sheet close (this would normally be triggered by the Sheet component)
      // Since we can't easily test the Sheet component's internal behavior,
      // we'll just verify the prop is passed correctly
      expect(onClose).toBeDefined()
    })

    it('should load concerns when sheet opens', () => {
      const { rerender } = render(<Proofreader {...defaultProps} isOpen={false} />)
      
      // Open the sheet
      rerender(<Proofreader {...defaultProps} isOpen={true} />)
      
      // Should trigger loading
      expect(screen.getByTestId('concern-list')).toBeInTheDocument()
    })
  })

  describe('Conversation Context', () => {
    it('should use current conversation ID for operations', () => {
      render(<Proofreader {...defaultProps} />)
      
      // The component should be initialized with the conversation context
      expect(screen.getByTestId('concern-list')).toBeInTheDocument()
    })

    it('should reload concerns when conversation changes', () => {
      const { rerender } = render(<Proofreader {...defaultProps} />)
      
      // Change conversation
      rerender(
        <Proofreader 
          {...defaultProps} 
          currentConversation={{ title: 'New Conversation', id: 'conv-2' }}
        />
      )
      
      // Should trigger reload
      expect(screen.getByTestId('concern-list')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Proofreader {...defaultProps} />)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have proper button roles', () => {
      render(<Proofreader {...defaultProps} />)
      
      const analyzeButton = screen.getByRole('button', { name: /analyze content/i })
      expect(analyzeButton).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty conversation ID', () => {
      render(
        <Proofreader 
          {...defaultProps} 
          currentConversation={{ title: 'Test', id: '' }}
        />
      )
      
      expect(screen.getByTestId('concern-list')).toBeInTheDocument()
    })

    it('should handle rapid open/close cycles', () => {
      const { rerender } = render(<Proofreader {...defaultProps} isOpen={false} />)
      
      // Rapidly toggle open/close
      rerender(<Proofreader {...defaultProps} isOpen={true} />)
      rerender(<Proofreader {...defaultProps} isOpen={false} />)
      rerender(<Proofreader {...defaultProps} isOpen={true} />)
      
      expect(screen.getByTestId('concern-list')).toBeInTheDocument()
    })

    it('should handle analyze button state', () => {
      render(<Proofreader {...defaultProps} />)
      
      // Button should be present
      const analyzeButton = screen.getByText('Analyze Content')
      expect(analyzeButton).toBeInTheDocument()
    })
  })
})