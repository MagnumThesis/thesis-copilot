"use client"

import React, { useState, useMemo } from "react"
import { Button } from "./shadcn/button"
import { Badge } from "./shadcn/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./shadcn/select"
import { 
  Compare, 
  X, 
  ExternalLink, 
  Plus, 
  ArrowUpDown,
  Star,
  Calendar,
  Quote,
  TrendingUp,
  Download,
  Share2
} from "lucide-react"
import { ScholarSearchResult } from "../../lib/ai-types"

export interface ComparisonResult extends ScholarSearchResult {
  comparisonId: string
  addedAt: Date
  relevanceScore: number
  qualityScore: number
  confidenceScore: number
}

interface SearchResultComparisonProps {
  comparisonResults: ComparisonResult[]
  onRemoveFromComparison: (result: ComparisonResult) => void
  onAddReference?: (result: ComparisonResult) => Promise<void>
  onExportComparison?: (results: ComparisonResult[]) => void
  onShareComparison?: (results: ComparisonResult[]) => void
  onClearComparison?: () => void
  className?: string
}

type ComparisonField = 'title' | 'authors' | 'journal' | 'year' | 'citations' | 'relevance' | 'quality' | 'confidence'

export const SearchResultComparison: React.FC<SearchResultComparisonProps> = ({
  comparisonResults,
  onRemoveFromComparison,
  onAddReference,
  onExportComparison,
  onShareComparison,
  onClearComparison,
  className = ""
}) => {
  const [sortBy, setSortBy] = useState<ComparisonField>('relevance')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [addingReference, setAddingReference] = useState<string | null>(null)

  // Sort comparison results
  const sortedResults = useMemo(() => {
    return [...comparisonResults].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'authors':
          comparison = a.authors[0]?.localeCompare(b.authors[0] || '') || 0
          break
        case 'journal':
          comparison = (a.journal || '').localeCompare(b.journal || '')
          break
        case 'year':
          comparison = (a.year || 0) - (b.year || 0)
          break
        case 'citations':
          comparison = (a.citations || 0) - (b.citations || 0)
          break
        case 'relevance':
          comparison = a.relevanceScore - b.relevanceScore
          break
        case 'quality':
          comparison = a.qualityScore - b.qualityScore
          break
        case 'confidence':
          comparison = a.confidenceScore - b.confidenceScore
          break
        default:
          comparison = 0
      }

      return sortDirection === 'desc' ? -comparison : comparison
    })
  }, [comparisonResults, sortBy, sortDirection])

  const handleSortChange = (field: ComparisonField) => {
    if (field === sortBy) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(field)
      setSortDirection('desc')
    }
  }

  const handleAddReference = async (result: ComparisonResult) => {
    if (!onAddReference) return

    setAddingReference(result.comparisonId)
    try {
      await onAddReference(result)
    } catch (error) {
      console.error('Error adding reference:', error)
    } finally {
      setAddingReference(null)
    }
  }

  const handleExportComparison = () => {
    if (onExportComparison) {
      onExportComparison(comparisonResults)
    }
  }

  const handleShareComparison = () => {
    if (onShareComparison) {
      onShareComparison(comparisonResults)
    }
  }

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatScore = (score: number): string => {
    return Math.round(score * 100).toString()
  }

  if (comparisonResults.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        <Compare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No results selected for comparison</p>
        <p className="text-sm">Add search results to compare them side-by-side.</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Comparison Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h4 className="text-base font-semibold flex items-center gap-2">
            <Compare className="h-5 w-5" />
            Result Comparison ({comparisonResults.length})
          </h4>
          
          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={(value) => handleSortChange(value as ComparisonField)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="confidence">Confidence</SelectItem>
                <SelectItem value="citations">Citations</SelectItem>
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="authors">Authors</SelectItem>
                <SelectItem value="journal">Journal</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortDirection === 'desc' ? 'Desc' : 'Asc'}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onExportComparison && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportComparison}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          
          {onShareComparison && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareComparison}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          )}
          
          {onClearComparison && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearComparison}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Desktop View - Side by Side */}
          <div className="hidden lg:block">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(comparisonResults.length, 3)}, 1fr)` }}>
              {sortedResults.slice(0, 3).map((result) => (
                <Card key={result.comparisonId} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveFromComparison(result)}
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        
                        <CardTitle className="text-sm font-medium leading-tight mb-3 pr-8">
                          {result.title}
                        </CardTitle>
                        
                        {/* Score Badges */}
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Relevance:</span>
                            <Badge variant="outline" className={getScoreColor(result.relevanceScore)}>
                              {formatScore(result.relevanceScore)}%
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Quality:</span>
                            <Badge variant="outline" className={getScoreColor(result.qualityScore)}>
                              {formatScore(result.qualityScore)}%
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Confidence:</span>
                            <Badge variant="outline" className={getScoreColor(result.confidenceScore)}>
                              {formatScore(result.confidenceScore)}%
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Metadata */}
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div><strong>Authors:</strong> {result.authors.slice(0, 2).join(', ')}{result.authors.length > 2 ? '...' : ''}</div>
                          {result.journal && (
                            <div><strong>Journal:</strong> {result.journal}</div>
                          )}
                          <div className="flex items-center justify-between">
                            {result.year && (
                              <span><strong>Year:</strong> {result.year}</span>
                            )}
                            {result.citations !== undefined && (
                              <span><strong>Citations:</strong> {result.citations}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex flex-col gap-2">
                      {result.doi && (
                        <a
                          href={`https://doi.org/${result.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View DOI
                        </a>
                      )}
                      
                      {onAddReference && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddReference(result)}
                          disabled={addingReference === result.comparisonId}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          {addingReference === result.comparisonId ? 'Adding...' : 'Add Reference'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Show remaining results if more than 3 */}
            {sortedResults.length > 3 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  {sortedResults.length - 3} more results in comparison. 
                  Use mobile view or export to see all results.
                </p>
              </div>
            )}
          </div>

          {/* Mobile View - List */}
          <div className="lg:hidden space-y-3">
            {sortedResults.map((result, index) => (
              <Card key={result.comparisonId} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveFromComparison(result)}
                          className="h-6 w-6 p-0 ml-auto"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <CardTitle className="text-sm font-medium leading-tight mb-3">
                        {result.title}
                      </CardTitle>
                      
                      {/* Score Badges */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge variant="outline" className={getScoreColor(result.relevanceScore)}>
                          Rel: {formatScore(result.relevanceScore)}%
                        </Badge>
                        <Badge variant="outline" className={getScoreColor(result.qualityScore)}>
                          Qual: {formatScore(result.qualityScore)}%
                        </Badge>
                        <Badge variant="outline" className={getScoreColor(result.confidenceScore)}>
                          Conf: {formatScore(result.confidenceScore)}%
                        </Badge>
                      </div>
                      
                      {/* Metadata */}
                      <div className="text-xs text-muted-foreground space-y-1">
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
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
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
                    
                    {onAddReference && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddReference(result)}
                        disabled={addingReference === result.comparisonId}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {addingReference === result.comparisonId ? 'Adding...' : 'Add Reference'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}