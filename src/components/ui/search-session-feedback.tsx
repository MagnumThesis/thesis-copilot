"use client"

import React, { useState } from "react"
import { Button } from "./shadcn/button"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Badge } from "./shadcn/badge"
import { Textarea } from "./shadcn/textarea"
import { Label } from "./shadcn/label"
import { Checkbox } from "./shadcn/checkbox"
import { 
  Star, 
  MessageSquare, 
  X,
  Send,
  AlertCircle,
  ThumbsUp,
  Lightbulb
} from "lucide-react"

export interface SearchSessionFeedback {
  searchSessionId: string
  overallSatisfaction: number // 1-5 scale
  relevanceRating: number // 1-5 scale
  qualityRating: number // 1-5 scale
  easeOfUseRating: number // 1-5 scale
  feedbackComments?: string
  wouldRecommend: boolean
  improvementSuggestions?: string
  timestamp: Date
}

export interface SearchSessionFeedbackProps {
  searchSessionId: string
  searchQuery: string
  resultsCount: number
  onSubmitFeedback: (feedback: SearchSessionFeedback) => Promise<void>
  onCancel?: () => void
  className?: string
}

export const SearchSessionFeedbackComponent: React.FC<SearchSessionFeedbackProps> = ({
  searchSessionId,
  searchQuery,
  resultsCount,
  onSubmitFeedback,
  onCancel,
  className = ""
}) => {
  const [overallSatisfaction, setOverallSatisfaction] = useState<number>(0)
  const [relevanceRating, setRelevanceRating] = useState<number>(0)
  const [qualityRating, setQualityRating] = useState<number>(0)
  const [easeOfUseRating, setEaseOfUseRating] = useState<number>(0)
  const [feedbackComments, setFeedbackComments] = useState("")
  const [wouldRecommend, setWouldRecommend] = useState(false)
  const [improvementSuggestions, setImprovementSuggestions] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStarClick = (category: string, rating: number) => {
    setError(null)
    
    switch (category) {
      case 'overall':
        setOverallSatisfaction(rating)
        break
      case 'relevance':
        setRelevanceRating(rating)
        break
      case 'quality':
        setQualityRating(rating)
        break
      case 'easeOfUse':
        setEaseOfUseRating(rating)
        break
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    // Validate required fields
    if (overallSatisfaction === 0) {
      setError('Please provide an overall satisfaction rating')
      return
    }

    if (relevanceRating === 0) {
      setError('Please rate the relevance of search results')
      return
    }

    if (qualityRating === 0) {
      setError('Please rate the quality of search results')
      return
    }

    if (easeOfUseRating === 0) {
      setError('Please rate the ease of use')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const feedback: SearchSessionFeedback = {
        searchSessionId,
        overallSatisfaction,
        relevanceRating,
        qualityRating,
        easeOfUseRating,
        feedbackComments: feedbackComments.trim() || undefined,
        wouldRecommend,
        improvementSuggestions: improvementSuggestions.trim() || undefined,
        timestamp: new Date()
      }

      await onSubmitFeedback(feedback)
    } catch (error) {
      console.error('Error submitting session feedback:', error)
      setError('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setOverallSatisfaction(0)
    setRelevanceRating(0)
    setQualityRating(0)
    setEaseOfUseRating(0)
    setFeedbackComments("")
    setWouldRecommend(false)
    setImprovementSuggestions("")
    setError(null)
    onCancel?.()
  }

  const renderStarRating = (
    category: string, 
    currentRating: number, 
    label: string,
    description?: string
  ) => {
    return (
      <div className="space-y-2">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(category, star)}
              disabled={isSubmitting}
              className={`p-1 rounded transition-colors ${
                !isSubmitting 
                  ? 'hover:bg-gray-100 cursor-pointer' 
                  : 'cursor-default'
              }`}
            >
              <Star
                className={`h-5 w-5 ${
                  star <= currentRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
          {currentRating > 0 && (
            <span className="text-sm text-muted-foreground ml-2">
              {currentRating}/5
            </span>
          )}
        </div>
      </div>
    )
  }

  const getRatingLabel = (rating: number): string => {
    switch (rating) {
      case 1: return 'Poor'
      case 2: return 'Fair'
      case 3: return 'Good'
      case 4: return 'Very Good'
      case 5: return 'Excellent'
      default: return ''
    }
  }

  const isFormValid = overallSatisfaction > 0 && relevanceRating > 0 && 
                     qualityRating > 0 && easeOfUseRating > 0

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Search Feedback
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
        
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Search Query:</strong> {searchQuery}</p>
          <p><strong>Results Found:</strong> {resultsCount}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Satisfaction */}
        {renderStarRating(
          'overall',
          overallSatisfaction,
          'Overall Satisfaction',
          'How satisfied are you with this search experience?'
        )}

        {/* Relevance Rating */}
        {renderStarRating(
          'relevance',
          relevanceRating,
          'Result Relevance',
          'How relevant were the search results to your query?'
        )}

        {/* Quality Rating */}
        {renderStarRating(
          'quality',
          qualityRating,
          'Result Quality',
          'How would you rate the quality of the academic papers found?'
        )}

        {/* Ease of Use Rating */}
        {renderStarRating(
          'easeOfUse',
          easeOfUseRating,
          'Ease of Use',
          'How easy was it to use the AI search feature?'
        )}

        {/* Would Recommend */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Recommendation</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="would-recommend"
              checked={wouldRecommend}
              onCheckedChange={(checked) => setWouldRecommend(checked as boolean)}
              disabled={isSubmitting}
            />
            <Label 
              htmlFor="would-recommend" 
              className="text-sm cursor-pointer flex items-center gap-2"
            >
              <ThumbsUp className="h-4 w-4 text-green-600" />
              I would recommend this AI search feature to others
            </Label>
          </div>
        </div>

        {/* General Comments */}
        <div className="space-y-2">
          <Label htmlFor="feedback-comments" className="text-sm font-medium">
            General Comments (Optional)
          </Label>
          <Textarea
            id="feedback-comments"
            value={feedbackComments}
            onChange={(e) => setFeedbackComments(e.target.value)}
            placeholder="Tell us about your experience - what worked well, what didn't, or any other thoughts..."
            className="min-h-[80px] resize-none"
            disabled={isSubmitting}
            maxLength={1000}
          />
          <div className="text-xs text-muted-foreground text-right">
            {feedbackComments.length}/1000 characters
          </div>
        </div>

        {/* Improvement Suggestions */}
        <div className="space-y-2">
          <Label htmlFor="improvement-suggestions" className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
            Suggestions for Improvement (Optional)
          </Label>
          <Textarea
            id="improvement-suggestions"
            value={improvementSuggestions}
            onChange={(e) => setImprovementSuggestions(e.target.value)}
            placeholder="How could we improve the AI search feature? Any specific features or changes you'd like to see?"
            className="min-h-[80px] resize-none"
            disabled={isSubmitting}
            maxLength={1000}
          />
          <div className="text-xs text-muted-foreground text-right">
            {improvementSuggestions.length}/1000 characters
          </div>
        </div>

        {/* Rating Summary */}
        {isFormValid && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm font-medium text-blue-800 mb-2">Feedback Summary</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
              <div>Overall: {getRatingLabel(overallSatisfaction)} ({overallSatisfaction}/5)</div>
              <div>Relevance: {getRatingLabel(relevanceRating)} ({relevanceRating}/5)</div>
              <div>Quality: {getRatingLabel(qualityRating)} ({qualityRating}/5)</div>
              <div>Ease of Use: {getRatingLabel(easeOfUseRating)} ({easeOfUseRating}/5)</div>
            </div>
            {wouldRecommend && (
              <div className="text-xs text-blue-700 mt-2 flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                Would recommend to others
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
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
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
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