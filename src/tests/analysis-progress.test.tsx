import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnalysisProgress } from '@/components/ui/analysis-progress'

describe('AnalysisProgress', () => {
  const defaultProps = {
    isAnalyzing: false,
    progress: 0,
    statusMessage: 'Ready to analyze',
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering States', () => {
    it('should not render when not analyzing and no error or success', () => {
      const { container } = render(<AnalysisProgress {...defaultProps} />)
      
      expect(container.firstChild).toBeNull()
    })

    it('should render when analyzing', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
          progress={50}
          statusMessage="Analyzing content..."
        />
      )
      
      expect(screen.getByText('Analyzing Content')).toBeInTheDocument()
      expect(screen.getByText('Analyzing content...')).toBeInTheDocument()
    })

    it('should render when there is an error', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          error="Network connection failed"
        />
      )
      
      expect(screen.getByText('Analysis Failed')).toBeInTheDocument()
      expect(screen.getByText('Error: Network connection failed')).toBeInTheDocument()
    })

    it('should render when analysis is successful', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          success={true}
          statusMessage="Analysis completed successfully!"
        />
      )
      
      expect(screen.getByText('Analysis Complete')).toBeInTheDocument()
      expect(screen.getByText('Analysis completed successfully!')).toBeInTheDocument()
    })
  })

  describe('Progress Indicator', () => {
    it('should show progress bar when analyzing', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
          progress={75}
        />
      )
      
      expect(screen.getByText('75% complete')).toBeInTheDocument()
      expect(screen.getByText('Please wait...')).toBeInTheDocument()
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })

    it('should not show progress bar when not analyzing', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          error="Some error"
        />
      )
      
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      expect(screen.queryByText('% complete')).not.toBeInTheDocument()
    })

    it('should handle progress values correctly', () => {
      const { rerender } = render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
          progress={0}
        />
      )
      
      expect(screen.getByText('0% complete')).toBeInTheDocument()
      
      rerender(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
          progress={100}
        />
      )
      
      expect(screen.getByText('100% complete')).toBeInTheDocument()
    })
  })

  describe('Analysis Steps', () => {
    it('should show analysis steps when analyzing', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
          progress={30}
        />
      )
      
      expect(screen.getByText('Retrieving content')).toBeInTheDocument()
      expect(screen.getByText('Loading idea definitions')).toBeInTheDocument()
      expect(screen.getByText('Analyzing content structure')).toBeInTheDocument()
      expect(screen.getByText('Generating concerns')).toBeInTheDocument()
      expect(screen.getByText('Finalizing results')).toBeInTheDocument()
    })

    it('should highlight completed steps based on progress', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
          progress={60}
        />
      )
      
      // Steps with progress > threshold should be highlighted
      const retrievingStep = screen.getByText('Retrieving content')
      const loadingStep = screen.getByText('Loading idea definitions')
      const analyzingStep = screen.getByText('Analyzing content structure')
      const generatingStep = screen.getByText('Generating concerns')
      const finalizingStep = screen.getByText('Finalizing results')
      
      expect(retrievingStep).toHaveClass('text-blue-700')
      expect(loadingStep).toHaveClass('text-blue-700')
      expect(analyzingStep).toHaveClass('text-blue-700')
      expect(generatingStep).not.toHaveClass('text-blue-700')
      expect(finalizingStep).not.toHaveClass('text-blue-700')
    })

    it('should show final step as complete when progress is 100%', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
          progress={100}
        />
      )
      
      const finalizingStep = screen.getByText('Finalizing results')
      expect(finalizingStep).toHaveClass('text-green-700')
    })
  })

  describe('Cancel Functionality', () => {
    it('should show cancel button when analyzing', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
        />
      )
      
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should not show cancel button when not analyzing', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          error="Some error"
        />
      )
      
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
    })

    it('should call onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn()
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
          onCancel={onCancel}
        />
      )
      
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)
      
      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error State', () => {
    it('should show error message and styling', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          error="Connection timeout"
        />
      )
      
      expect(screen.getByText('Analysis Failed')).toBeInTheDocument()
      expect(screen.getByText('Error: Connection timeout')).toBeInTheDocument()
      expect(screen.getByText('Please try again or check your connection.')).toBeInTheDocument()
      
      const container = screen.getByText('Analysis Failed').closest('div')?.parentElement
      expect(container).toHaveClass('border-red-200', 'bg-red-50')
    })

    it('should show error action buttons', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          error="Some error"
        />
      )
      
      expect(screen.getByText('Dismiss')).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('should call onCancel when dismiss button is clicked', () => {
      const onCancel = vi.fn()
      render(
        <AnalysisProgress 
          {...defaultProps} 
          error="Some error"
          onCancel={onCancel}
        />
      )
      
      const dismissButton = screen.getByText('Dismiss')
      fireEvent.click(dismissButton)
      
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('should reload page when retry button is clicked', () => {
      // Mock window.location.reload
      const mockReload = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true
      })
      
      render(
        <AnalysisProgress 
          {...defaultProps} 
          error="Some error"
        />
      )
      
      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)
      
      expect(mockReload).toHaveBeenCalledTimes(1)
    })
  })

  describe('Success State', () => {
    it('should show success message and styling', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          success={true}
          statusMessage="Analysis completed!"
        />
      )
      
      expect(screen.getByText('Analysis Complete')).toBeInTheDocument()
      expect(screen.getByText('Analysis completed!')).toBeInTheDocument()
      
      const container = screen.getByText('Analysis Complete').closest('div')?.parentElement
      expect(container).toHaveClass('border-green-200', 'bg-green-50')
    })

    it('should show success action button', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          success={true}
        />
      )
      
      expect(screen.getByText('Close')).toBeInTheDocument()
    })

    it('should call onCancel when close button is clicked', () => {
      const onCancel = vi.fn()
      render(
        <AnalysisProgress 
          {...defaultProps} 
          success={true}
          onCancel={onCancel}
        />
      )
      
      const closeButton = screen.getByText('Close')
      fireEvent.click(closeButton)
      
      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Icons', () => {
    it('should show loading icon when analyzing', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
        />
      )
      
      const loadingIcon = document.querySelector('.animate-spin')
      expect(loadingIcon).toBeInTheDocument()
    })

    it('should show error icon when there is an error', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          error="Some error"
        />
      )
      
      const errorIcon = screen.getByText('Analysis Failed').parentElement?.querySelector('svg')
      expect(errorIcon).toBeInTheDocument()
    })

    it('should show success icon when successful', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          success={true}
        />
      )
      
      const successIcon = screen.getByText('Analysis Complete').parentElement?.querySelector('svg')
      expect(successIcon).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
        />
      )
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      expect(cancelButton).toBeInTheDocument()
    })

    it('should have proper progress bar accessibility', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
          progress={50}
        />
      )
      
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
    })

    it('should have proper color contrast for different states', () => {
      const { rerender } = render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
        />
      )
      
      let statusText = screen.getByText('Analyzing Content')
      expect(statusText).toHaveClass('text-blue-800')
      
      rerender(
        <AnalysisProgress 
          {...defaultProps} 
          error="Some error"
        />
      )
      
      statusText = screen.getByText('Analysis Failed')
      expect(statusText).toHaveClass('text-red-800')
      
      rerender(
        <AnalysisProgress 
          {...defaultProps} 
          success={true}
        />
      )
      
      statusText = screen.getByText('Analysis Complete')
      expect(statusText).toHaveClass('text-green-800')
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative progress values', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
          progress={-10}
        />
      )
      
      expect(screen.getByText('-10% complete')).toBeInTheDocument()
    })

    it('should handle progress values over 100', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
          progress={150}
        />
      )
      
      expect(screen.getByText('150% complete')).toBeInTheDocument()
    })

    it('should handle empty status message', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
          statusMessage=""
        />
      )
      
      expect(screen.getByText('Analyzing Content')).toBeInTheDocument()
    })

    it('should handle multiple states simultaneously', () => {
      render(
        <AnalysisProgress 
          {...defaultProps} 
          isAnalyzing={true}
          error="Some error"
          success={true}
        />
      )
      
      // Error should take precedence
      expect(screen.getByText('Analysis Failed')).toBeInTheDocument()
    })
  })
})