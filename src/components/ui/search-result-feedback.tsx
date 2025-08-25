"use client"

import React, { useState } from "react"
import { Button } from "./shadcn/button"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Badge } from "./shadcn/badge"
import { Textarea } from "./shadcn/textarea"
import { Label } from "./shadcn/label"
import { 
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  MessageSquare, 
  X,
  Send,
  AlertCircle
} from "lucide-react"

export interface SearchResultFeedback {
  resultId: string
  isRelevant: boolean
  qualityRating: number // 1-5 scale
  comments?: string
  timestamp: Date
}

export interface SearchResultFeedbackProps {
  resultId: string
  resultTitle: string
  onSubmitFeedback: (feedback: SearchResultFeedback) => Promise<void>
  onCancel?: () => void
  className?: string
}

export const SearchResultFeedbackComponent: React.FC<SearchResultFeedbackProps> = ({
  resultId,
  resultTitle,
  onSubmitFeedback,
  onCancel,
  className = ""
}) => {
  const [isRelevant, setIsRelevant] = useState<boolean | null>(null)
  const [qualityRating, setQualityRating] = useState<number>(0)
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDetailedForm, setShowDetailedForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRelevanceClick = (relevant: boolean) => {
    setIsRelevant(relevant)
    setError(null)
    
    // If marking as not relevant, show detailed form for feedback
    if (!relevant) {
      setShowDetailedForm(true)
    }
  }

  const handleStarClick = (rating: number) => {
    setQualityRating(rating)
    setError(null)
  }

  const handleQuickFeedback = async (relevant: boolean, rating: number = 3) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const feedback: SearchResultFeedback = {
        resultId,
        isRelevant: relevant,
        qualityRating: rating,
        timestamp: new Date()
      }

      await onSubmitFeedback(feedback)
    } catch (error) {
      console.error('Error submitting quick feedback:', error)
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDetailedSubmit = async () => {
    if (isSubmitting || isRelevant === null) return

    // Validate required fields
    if (!isRelevant && qualityRating === 0) {
      setError('Please provide a quality rating')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const feedback: SearchResultFeedback = {
        resultId,
        isRelevant,
        qualityRating: qualityRating || 3,
        comments: comments.trim() || undefined,
        timestamp: new Date()
      }

      await onSubmitFeedback(feedback)
    } catch (error) {
      console.error('Error submitting detailed feedback:', error)
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setIsRelevant(null)
    setQualityRating(0)
    setComments("")
    setShowDetailedForm(false)
    setError(null)
    onCancel?.()
  }

  const renderStarRating = (interactive: boolean = true) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && handleStarClick(star)}
            disabled={!interactive || isSubmitting}
            className={`p-1 rounded transition-colors ${
              interactive && !isSubmitting 
                ? 'hover:bg-gray-100 cursor-pointer' 
                : 'cursor-default'
            }`}
          >
            <Star
              className={`h-4 w-4 ${
                star <= qualityRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {qualityRating > 0 && (
          <span className="text-sm text-muted-foreground ml-2">
            {qualityRating}/5
          </span>
        )}
      </div>
    )
  }

  // Quick feedback buttons (shown initially)
  if (!showDetailedForm && isRelevant === null) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Was this result helpful?
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickFeedback(true, 4)}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <ThumbsUp className="h-4 w-4" />
            Yes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRelevanceClick(false)}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <ThumbsDown className="h-4 w-4" />
            No
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetailedForm(true)}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Detailed Feedback
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    )
  }

  // Detailed feedback form
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Feedback for: {resultTitle.length > 50 
              ? `${resultTitle.substring(0, 50)}...` 
              : resultTitle
            }
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Relevance Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Was this result relevant to your search?
          </Label>
          <div className="flex items-center gap-2">
            <Button
              variant={isRelevant === true ? "default" : "outline"}
              size="sm"
              onClick={() => handleRelevanceClick(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              Relevant
            </Button>
            <Button
              variant={isRelevant === false ? "default" : "outline"}
              size="sm"
              onClick={() => handleRelevanceClick(false)}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <ThumbsDown className="h-4 w-4" />
              Not Relevant
            </Button>
          </div>
        </div>

        {/* Quality Rating */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            How would you rate the quality of this result?
          </Label>
          {renderStarRating(true)}
          <div className="text-xs text-muted-foreground">
            1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-2">
          <Label htmlFor="feedback-comments" className="text-sm font-medium">
            Additional Comments (Optional)
          </Label>
          <Textarea
            id="feedback-comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Tell us more about this result - what was helpful or what could be improved?"
            className="min-h-[80px] resize-none"
            disabled={isSubmitting}
            maxLength={500}
          />
          <div className="text-xs text-muted-foreground text-right">
            {comments.length}/500 characters
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleDetailedSubmit}
            disabled={isSubmitting || isRelevant === null}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick feedback buttons component for inline use
export interface QuickFeedbackButtonsProps {
  resultId: string
  onFeedback: (feedback: { isRelevant: boolean; rating: number }) => Promise<void>
  disabled?: boolean
  className?: string
}

export const QuickFeedbackButtons: React.FC<QuickFeedbackButtonsProps> = ({
  resultId,
  onFeedback,
  disabled = false,
  className = ""
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleQuickFeedback = async (isRelevant: boolean, rating: number) => {
    if (isSubmitting || disabled) return

    setIsSubmitting(true)
    try {
      await onFeedback({ isRelevant, rating })
    } catch (error) {
      console.error('Error submitting quick feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleQuickFeedback(true, 4)}
        disabled={disabled || isSubmitting}
        className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
        title="Mark as relevant"
      >
        <ThumbsUp className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleQuickFeedback(false, 2)}
        disabled={disabled || isSubmitting}
        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        title="Mark as not relevant"
      >
        <ThumbsDown className="h-3 w-3" />
      </Button>
    </div>
  )
}