"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Button } from "./shadcn/button"
import { Input } from "./shadcn/input"
import { Badge } from "./shadcn/badge"
import { Progress } from "./shadcn/progress"
import { 
  History, 
  Search, 
  Filter, 
  Trash2, 
  Download,
  RefreshCw,
  Calendar,
  Clock,
  Target,
  FileText,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react"

interface SearchHistoryEntry {
  id: string;
  conversationId: string;
  userId: string;
  searchQuery: string;
  contentSources: ('ideas' | 'builder')[];
  contentSourceDetails: Array<{
    source: 'ideas' | 'builder';
    id: string;
    title: string;
    extractedKeywords: string[];
  }>;
  searchFilters: Record<string, any>;
  resultsCount: number;
  resultsAccepted: number;
  resultsRejected: number;
  searchSuccess: boolean;
  successRate: number;
  processingTimeMs: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SearchHistoryFilter {
  dateRange?: {
    start: Date;
    end: Date;
  };
  contentSources?: ('ideas' | 'builder')[];
  successOnly?: boolean;
  minResultsCount?: number;
  searchQuery?: string;
}

interface SearchHistoryPanelProps {
  conversationId: string;
  userId?: string;
  onSearchQuerySelect?: (query: string) => void;
  className?: string;
}

export const SearchHistoryPanel: React.FC<SearchHistoryPanelProps> = ({
  conversationId,
  userId,
  onSearchQuerySelect,
  className = ""
}) => {
  const [entries, setEntries] = useState<SearchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<SearchHistoryFilter>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const pageSize = 20;

  const fetchHistory = async (page: number = 0, currentFilter?: SearchHistoryFilter) => {
    try {
      setLoading(page === 0);
      setError(null);

      const params = new URLSearchParams({
        conversationId,
        limit: pageSize.toString(),
        offset: (page * pageSize).toString()
      });

      if (currentFilter?.searchQuery) {
        params.append('searchQuery', currentFilter.searchQuery);
      }
      if (currentFilter?.successOnly) {
        params.append('successOnly', 'true');
      }
      if (currentFilter?.minResultsCount) {
        params.append('minResultsCount', currentFilter.minResultsCount.toString());
      }
      if (currentFilter?.contentSources && currentFilter.contentSources.length > 0) {
        params.append('contentSources', currentFilter.contentSources.join(','));
      }
      if (currentFilter?.dateRange) {
        params.append('startDate', currentFilter.dateRange.start.toISOString());
        params.append('endDate', currentFilter.dateRange.end.toISOString());
      }

      const response = await fetch(`/api/ai-searcher/history?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch search history');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch search history');
      }

      const newEntries = data.entries.map((entry: any) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt)
      }));

      if (page === 0) {
        setEntries(newEntries);
      } else {
        setEntries(prev => [...prev, ...newEntries]);
      }

      setTotalEntries(data.total);
      setHasMore(data.hasMore);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching search history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch search history');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(0);
    await fetchHistory(0, filter);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchHistory(currentPage + 1, filter);
    }
  };

  const handleFilterChange = (newFilter: SearchHistoryFilter) => {
    setFilter(newFilter);
    setCurrentPage(0);
    fetchHistory(0, newFilter);
  };

  const handleDeleteSelected = async () => {
    if (selectedEntries.size === 0) return;

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
      });

      if (!response.ok) {
        throw new Error('Failed to delete entries');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete entries');
      }

      // Remove deleted entries from state
      setEntries(prev => prev.filter(entry => !selectedEntries.has(entry.id)));
      setSelectedEntries(new Set());
      setTotalEntries(prev => prev - selectedEntries.size);
    } catch (err) {
      console.error('Error deleting entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete entries');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all search history? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/ai-searcher/history?conversationId=${conversationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to clear history');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to clear history');
      }

      setEntries([]);
      setSelectedEntries(new Set());
      setTotalEntries(0);
      setHasMore(false);
    } catch (err) {
      console.error('Error clearing history:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear history');
    }
  };

  const handleExportHistory = async () => {
    try {
      const response = await fetch(
        `/api/ai-searcher/history/export?conversationId=${conversationId}&format=csv`
      );
      
      if (!response.ok) {
        throw new Error('Failed to export history');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting history:', err);
      setError(err instanceof Error ? err.message : 'Failed to export history');
    }
  };

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600';
    if (rate >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    fetchHistory(0, filter);
  }, [conversationId]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Search History</h3>
          {totalEntries > 0 && (
            <Badge variant="outline">{totalEntries} entries</Badge>
          )}
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
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportHistory}
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

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Search Filters
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search Query</label>
                <Input
                  placeholder="Filter by query..."
                  value={filter.searchQuery || ''}
                  onChange={(e) => handleFilterChange({ ...filter, searchQuery: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Content Sources</label>
                <div className="flex gap-2">
                  <Button
                    variant={filter.contentSources?.includes('ideas') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const sources = filter.contentSources || [];
                      const newSources = sources.includes('ideas')
                        ? sources.filter(s => s !== 'ideas')
                        : [...sources, 'ideas'];
                      handleFilterChange({ ...filter, contentSources: newSources });
                    }}
                  >
                    Ideas
                  </Button>
                  <Button
                    variant={filter.contentSources?.includes('builder') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const sources = filter.contentSources || [];
                      const newSources = sources.includes('builder')
                        ? sources.filter(s => s !== 'builder')
                        : [...sources, 'builder'];
                      handleFilterChange({ ...filter, contentSources: newSources });
                    }}
                  >
                    Builder
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Options</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filter.successOnly || false}
                      onChange={(e) => handleFilterChange({ ...filter, successOnly: e.target.checked })}
                    />
                    Successful searches only
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange({})}
              >
                Clear Filters
              </Button>
              {entries.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAll}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All History
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="text-red-600 text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* History Entries */}
      {loading && entries.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading search history...</span>
            </div>
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No search history found</p>
              <p className="text-sm">Your AI search history will appear here</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedEntries.has(entry.id)}
                    onChange={() => toggleEntrySelection(entry.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{entry.searchQuery}</span>
                          {onSearchQuerySelect && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSearchQuerySelect(entry.searchQuery)}
                              className="h-6 px-2 text-xs"
                            >
                              Use Query
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(entry.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {(entry.processingTimeMs / 1000).toFixed(1)}s
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {entry.searchSuccess ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Failed
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content Sources */}
                    {entry.contentSources.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Sources:</span>
                        {entry.contentSources.map((source) => (
                          <Badge key={source} variant="outline" className="text-xs">
                            {source.charAt(0).toUpperCase() + source.slice(1)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Results Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{entry.resultsCount}</div>
                          <div className="text-xs text-muted-foreground">Results</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{entry.resultsAccepted}</div>
                          <div className="text-xs text-muted-foreground">Added</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`text-sm font-medium ${getSuccessRateColor(entry.successRate)}`}>
                          {(entry.successRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Success</div>
                      </div>
                    </div>

                    {/* Success Rate Progress */}
                    {entry.resultsCount > 0 && (
                      <div className="space-y-1">
                        <Progress value={entry.successRate * 100} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{entry.resultsAccepted} accepted</span>
                          <span>{entry.resultsRejected} rejected</span>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {entry.errorMessage && (
                      <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        {entry.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Load More
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};