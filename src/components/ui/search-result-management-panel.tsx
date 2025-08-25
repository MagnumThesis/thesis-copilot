"use client"

import React, { useState, useEffect } from "react"
import { Button } from "./shadcn/button"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./shadcn/tabs"
import { Badge } from "./shadcn/badge"
import { 
  Bookmark, 
  Compare, 
  Download, 
  Share2, 
  Settings,
  X,
  RefreshCw
} from "lucide-react"
import { ScholarSearchResult } from "../../lib/ai-types"
import { BookmarkedResultsList, BookmarkedResult } from "./search-result-bookmark"
import { SearchResultComparison, ComparisonResult } from "./search-result-comparison"
import { SearchResultExport, ExportOptions } from "./search-result-export"
import { SearchResultSharing, ShareOptions, SharedResult } from "./search-result-sharing"

interface SearchResultManagementPanelProps {
  userId: string
  onAddReference?: (result: ScholarSearchResult) => Promise<void>
  onClose?: () => void
  className?: string
}

export const SearchResultManagementPanel: React.FC<SearchResultManagementPanelProps> = ({
  userId,
  onAddReference,
  onClose,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'comparison' | 'export' | 'sharing'>('bookmarks')
  const [bookmarkedResults, setBookmarkedResults] = useState<BookmarkedResult[]>([])
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load data on mount and when userId changes
  useEffect(() => {
    if (userId) {
      loadBookmarkedResults()
      loadComparisonResults()
    }
  }, [userId])

  const loadBookmarkedResults = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/search-result-management/bookmarks/${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setBookmarkedResults(data.bookmarks || [])
      } else {
        throw new Error(data.error || 'Failed to load bookmarks')
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error)
      setError(error instanceof Error ? error.message : 'Failed to load bookmarks')
    } finally {
      setLoading(false)
    }
  }

  const loadComparisonResults = async () => {
    try {
      const response = await fetch(`/api/search-result-management/comparison/${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setComparisonResults(data.comparisons || [])
      } else {
        throw new Error(data.error || 'Failed to load comparison results')
      }
    } catch (error) {
      console.error('Error loading comparison results:', error)
      setError(error instanceof Error ? error.message : 'Failed to load comparison results')
    }
  }

  const handleRemoveBookmark = async (result: BookmarkedResult) => {
    try {
      const response = await fetch('/api/search-result-management/bookmarks', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result,
          userId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setBookmarkedResults(prev => prev.filter(b => b.bookmarkId !== result.bookmarkId))
      } else {
        throw new Error(data.error || 'Failed to remove bookmark')
      }
    } catch (error) {
      console.error('Error removing bookmark:', error)
      throw error
    }
  }

  const handleRemoveFromComparison = (result: ComparisonResult) => {
    setComparisonResults(prev => prev.filter(c => c.comparisonId !== result.comparisonId))
  }

  const handleClearComparison = async () => {
    try {
      const response = await fetch(`/api/search-result-management/comparison/${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        setComparisonResults([])
      } else {
        throw new Error(data.error || 'Failed to clear comparison')
      }
    } catch (error) {
      console.error('Error clearing comparison:', error)
    }
  }

  const handleExportResults = async (results: ScholarSearchResult[], options: ExportOptions): Promise<string> => {
    try {
      const response = await fetch('/api/search-result-management/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results,
          options
        })
      })

      const data = await response.json()
      
      if (data.success) {
        return data.content
      } else {
        throw new Error(data.error || 'Export failed')
      }
    } catch (error) {
      console.error('Error exporting results:', error)
      throw error
    }
  }

  const handleShareResults = async (results: ScholarSearchResult[], options: ShareOptions): Promise<SharedResult> => {
    try {
      const response = await fetch('/api/search-result-management/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results,
          options,
          userId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        return data.sharedResult
      } else {
        throw new Error(data.error || 'Sharing failed')
      }
    } catch (error) {
      console.error('Error sharing results:', error)
      throw error
    }
  }

  const handleRefresh = () => {
    loadBookmarkedResults()
    loadComparisonResults()
  }

  const getTabCount = (tab: string): number => {
    switch (tab) {
      case 'bookmarks':
        return bookmarkedResults.length
      case 'comparison':
        return comparisonResults.length
      default:
        return 0
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Search Result Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="bookmarks" className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Bookmarks
                {getTabCount('bookmarks') > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getTabCount('bookmarks')}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <Compare className="h-4 w-4" />
                Compare
                {getTabCount('comparison') > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getTabCount('comparison')}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </TabsTrigger>
              <TabsTrigger value="sharing" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              <TabsContent value="bookmarks" className="space-y-4">
                <BookmarkedResultsList
                  bookmarkedResults={bookmarkedResults}
                  onRemoveBookmark={handleRemoveBookmark}
                  onAddReference={onAddReference}
                />
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4">
                <SearchResultComparison
                  comparisonResults={comparisonResults}
                  onRemoveFromComparison={handleRemoveFromComparison}
                  onAddReference={onAddReference}
                  onClearComparison={handleClearComparison}
                />
              </TabsContent>

              <TabsContent value="export" className="space-y-4">
                {bookmarkedResults.length > 0 || comparisonResults.length > 0 ? (
                  <div className="space-y-4">
                    {bookmarkedResults.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Export Bookmarked Results</h5>
                        <SearchResultExport
                          results={bookmarkedResults}
                          onExport={handleExportResults}
                        />
                      </div>
                    )}
                    
                    {comparisonResults.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Export Comparison Results</h5>
                        <SearchResultExport
                          results={comparisonResults}
                          onExport={handleExportResults}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No results to export</p>
                    <p className="text-sm">Bookmark or add results to comparison first.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sharing" className="space-y-4">
                {bookmarkedResults.length > 0 || comparisonResults.length > 0 ? (
                  <div className="space-y-4">
                    {bookmarkedResults.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Share Bookmarked Results</h5>
                        <SearchResultSharing
                          results={bookmarkedResults}
                          onShare={handleShareResults}
                        />
                      </div>
                    )}
                    
                    {comparisonResults.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Share Comparison Results</h5>
                        <SearchResultSharing
                          results={comparisonResults}
                          onShare={handleShareResults}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No results to share</p>
                    <p className="text-sm">Bookmark or add results to comparison first.</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}