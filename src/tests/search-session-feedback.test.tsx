import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  SearchSessionFeedbackComponent,
  SearchSessionFeedback 
} from '../components/ui/search-session-feedback'

// Mock the icons
vi.mock('lucide-react', () => ({
  Star: ({ className }: { className?: string }) => (
    <div data-testid="star-icon" className={className} />
  ),
  MessageSquare: () => <div data-testid="message-square-icon" />,
  X: () => <div data-testid="x-icon" />,
  Send: () => <div data-testid="send-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  ThumbsUp: () => <div data-testid="thumbs-up-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />
}))

describe('SearchSessionFeedbackComponent', () => {
  const mockProps = {
    searchSessionId: 'session-123',
    searchQuery: 'machine learning in education',
    resultsCount: 15,
    onSubmitFeedback: vi.fn(),
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders session information correctly', () => {
    render(<SearchSessionFeedbackComponent {...mockProps} />)
    
    expect(screen.getByText('Search Feedback')).toBeInTheDocument()
    expect(screen.getByText('machine learning in education')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('renders all rating categories', () => {
    render(<SearchSessionFeedbackComponent {...mockProps} />)
    
    expect(screen.getByText('Overall Satisfaction')).toBeInTheDocument()
    expect(screen.getByText('Result Relevance')).toBeInTheDocument()
    expect(screen.getByText('Result Quality')).toBeInTheDocument()
    expect(screen.getByText('Ease of Use')).toBeInTheDocument()
  })

  it('handles star rating clicks for all categories', async () => {
    const user = userEvent.setup()
    render(<SearchSessionFeedbackComponent {...mockProps} />)
    
    // Get all star icons (5 stars × 4 categories = 20 stars)
    const stars = screen.getAllByTestId('star-icon')
    
    // Click 4th star in first category (overall satisfaction)
    await user.click(stars[3])
    
    // Should show rating
    expect(screen.getByText('4/5')).toBeInTheDocument()
  })

  it('validates all required ratings before submission', async () => {
    const user = userEvent.setup()
    render(<SearchSessionFeedbackComponent {...mockProps} />)
    
    // Try to submit without any ratings
    const submitButton = screen.getByRole('button', { name: /submit feedback/i })
    await user.click(submitButton)
    
    expect(screen.getByText('Please provide an overall satisfaction rating')).toBeInTheDocument()
    expect(mockProps.onSubmitFeedback).not.toHaveBeenCalled()
  })

  it('shows different validation messages for missing ratings', async () => {
    const user = userEvent.setup()
    render(<SearchSessionFeedbackComponent {...mockProps} />)
    
    const stars = screen.getAllByTestId('star-icon')
    const submitButton = screen.getByRole('button', { name: /submit feedback/i })
    
    // Set overall satisfaction only
    await user.click(stars[3]) // 4th star in overall satisfaction
    await user.click(submitButton)
    
    expect(screen.getByText('Please rate the relevance of search results')).toBeInTheDocument()
    
    // Set relevance rating
    await user.click(stars[8]) // 4th star in relevance (5 + 3)
    await user.click(submitButton)
    
    expect(screen.getByText('Please rate the quality of search results')).toBeInTheDocument()
    
    // Set quality rating
    await user.click(stars[13]) // 4th star in quality (10 + 3)
    await user.click(submitButton)
    
    expect(screen.getByText('Please rate the ease of use')).toBeInTheDocument()
  })

  it('submits complete feedback successfully', async () => {
    const user = userEvent.setup()
    render(<SearchSessionFeedbackComponent {...mockProps} />)
    
    const stars = screen.getAllByTestId('star-icon')
    
    // Rate all categories (4 stars each)
    await user.click(stars[3])  // Overall satisfaction
    await user.click(stars[8])  // Relevance
    await user.click(stars[13]) // Quality
    await user.click(stars[18]) // Ease of use
    
    // Check recommendation checkbox
    const recommendCheckbox = screen.getByRole('checkbox')
    await user.click(recommendCheckbox)
    
    // Add comments
    const commentsTextarea = screen.getByPlaceholderText(/tell us about your experience/i)
    await user.type(commentsTextarea, 'Great search experience!')
    
    // Add improvement suggestions
    const suggestionsTextarea = screen.getByPlaceholderText(/how could we improve/i)
    await user.type(suggestionsTextarea, 'Add more filters')
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /submit feedback/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockProps.onSubmitFeedback).toHaveBeenCalledWith({
        searchSessionId: 'session-123',
        overallSatisfaction: 4,
        relevanceRating: 4,
        qualityRating: 4,
        easeOfUseRating: 4,
        feedbackComments: 'Great search experience!',
        wouldRecommend: true,
        improvementSuggestions: 'Add more filters',
        timestamp: expect.any(Date)
      })
    })
  })

  it('handles recommendation checkbox', async () => {
    const user = userEvent.setup()
    render(<SearchSessionFeedbackComponent {...mockProps} />)
    
    const recommendCheckbox = screen.getByRole('checkbox')
    
    // Initially unchecked
    expect(recommendCheckbox).not.toBeChecked()
    
    // Click to check
    await user.click(recommendCheckbox)
    expect(recommendCheckbox).toBeChecked()
    
    // Click to uncheck
    await user.click(recommendCheckbox)
    expect(recommendCheckbox).not.toBeChecked()
  })

  it('enforces character limits on text areas', async () => {
    const user = userEvent.setup()
    render(<SearchSessionFeedbackComponent {...mockProps} />)
    
    const commentsTextarea = screen.getByPlaceholderText(/tell us about your experience/i)
    const suggestionsTextarea = screen.getByPlaceholderText(/how could we improve/i)
    
    // Test comments character limit (1000)
    const longComments = 'a'.repeat(1100)
    await user.type(commentsTextarea, longComments)
    expect(commentsTextarea).toHaveValue('a'.repeat(1000))
    expect(screen.getByText('1000/1000 characters')).toBeInTheDocument()
    
    // Test suggestions character limit (1000)
    const longSuggestions = 'b'.repeat(1100)
    await user.type(suggestionsTextarea, longSuggestions)
    expect(suggestionsTextarea).toHaveValue('b'.repeat(1000))
  })

  it('shows feedback summary when form is valid', async () => {
    const user = userEvent.setup()
    render(<SearchSessionFeedbackComponent {...mockProps} />)
    
    const stars = screen.getAllByTestId('star-icon')
    
    // Rate all categories
    await user.click(stars[4])  // 5 stars - Overall satisfaction (Excellent)
    await user.click(stars[7])  // 3 stars - Relevance (Good)
    await user.click(stars[11]) // 2 stars - Quality (Fair)
    await user.click(stars[16]) // 1 star - Ease of use (Poor)
    
    // Check recommendation
    const recommendCheckbox = screen.getByRole('checkbox')
    await user.click(recommendCheckbox)
    
    // Should show summary
    expect(screen.getByText('Feedback Summary')).toBeInTheDocument()
    expect(screen.getByText('Overall: Excellent (5/5)')).toBeInTheDocument()
    expect(screen.getByText('Relevance: Good (3/5)')).toBeInTheDocument()
    expect(screen.getByText('Quality: Fair (2/5)')).toBeInTheDocument()
    expect(screen.getByText('Ease of Use: Poor (1/5)')).toBeInTheDocument()
    expect(screen.getByText('Would recommend to others')).toBeInTheDocument()
  })

  it('handles cancel action', async () => {
    const user = userEvent.setup()
    render(<SearchSessionFeedbackComponent {...mockProps} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    expect(mockProps.onCancel).toHaveBeenCalled()
  })

  it('handles submission errors', async () => {
    const user = userEvent.setup()
    const mockOnSubmitFeedback = vi.fn().mockRejectedValue(new Error('Network error'))
    
    render(
      <SearchSessionFeedbackComponent 
        {...mockProps} 
        onSubmitFeedback={mockOnSubmitFeedback}
      />
    )
    
    const stars = screen.getAllByTestId('star-icon')
    
    // Rate all categories
    await user.click(stars[3])  // Overall satisfaction
    await user.click(stars[8])  // Relevance
    await user.click(stars[13]) // Quality
    await user.click(stars[18]) // Ease of use
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /submit feedback/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to submit feedback. Please try again.')).toBeInTheDocument()
    })
  })

  it('disables form during submission', async () => {
    const user = userEvent.setup()
    const mockOnSubmitFeedback = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(
      <SearchSessionFeedbackComponent 
        {...mockProps} 
        onSubmitFeedback={mockOnSubmitFeedback}
      />
    )
    
    const stars = screen.getAllByTestId('star-icon')
    
    // Rate all categories
    await user.click(stars[3])
    await user.click(stars[8])
    await user.click(stars[13])
    await user.click(stars[18])
    
    // Submit
    const submitButton = screen.getByRole('button', { name: /submit feedback/i })
    await user.click(submitButton)
    
    // Button should show submitting state
    expect(screen.getByText('Submitting...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('displays rating labels correctly', () => {
    render(<SearchSessionFeedbackComponent {...mockProps} />)
    
    expect(screen.getByText('1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent')).toBeInTheDocument()
  })

  it('handles empty optional fields correctly', async () => {
    const user = userEvent.setup()
    render(<SearchSessionFeedbackComponent {...mockProps} />)
    
    const stars = screen.getAllByTestId('star-icon')
    
    // Rate all categories but leave optional fields empty
    await user.click(stars[3])
    await user.click(stars[8])
    await user.click(stars[13])
    await user.click(stars[18])
    
    // Submit without optional fields
    const submitButton = screen.getByRole('button', { name: /submit feedback/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockProps.onSubmitFeedback).toHaveBeenCalledWith({
        searchSessionId: 'session-123',
        overallSatisfaction: 4,
        relevanceRating: 4,
        qualityRating: 4,
        easeOfUseRating: 4,
        feedbackComments: undefined,
        wouldRecommend: false,
        improvementSuggestions: undefined,
        timestamp: expect.any(Date)
      })
    })
  })
})