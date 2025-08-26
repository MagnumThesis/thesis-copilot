"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Button } from "./shadcn/button"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Badge } from "./shadcn/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/select"
import { 
  Search, 
  ExternalLink, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  Star,
  Calendar,
  Quote,
  TrendingUp,
  Info,
  MessageSquare,
  Bookmark,
  GitCompare,
  Share2,
  Download
} from "lucide-react"
import { ScholarSearchResult, ExtractedContent } from "../../lib/ai-types"
import { ResultScoringEngine, RankedResult } from "../../worker/lib/result-scoring-engine"
import { SearchResultFeedbackComponent, QuickFeedbackButtons, SearchResultFeedback } from "./search-result-feedback"
import { SearchResultBookmark } from "./search-result-bookmark"
import { aiSearcherPerformanceOptimizer } from "../../lib/ai-searcher-performance-optimizer"

export interface SearchResultsDisplayProps {
  results: ScholarSearchResult[]
  totalResults: number
  extractedContent: ExtractedContent
  onAddReference: (result: ScholarSearchResult) => void
  onProvideFeedback?: (resultId: string, feedback: SearchResultFeedback) => Promise<void>
  onBookmarkResult?: (result: ScholarSearchResult) => Promise<void>
  onRemoveBookmark?: (result: ScholarSearchResult) => Promise<void>
  onAddToComparison?: (result: ScholarSearchResult) => Promise<void>
  onShareResult?: (result: ScholarSearchResult) => Promise<void>
  onExportResults?: (results: ScholarSearchResult[]) => Promise<void>
  onLoadMore?: () => Promise<void>
  bookmarkedResults?: Set<string>
  comparisonResults?: Set<string>
  userId?: string
  loading?: boolean
  error?: string | null
  className?: string
}

export type SortOption = 'relevance' | 'date' | 'citations' | 'quality'
export type SortDirection = 'asc' | 'desc'

export const SearchResultsDisplay: React.FC<SearchResultsDisplayProps> = ({
  results,
  totalResults,
  extractedContent,
  onAddReference,
  onProvideFeedback,
  onBookmarkResult,
  onRemoveBookmark,
  onAddToComparison,
  onShareResult,
  onExportResults,
  onLoadMore,
  bookmarkedResults = new Set(),
  comparisonResults = new Set(),
  userId,
  loading = false,
  error = null,
  className = ""
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [addingReference, setAddingReference] = useState<string | null>(null)
  const [showConfidenceDetails, setShowConfidenceDetails] = useState<string | null>(null)
  const [showFeedbackForm, setShowFeedbackForm] = useState<string | null>(null)
  const [submittedFeedback, setSubmittedFeedback] = useState<Set<string>>(new Set())
  const [processingBookmark, setProcessingBookmark] = useState<string | null>(null)
  const [processingComparison, setProcessingComparison] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Initialize scoring engine
  const scoringEngine = useMemo(() => new ResultScoringEngine(), [])

  // Rank and sort results
  const rankedResults = useMemo(() => {
    if (results.length === 0) return []

    // First, rank all results using the scoring engine
    const ranked = scoringEngine.rankResults(results, extractedContent)

    // Then apply sorting
    const sorted = [...ranked].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'relevance':
          comparison = b.relevanceScore - a.relevanceScore
          break
        case 'date':
          const yearA = a.year || 0
          const yearB = b.year || 0
          comparison = yearB - yearA
          break
        case 'citations':
          const citationsA = a.citations || 0
          const citationsB = b.citations || 0
          comparison = citationsB - citationsA
          break
        case 'quality':
          comparison = b.qualityScore - a.qualityScore
          break
        default:
          comparison = b.overallScore - a.overallScore
      }

      return sortDirection === 'desc' ? comparison : -comparison
    })

    return sorted
  }, [results, extractedContent, sortBy, sortDirection, scoringEngine])

  const handleSortChange = (newSortBy: SortOption) => {
    if (newSortBy === sortBy) {
      // Toggle direction if same sort option
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(newSortBy)
      setSortDirection('desc') // Default to descending for new sort
    }
  }

  const handleAddReference = async (result: RankedResult) => {
    const resultId = `${result.title}-${result.authors[0]}`
    setAddingReference(resultId)

    try {
      await onAddReference(result)
    } catch (error) {
      console.error('Error adding reference:', error)
    } finally {
      setAddingReference(null)
    }
  }

  const handleProvideFeedback = async (resultId: string, feedback: SearchResultFeedback) => {
    if (!onProvideFeedback) return

    try {
      await onProvideFeedback(resultId, feedback)
      setSubmittedFeedback(prev => new Set([...prev, resultId]))
      setShowFeedbackForm(null)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      throw error // Re-throw to let the feedback component handle the error
    }
  }

  const handleQuickFeedback = async (resultId: string, feedback: { isRelevant: boolean; rating: number }) => {
    if (!onProvideFeedback) return

    const fullFeedback: SearchResultFeedback = {
      resultId,
      isRelevant: feedback.isRelevant,
      qualityRating: feedback.rating,
      timestamp: new Date()
    }

    try {
      await handleProvideFeedback(resultId, fullFeedback)
    } catch (error) {
      console.error('Error submitting quick feedback:', error)
    }
  }

  const handleShowFeedbackForm = (resultId: string) => {
    setShowFeedbackForm(resultId)
  }

  const handleCancelFeedback = () => {
    setShowFeedbackForm(null)
  }

  const handleBookmarkToggle = async (result: RankedResult) => {
    const resultId = `${result.title}-${result.authors[0]}`
    const isBookmarked = bookmarkedResults.has(resultId)
    
    setProcessingBookmark(resultId)
    try {
      if (isBookmarked && onRemoveBookmark) {
        await onRemoveBookmark(result)
      } else if (!isBookmarked && onBookmarkResult) {
        await onBookmarkResult(result)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    } finally {
      setProcessingBookmark(null)
    }
  }

  const handleAddToComparison = async (result: RankedResult) => {
    if (!onAddToComparison) return

    const resultId = `${result.title}-${result.authors[0]}`
    setProcessingComparison(resultId)
    try {
      await onAddToComparison(result)
    } catch (error) {
      console.error('Error adding to comparison:', error)
    } finally {
      setProcessingComparison(null)
    }
  }

  const handleShareResult = async (result: RankedResult) => {
    if (onShareResult) {
      await onShareResult(result)
    }
  }

  const handleExportResults = async () => {
    if (onExportResults) {
      await onExportResults(rankedResults)
    }
  }

  const handleLoadMore = async () => {
    if (onLoadMore) {
      setIsLoadingMore(true);
      await onLoadMore();
      setIsLoadingMore(false);
    }
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatScore = (score: number): string => {
    return Math.round(score * 100).toString()
  }

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return <ArrowUpDown className="h-4 w-4 opacity-50" />
    return sortDirection === 'desc' ? 
      <ArrowUpDown className="h-4 w-4 rotate-180" /> : 
      <ArrowUpDown className="h-4 w-4" />
  }

  if (loading && results.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
          <p className="text-muted-foreground">Searching and ranking results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <span className="font-medium">Search Error:</span>
            <span>{error}</span>
          </div>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No results found</p>
          <p className="text-sm">Try adjusting your search terms or filters.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Results Header with Sorting and Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h4 className="text-base font-semibold">
            Search Results ({totalResults})
          </h4>
          
          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <div className="flex gap-1">
              <Button
                variant={sortBy === 'relevance' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('relevance')}
                className="flex items-center gap-1"
              >
                <Star className="h-3 w-3" />
                Relevance
                {getSortIcon('relevance')}
              </Button>
              <Button
                variant={sortBy === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('date')}
                className="flex items-center gap-1"
              >
                <Calendar className="h-3 w-3" />
                Date
                {getSortIcon('date')}
              </Button>
              <Button
                variant={sortBy === 'citations' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('citations')}
                className="flex items-center gap-1"
              >
                <Quote className="h-3 w-3" />
                Citations
                {getSortIcon('citations')}
              </Button>
              <Button
                variant={sortBy === 'quality' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('quality')}
                className="flex items-center gap-1"
              >
                <TrendingUp className="h-3 w-3" />
                Quality
                {getSortIcon('quality')}
              </Button>
            </div>
          </div>
        </div>

        {/* Action and Items per page selector */}
        <div className="flex items-center gap-2">
          {onExportResults && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportResults}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>    
  {/* Results List */}
      <div className="space-y-4">
        {rankedResults.map((result, index) => {
          const resultId = `${result.title}-${result.authors[0]}`
          
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Rank #{result.rank}
                      </Badge>
                    </div>
                    
                    <CardTitle className="text-base font-medium leading-tight mb-3">
                      {result.title}
                    </CardTitle>
                    
                    {/* Score Badges */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge className={getConfidenceColor(result.overallScore)}>
                        Overall: {formatScore(result.overallScore)}%
                      </Badge>
                      <Badge variant="outline" className={getScoreColor(result.relevanceScore)}>
                        Relevance: {formatScore(result.relevanceScore)}%
                      </Badge>
                      <Badge variant="outline" className={getScoreColor(result.qualityScore)}>
                        Quality: {formatScore(result.qualityScore)}%
                      </Badge>
                      <Badge variant="outline" className={getScoreColor(result.confidenceScore)}>
                        Confidence: {formatScore(result.confidenceScore)}%
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfidenceDetails(
                          showConfidenceDetails === resultId ? null : resultId
                        )}
                        className="h-6 px-2"
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Confidence Details */}
                    {showConfidenceDetails === resultId && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="font-medium mb-1">Relevance</div>
                            <div className="space-y-1 text-xs">
                              <div>Text: {formatScore(result.scoringBreakdown.relevance.textSimilarity)}%</div>
                              <div>Keywords: {formatScore(result.scoringBreakdown.relevance.keywordMatch)}%</div>
                              <div>Topics: {formatScore(result.scoringBreakdown.relevance.topicOverlap)}%</div>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium mb-1">Quality</div>
                            <div className="space-y-1 text-xs">
                              <div>Citations: {formatScore(result.scoringBreakdown.quality.citationScore)}%</div>
                              <div>Recency: {formatScore(result.scoringBreakdown.quality.recencyScore)}%</div>
                              <div>Journal: {formatScore(result.scoringBreakdown.quality.journalQuality)}%</div>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium mb-1">Confidence</div>
                            <div className="space-y-1 text-xs">
                              <div>Metadata: {formatScore(result.scoringBreakdown.confidence.metadataCompleteness)}%</div>
                              <div>Source: {formatScore(result.scoringBreakdown.confidence.sourceReliability)}%</div>
                              <div>Extraction: {formatScore(result.scoringBreakdown.confidence.extractionQuality)}%</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Metadata */}
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div><strong>Authors:</strong> {result.authors.join(', ')}</div>
                      {result.journal && (
                        <div><strong>Journal:</strong> {result.journal}</div>
                      )}
                      <div className="flex items-center gap-4">
                        {result.year && (
                          <span><strong>Year:</strong> {result.year}</span>
                        )}
                        {result.citations !== undefined && (
                          <span><strong>Citations:</strong> {result.citations}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 ml-4 flex-wrap">
                    {result.doi && (
                      <a
                        href={`https://doi.org/${result.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="View on DOI"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    
                    {/* Management Buttons */}
                    {(onBookmarkResult || onRemoveBookmark) && (
                      <SearchResultBookmark
                        result={result}
                        isBookmarked={bookmarkedResults.has(resultId)}
                        onBookmark={onBookmarkResult || (() => Promise.resolve())}
                        onRemoveBookmark={onRemoveBookmark || (() => Promise.resolve())}
                        onCompare={onAddToComparison ? () => handleAddToComparison(result) : undefined}
                        onShare={onShareResult ? () => handleShareResult(result) : undefined}
                        disabled={processingBookmark === resultId || processingComparison === resultId}
                      />
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddReference(result)}
                      disabled={addingReference === resultId}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {addingReference === resultId ? 'Adding...' : 'Add Reference'}
                    </Button>
                    
                    {/* Feedback Button */}
                    {onProvideFeedback && !submittedFeedback.has(resultId) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowFeedbackForm(resultId)}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Feedback
                      </Button>
                    )}
                    
                    {/* Quick Feedback Buttons */}
                    {onProvideFeedback && !submittedFeedback.has(resultId) && showFeedbackForm !== resultId && (
                      <QuickFeedbackButtons
                        resultId={resultId}
                        onFeedback={(feedback) => handleQuickFeedback(resultId, feedback)}
                        disabled={addingReference === resultId}
                      />
                    )}
                    
                    {/* Feedback Submitted Indicator */}
                    {submittedFeedback.has(resultId) && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Feedback Submitted
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {result.abstract && (
                <CardContent className="pt-0">
                  <div className="text-sm text-muted-foreground">
                    <strong>Abstract:</strong> {result.abstract.length > 300 
                      ? `${result.abstract.substring(0, 300)}...` 
                      : result.abstract
                    }
                  </div>
                </CardContent>
              )}
              
              {/* Feedback Form */}
              {showFeedbackForm === resultId && onProvideFeedback && (
                <CardContent className="pt-0 border-t">
                  <SearchResultFeedbackComponent
                    resultId={resultId}
                    resultTitle={result.title}
                    onSubmitFeedback={(feedback) => handleProvideFeedback(resultId, feedback)}
                    onCancel={handleCancelFeedback}
                  />
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>      
      {/* Load More Button */}
      {results.length < totalResults && (
        <div className="text-center mt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading...' : 'Load More Results'}
          </Button>
        </div>
      )}
    </div>
  )
}