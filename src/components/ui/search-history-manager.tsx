"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Button } from "./shadcn/button"
import { Input } from "./shadcn/input"
import { Badge } from "./shadcn/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./shadcn/tabs"
import { 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react"

interface SearchHistoryManagerProps {
  conversationId: string
  userId: string
  className?: string
}

interface SearchHistoryEntry {
  id: string
  conversationId: string
  userId: string
  searchQuery: string
  contentSources: ('ideas' | 'builder')[]
  contentSourceDetails: Array<{
    source: 'ideas' | 'builder'
    id: string
    title: string
    extractedKeywords: string[]
  }>
  searchFilters: Record<string, any>
  resultsCount: number
  resultsAccepted: number
  resultsRejected: number
  searchSuccess: boolean
  successRate: number
  processingTimeMs: number
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

interface SearchHistoryFilter {
  dateRange?: {
    start: Date
    end: Date
  }
  contentSources?: ('ideas' | 'builder')[]
  successOnly?: boolean
  minResultsCount?: number
  searchQuery?: string
}

export const SearchHistoryManager: React.FC<SearchHistoryManagerProps> = ({
  conversationId,
  userId,
  className = ""
}) => {
  const [entries, setEntries] = useState<SearchHistoryEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<SearchHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<SearchHistoryFilter>({})
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 20

  const fetchHistory = async (resetOffset = false) => {
    try {
      setLoading(true)
      setError(null)

      const currentOffset = resetOffset ? 0 : offset
      const params = new URLSearchParams({
        conversationId,
        limit: limit.toString(),
        offset: currentOffset.toString()
      })

      // Add filter parameters
      if (filter.searchQuery) {
        params.append('searchQuery', filter.searchQuery)
      }
      if (filter.successOnly) {
        params.append('successOnly', 'true')
      }
      if (filter.minResultsCount) {
        params.append('minResultsCount', filter.minResultsCount.toString())
      }
      if (filter.contentSources && filter.contentSources.length > 0) {
        params.append('contentSources', filter.contentSources.join(','))
      }
      if (filter.dateRange) {
        params.append('startDate', filter.dateRange.start.toISOString())
        params.append('endDate', filter.dateRange.end.toISOString())
      }

      const response = await fetch(`/api/ai-searcher/history?${params}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch search history')
      }

      const newEntries = data.entries.map((entry: any) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }))

      if (resetOffset) {
        setEntries(newEntries)
        setOffset(limit)
      } else {
        setEntries(prev => [...prev, ...newEntries])
        setOffset(prev => prev + limit)
      }

      setTotal(data.total)
      setHasMore(data.hasMore)

    } catch (err) {
      console.error('Error fetching search history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load search history')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = entries

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(entry =>
        entry.searchQuery.toLowerCase().includes(term) ||
        entry.contentSources.some(source => source.toLowerCase().includes(term))
      )
    }

    setFilteredEntries(filtered)
  }

  const handleFilterChange = (newFilter: Partial<SearchHistoryFilter>) => {
    const updatedFilter = { ...filter, ...newFilter }
    setFilter(updatedFilter)
    fetchHistory(true) // Reset and refetch with new filters
  }

  const handleClearFilters = () => {
    setFilter({})
    setSearchTerm("")
    fetchHistory(true)
  }

  const handleDeleteSelected = async () => {
    if (selectedEntries.size === 0) return

    try {
      const response = await fetch('/api/ai-searcher/history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          entryIds: Array.from(selectedEntries)
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete entries')
      }

      // Remove deleted entries from state
      setEntries(prev => prev.filter(entry => !selectedEntries.has(entry.id)))
      setSelectedEntries(new Set())

    } catch (err) {
      console.error('Error deleting entries:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete entries')
    }
  }

  const handleExportHistory = async (format: 'json' | 'csv' = 'csv') => {
    try {
      const response = await fetch(
        `/api/ai-searcher/history/export?conversationId=${conversationId}&format=${format}`
      )
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `search-history-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error exporting history:', err)
      setError(err instanceof Error ? err.message : 'Failed to export history')
    }
  }

  const toggleEntrySelection = (entryId: string) => {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId)
    } else {
      newSelected.add(entryId)
    }
    setSelectedEntries(newSelected)
  }

  const toggleEntryExpansion = (entryId: string) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600'
    if (rate >= 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  useEffect(() => {
    fetchHistory(true)
  }, [conversationId, userId])

  useEffect(() => {
    applyFilters()
  }, [entries, searchTerm])

  if (loading && entries.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading search history...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Search History</h2>
          <p className="text-muted-foreground">
            Manage and analyze your AI search activity ({total} total entries)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportHistory('csv')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {selectedEntries.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedEntries.size})
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search queries, sources, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={Object.keys(filter).length === 0 && !searchTerm}
            >
              Clear
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">Content Sources</label>
                <div className="flex gap-2">
                  <Button
                    variant={filter.contentSources?.includes('ideas') ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const sources = filter.contentSources || []
                      const newSources = sources.includes('ideas')
                        ? sources.filter(s => s !== 'ideas')
                        : [...sources, 'ideas']
                      handleFilterChange({ contentSources: newSources.length > 0 ? newSources : undefined })
                    }}
                  >
                    Ideas
                  </Button>
                  <Button
                    variant={filter.contentSources?.includes('builder') ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const sources = filter.contentSources || []
                      const newSources = sources.includes('builder')
                        ? sources.filter(s => s !== 'builder')
                        : [...sources, 'builder']
                      handleFilterChange({ contentSources: newSources.length > 0 ? newSources : undefined })
                    }}
                  >
                    Builder
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Success Filter</label>
                <Button
                  variant={filter.successOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange({ successOnly: !filter.successOnly })}
                >
                  Successful Only
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Min Results</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filter.minResultsCount || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    handleFilterChange({ 
                      minResultsCount: isNaN(value) ? undefined : value 
                    })
                  }}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* History Entries */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2" />
                <p>No search history found</p>
                <p className="text-sm">Try adjusting your filters or search terms</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedEntries.has(entry.id)}
                      onChange={() => toggleEntrySelection(entry.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm">
                          "{entry.searchQuery}"
                        </h4>
                        <Badge 
                          variant={entry.searchSuccess ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {entry.searchSuccess ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(entry.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {entry.resultsCount} results
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {(entry.processingTimeMs / 1000).toFixed(1)}s
                        </span>
                        {entry.successRate > 0 && (
                          <span className={`flex items-center gap-1 ${getSuccessRateColor(entry.successRate)}`}>
                            {entry.successRate > 0.7 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {(entry.successRate * 100).toFixed(0)}% success
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {entry.contentSources.map((source, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {source}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleEntryExpansion(entry.id)}
                    >
                      {expandedEntry === entry.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedEntry === entry.id && (
                <CardContent className="pt-0">
                  <div className="space-y-4 border-t pt-4">
                    {/* Content Source Details */}
                    {entry.contentSourceDetails.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Content Sources:</h5>
                        <div className="space-y-2">
                          {entry.contentSourceDetails.map((detail, i) => (
                            <div key={i} className="bg-muted p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{detail.source}</Badge>
                                <span className="text-sm font-medium">{detail.title}</span>
                              </div>
                              {detail.extractedKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {detail.extractedKeywords.map((keyword, j) => (
                                    <Badge key={j} variant="secondary" className="text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search Filters */}
                    {Object.keys(entry.searchFilters).length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Search Filters:</h5>
                        <div className="bg-muted p-3 rounded-lg">
                          <pre className="text-xs">
                            {JSON.stringify(entry.searchFilters, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Results Summary */}
                    <div>
                      <h5 className="font-medium text-sm mb-2">Results Summary:</h5>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{entry.resultsCount}</div>
                          <div className="text-muted-foreground">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{entry.resultsAccepted}</div>
                          <div className="text-muted-foreground">Added</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600">{entry.resultsRejected}</div>
                          <div className="text-muted-foreground">Rejected</div>
                        </div>
                      </div>
                    </div>

                    {/* Error Message */}
                    {entry.errorMessage && (
                      <div>
                        <h5 className="font-medium text-sm mb-2 text-red-600">Error:</h5>
                        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                          <p className="text-sm text-red-700">{entry.errorMessage}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchHistory(false)}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}