"use client"

import React, { useState, useEffect } from "react"
import { Button } from "./shadcn/button"
import { Badge } from "./shadcn/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Bookmark, BookmarkCheck, Trash2, Eye, GitCompare, Share2 } from "lucide-react"
import { ScholarSearchResult } from "../../lib/ai-types"

export interface BookmarkedResult extends ScholarSearchResult {
  bookmarkId: string
  bookmarkedAt: Date
  tags: string[]
  notes?: string
}

interface SearchResultBookmarkProps {
  result: ScholarSearchResult
  isBookmarked: boolean
  onBookmark: (result: ScholarSearchResult) => Promise<void>
  onRemoveBookmark: (result: ScholarSearchResult) => Promise<void>
  onView?: (result: ScholarSearchResult) => void
  onCompare?: (result: ScholarSearchResult) => void
  onShare?: (result: ScholarSearchResult) => void
  disabled?: boolean
}

export const SearchResultBookmark: React.FC<SearchResultBookmarkProps> = ({
  result,
  isBookmarked,
  onBookmark,
  onRemoveBookmark,
  onView,
  onCompare,
  onShare,
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleBookmarkToggle = async () => {
    if (disabled || isProcessing) return

    setIsProcessing(true)
    try {
      if (isBookmarked) {
        await onRemoveBookmark(result)
      } else {
        await onBookmark(result)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleView = () => {
    if (onView) {
      onView(result)
    }
  }

  const handleCompare = () => {
    if (onCompare) {
      onCompare(result)
    }
  }

  const handleShare = () => {
    if (onShare) {
      onShare(result)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={isBookmarked ? "default" : "outline"}
        size="sm"
        onClick={handleBookmarkToggle}
        disabled={disabled || isProcessing}
        className="flex items-center gap-1"
        title={isBookmarked ? "Remove bookmark" : "Bookmark result"}
      >
        {isBookmarked ? (
          <BookmarkCheck className="h-4 w-4" />
        ) : (
          <Bookmark className="h-4 w-4" />
        )}
        {isProcessing ? 'Processing...' : (isBookmarked ? 'Bookmarked' : 'Bookmark')}
      </Button>

      {onView && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleView}
          disabled={disabled}
          title="View details"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}

      {onCompare && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCompare}
          disabled={disabled}
          title="Add to comparison"
        >
          <GitCompare className="h-4 w-4" />
        </Button>
      )}

      {onShare && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={disabled}
          title="Share result"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

interface BookmarkedResultsListProps {
  bookmarkedResults: BookmarkedResult[]
  onRemoveBookmark: (result: BookmarkedResult) => Promise<void>
  onView?: (result: BookmarkedResult) => void
  onCompare?: (result: BookmarkedResult) => void
  onShare?: (result: BookmarkedResult) => void
  onAddReference?: (result: BookmarkedResult) => Promise<void>
  className?: string
}

export const BookmarkedResultsList: React.FC<BookmarkedResultsListProps> = ({
  bookmarkedResults,
  onRemoveBookmark,
  onView,
  onCompare,
  onShare,
  onAddReference,
  className = ""
}) => {
  const [removingBookmark, setRemovingBookmark] = useState<string | null>(null)

  const handleRemoveBookmark = async (result: BookmarkedResult) => {
    setRemovingBookmark(result.bookmarkId)
    try {
      await onRemoveBookmark(result)
    } catch (error) {
      console.error('Error removing bookmark:', error)
    } finally {
      setRemovingBookmark(null)
    }
  }

  if (bookmarkedResults.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No bookmarked results</p>
        <p className="text-sm">Bookmark search results to save them for later.</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold">
          Bookmarked Results ({bookmarkedResults.length})
        </h4>
      </div>

      <div className="space-y-3">
        {bookmarkedResults.map((result) => (
          <Card key={result.bookmarkId} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-sm font-medium leading-tight mb-2">
                    {result.title}
                  </CardTitle>
                  
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
                    <div className="text-xs text-muted-foreground">
                      Bookmarked: {result.bookmarkedAt.toLocaleDateString()}
                    </div>
                  </div>

                  {result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {result.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <strong>Notes:</strong> {result.notes}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1 ml-4">
                  {onView && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(result)}
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}

                  {onCompare && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCompare(result)}
                      title="Add to comparison"
                    >
                      <GitCompare className="h-4 w-4" />
                    </Button>
                  )}

                  {onShare && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onShare(result)}
                      title="Share result"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  )}

                  {onAddReference && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddReference(result)}
                      title="Add to references"
                    >
                      Add Reference
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveBookmark(result)}
                    disabled={removingBookmark === result.bookmarkId}
                    title="Remove bookmark"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}