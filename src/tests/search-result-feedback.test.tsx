import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  SearchResultFeedbackComponent, 
  QuickFeedbackButtons,
  SearchResultFeedback 
} from '../components/ui/search-result-feedback'

// Mock the icons
vi.mock('lucide-react', () => ({
  ThumbsUp: () => <div data-testid="thumbs-up-icon" />,
  ThumbsDown: () => <div data-testid="thumbs-down-icon" />,
  Star: ({ className }: { className?: string }) => (
    <div data-testid="star-icon" className={className} />
  ),
  MessageSquare: () => <div data-testid="message-square-icon" />,
  X: () => <div data-testid="x-icon" />,
  Send: () => <div data-testid="send-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />
}))

describe('SearchResultFeedbackComponent', () => {
  const mockProps = {
    resultId: 'test-result-1',
    resultTitle: 'Test Research Paper Title',
    onSubmitFeedback: vi.fn(),
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders quick feedback buttons initially', () => {
    render(<SearchResultFeedbackComponent {...mockProps} />)
    
    expect(screen.getByText('Was this result helpful?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /detailed feedback/i })).toBeInTheDocument()
  })

  it('submits quick positive feedback', async () => {
    const user = userEvent.setup()
    render(<SearchResultFeedbackComponent {...mockProps} />)
    
    const yesButton = screen.getByRole('button', { name: /yes/i })
    await user.click(yesButton)
    
    await waitFor(() => {
      expect(mockProps.onSubmitFeedback).toHaveBeenCalledWith({
        resultId: 'test-result-1',
        isRelevant: true,
        qualityRating: 4,
        timestamp: expect.any(Date)
      })
    })
  })

  it('shows detailed form when clicking "No"', async () => {
    const user = userEvent.setup()
    render(<SearchResultFeedbackComponent {...mockProps} />)
    
    const noButton = screen.getByRole('button', { name: /no/i })
    await user.click(noButton)
    
    expect(screen.getByText('Was this result relevant to your search?')).toBeInTheDocument()
    expect(screen.getByText('How would you rate the quality of this result?')).toBeInTheDocument()
  })

  it('shows detailed form when clicking "Detailed Feedback"', async () => {
    const user = userEvent.setup()
    render(<SearchResultFeedbackComponent {...mockProps} />)
    
    const detailedButton = screen.getByRole('button', { name: /detailed feedback/i })
    await user.click(detailedButton)
    
    expect(screen.getByText('Was this result relevant to your search?')).toBeInTheDocument()
    expect(screen.getByText('How would you rate the quality of this result?')).toBeInTheDocument()
  })

  it('handles star rating clicks', async () => {
    const user = userEvent.setup()
    render(<SearchResultFeedbackComponent {...mockProps} />)
    
    // Open detailed form
    const detailedButton = screen.getByRole('button', { name: /detailed feedback/i })
    await user.click(detailedButton)
    
    // Click on 4th star
    const stars = screen.getAllByTestId('star-icon')
    await user.click(stars[3]) // 4th star (0-indexed)
    
    expect(screen.getByText('4/5')).toBeInTheDocument()
  })

  it('validates required fields before submission', async () => {
    const user = userEvent.setup()
    render(<SearchResultFeedbackComponent {...mockProps} />)
    
    // Open detailed form
    const detailedButton = screen.getByRole('button', { name: /detailed feedback/i })
    await user.click(detailedButton)
    
    // Try to submit without selecting relevance
    const submitButton = screen.getByRole('button', { name: /submit feedback/i })
    await user.click(submitButton)
    
    expect(mockProps.onSubmitFeedback).not.toHaveBeenCalled()
  })

  it('submits detailed feedback with all fields', async () => {
    const user = userEvent.setup()
    render(<SearchResultFeedbackComponent {...mockProps} />)
    
    // Open detailed form
    const detailedButton = screen.getByRole('button', { name: /detailed feedback/i })
    await user.click(detailedButton)
    
    // Select relevance (get the first one which is the "Relevant" button)
    const relevantButtons = screen.getAllByRole('button', { name: /relevant/i })
    await user.click(relevantButtons[0])
    
    // Rate quality (click 3rd star)
    const stars = screen.getAllByTestId('star-icon')
    await user.click(stars[2])
    
    // Add comments
    const commentsTextarea = screen.getByPlaceholderText(/tell us more about this result/i)
    await user.type(commentsTextarea, 'This paper was very helpful for my research.')
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /submit feedback/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockProps.onSubmitFeedback).toHaveBeenCalledWith({
        resultId: 'test-result-1',
        isRelevant: true,
        qualityRating: 3,
        comments: 'This paper was very helpful for my research.',
        timestamp: expect.any(Date)
      })
    })
  })

  it('handles cancel action', async () => {
    const user = userEvent.setup()
    render(<SearchResultFeedbackComponent {...mockProps} />)
    
    // Open detailed form
    const detailedButton = screen.getByRole('button', { name: /detailed feedback/i })
    await user.click(detailedButton)
    
    // Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    expect(mockProps.onCancel).toHaveBeenCalled()
  })

  it('enforces character limit on comments', async () => {
    const user = userEvent.setup()
    render(<SearchResultFeedbackComponent {...mockProps} />)
    
    // Open detailed form
    const detailedButton = screen.getByRole('button', { name: /detailed feedback/i })
    await user.click(detailedButton)
    
    const commentsTextarea = screen.getByPlaceholderText(/tell us more about this result/i)
    
    // Use paste instead of type for performance
    const longText = 'a'.repeat(500)
    await user.click(commentsTextarea)
    await user.paste(longText)
    
    // Should show 500/500 characters
    expect(screen.getByText('500/500 characters')).toBeInTheDocument()
  })

  it('displays error messages', async () => {
    const user = userEvent.setup()
    const mockOnSubmitFeedback = vi.fn().mockRejectedValue(new Error('Network error'))
    
    render(
      <SearchResultFeedbackComponent 
        {...mockProps} 
        onSubmitFeedback={mockOnSubmitFeedback}
      />
    )
    
    // Submit quick feedback that will fail
    const yesButton = screen.getByRole('button', { name: /yes/i })
    await user.click(yesButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to submit feedback. Please try again.')).toBeInTheDocument()
    })
  })

  it('truncates long result titles', () => {
    const longTitle = 'This is a very long research paper title that should be truncated when displayed in the feedback form header because it exceeds the reasonable length limit'
    
    render(
      <SearchResultFeedbackComponent 
        {...mockProps} 
        resultTitle={longTitle}
      />
    )
    
    // Open detailed form to see the title
    const detailedButton = screen.getByRole('button', { name: /detailed feedback/i })
    fireEvent.click(detailedButton)
    
    // Check for the truncated title (should end with "...")
    expect(screen.getByText(/This is a very long research paper title that shou\.\.\./)).toBeInTheDocument()
  })
})

describe('QuickFeedbackButtons', () => {
  const mockProps = {
    resultId: 'test-result-1',
    onFeedback: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders thumbs up and down buttons', () => {
    render(<QuickFeedbackButtons {...mockProps} />)
    
    expect(screen.getByTestId('thumbs-up-icon')).toBeInTheDocument()
    expect(screen.getByTestId('thumbs-down-icon')).toBeInTheDocument()
  })

  it('submits positive feedback', async () => {
    const user = userEvent.setup()
    render(<QuickFeedbackButtons {...mockProps} />)
    
    const thumbsUpButton = screen.getByRole('button', { name: /mark as relevant/i })
    await user.click(thumbsUpButton)
    
    await waitFor(() => {
      expect(mockProps.onFeedback).toHaveBeenCalledWith({
        isRelevant: true,
        rating: 4
      })
    })
  })

  it('submits negative feedback', async () => {
    const user = userEvent.setup()
    render(<QuickFeedbackButtons {...mockProps} />)
    
    const thumbsDownButton = screen.getByRole('button', { name: /mark as not relevant/i })
    await user.click(thumbsDownButton)
    
    await waitFor(() => {
      expect(mockProps.onFeedback).toHaveBeenCalledWith({
        isRelevant: false,
        rating: 2
      })
    })
  })

  it('disables buttons when disabled prop is true', () => {
    render(<QuickFeedbackButtons {...mockProps} disabled={true} />)
    
    const thumbsUpButton = screen.getByRole('button', { name: /mark as relevant/i })
    const thumbsDownButton = screen.getByRole('button', { name: /mark as not relevant/i })
    
    expect(thumbsUpButton).toBeDisabled()
    expect(thumbsDownButton).toBeDisabled()
  })

  it('prevents multiple submissions', async () => {
    const user = userEvent.setup()
    let resolvePromise: () => void
    const mockOnFeedback = vi.fn().mockImplementation(() => new Promise(resolve => {
      resolvePromise = resolve
    }))
    
    render(<QuickFeedbackButtons {...mockProps} onFeedback={mockOnFeedback} />)
    
    const thumbsUpButton = screen.getByRole('button', { name: /mark as relevant/i })
    
    // Click multiple times quickly while first call is still pending
    await user.click(thumbsUpButton)
    await user.click(thumbsUpButton)
    await user.click(thumbsUpButton)
    
    // Should only be called once
    expect(mockOnFeedback).toHaveBeenCalledTimes(1)
    
    // Resolve the promise to clean up
    resolvePromise!()
  })
})