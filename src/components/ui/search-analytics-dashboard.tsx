"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn/card"
import { Button } from "./shadcn/button"
import { Badge } from "./shadcn/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./shadcn/tabs"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Users, 
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  Filter,
  Download
} from "lucide-react"

interface SearchAnalyticsDashboardProps {
  conversationId: string
  userId: string
  className?: string
}

interface SearchHistoryStats {
  totalSearches: number
  successfulSearches: number
  averageResultsPerSearch: number
  averageSuccessRate: number
  averageProcessingTime: number
  mostUsedContentSources: Array<{
    source: 'ideas' | 'builder'
    count: number
    percentage: number
  }>
  topSearchQueries: Array<{
    query: string
    count: number
    averageResults: number
    successRate: number
  }>
  searchTrends: Array<{
    date: string
    searchCount: number
    successRate: number
    averageResults: number
  }>
}

interface ContentSourceUsage {
  source: 'ideas' | 'builder'
  totalUsage: number
  successfulSearches: number
  averageResults: number
  topKeywords: string[]
  recentUsage: Array<{
    date: string
    count: number
  }>
}

interface SuccessRateTracking {
  date: string
  totalSearches: number
  successfulSearches: number
  successRate: number
  averageResults: number
}

export const SearchAnalyticsDashboard: React.FC<SearchAnalyticsDashboardProps> = ({
  conversationId,
  userId,
  className = ""
}) => {
  const [stats, setStats] = useState<SearchHistoryStats | null>(null)
  const [contentUsage, setContentUsage] = useState<ContentSourceUsage[]>([])
  const [successTracking, setSuccessTracking] = useState<SuccessRateTracking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = async (days: number = 30) => {
    try {
      setLoading(true)
      setError(null)

      // Fetch search history statistics
      const statsResponse = await fetch(
        `/api/ai-searcher/history/stats?conversationId=${conversationId}&days=${days}`
      )
      const statsData = await statsResponse.json()

      if (!statsData.success) {
        throw new Error(statsData.error || 'Failed to fetch statistics')
      }

      setStats(statsData.stats)

      // Fetch content source usage
      const usageResponse = await fetch(
        `/api/ai-searcher/history/content-usage?conversationId=${conversationId}&days=${days}`
      )
      const usageData = await usageResponse.json()

      if (!usageData.success) {
        throw new Error(usageData.error || 'Failed to fetch content usage')
      }

      setContentUsage(usageData.usage)

      // Fetch success rate tracking (using enhanced search history manager)
      const trackingResponse = await fetch(
        `/api/ai-searcher/analytics/success-tracking?conversationId=${conversationId}&days=${days}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            conversationId,
            days
          })
        }
      )
      const trackingData = await trackingResponse.json()

      if (trackingData.success) {
        setSuccessTracking(trackingData.tracking || [])
      }

    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics(selectedPeriod)
  }

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days)
    fetchAnalytics(days)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600'
    if (rate >= 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <div className="h-4 w-4" />
  }

  useEffect(() => {
    fetchAnalytics(selectedPeriod)
  }, [conversationId, userId])

  if (loading && !stats) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading analytics...</span>
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
          <h2 className="text-2xl font-bold">Search Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics for your AI search activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant={selectedPeriod === 7 ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange(7)}
            >
              7 days
            </Button>
            <Button
              variant={selectedPeriod === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange(30)}
            >
              30 days
            </Button>
            <Button
              variant={selectedPeriod === 90 ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange(90)}
            >
              90 days
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSearches}</div>
              <p className="text-xs text-muted-foreground">
                {stats.successfulSearches} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSuccessRateColor(stats.averageSuccessRate)}`}>
                {formatPercentage(stats.averageSuccessRate)}
              </div>
              <p className="text-xs text-muted-foreground">
                Average across all searches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Results</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageResultsPerSearch.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Results per search
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(stats.averageProcessingTime)}
              </div>
              <p className="text-xs text-muted-foreground">
                Processing time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="sources">Content Sources</TabsTrigger>
          <TabsTrigger value="queries">Top Queries</TabsTrigger>
          <TabsTrigger value="success">Success Tracking</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {stats && stats.searchTrends.length > 0 ? (
                <div className="space-y-4">
                  {stats.searchTrends.slice(0, 10).map((trend, index) => (
                    <div key={trend.date} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{trend.date}</div>
                          <div className="text-sm text-muted-foreground">
                            {trend.searchCount} searches
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`font-medium ${getSuccessRateColor(trend.successRate)}`}>
                            {formatPercentage(trend.successRate)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {trend.averageResults.toFixed(1)} avg results
                          </div>
                        </div>
                        {index > 0 && getTrendIcon(trend.searchCount, stats.searchTrends[index - 1].searchCount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                  <p>No trend data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Usage Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Content Source Usage</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && stats.mostUsedContentSources.length > 0 ? (
                  <div className="space-y-3">
                    {stats.mostUsedContentSources.map((source) => (
                      <div key={source.source} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {source.source}
                          </Badge>
                          <span className="text-sm">{source.count} uses</span>
                        </div>
                        <div className="text-sm font-medium">
                          {source.percentage.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <Users className="h-6 w-6 mx-auto mb-2" />
                    <p>No source usage data</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Source Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Source Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                {contentUsage.length > 0 ? (
                  <div className="space-y-4">
                    {contentUsage.map((usage) => (
                      <div key={usage.source} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{usage.source}</Badge>
                          <div className="text-sm text-muted-foreground">
                            {usage.totalUsage} total uses
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Success: </span>
                            <span className="font-medium">{usage.successfulSearches}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg Results: </span>
                            <span className="font-medium">{usage.averageResults.toFixed(1)}</span>
                          </div>
                        </div>
                        {usage.topKeywords.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground mb-1">Top Keywords:</div>
                            <div className="flex flex-wrap gap-1">
                              {usage.topKeywords.slice(0, 3).map((keyword, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <Filter className="h-6 w-6 mx-auto mb-2" />
                    <p>No effectiveness data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Queries Tab */}
        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Search Queries</CardTitle>
            </CardHeader>
            <CardContent>
              {stats && stats.topSearchQueries.length > 0 ? (
                <div className="space-y-3">
                  {stats.topSearchQueries.map((query, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">"{query.query}"</div>
                        <div className="text-xs text-muted-foreground">
                          Used {query.count} times
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{query.averageResults.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">avg results</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-medium ${getSuccessRateColor(query.successRate)}`}>
                            {formatPercentage(query.successRate)}
                          </div>
                          <div className="text-xs text-muted-foreground">success</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Search className="h-8 w-8 mx-auto mb-2" />
                  <p>No query data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Success Tracking Tab */}
        <TabsContent value="success" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Success Rate Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              {successTracking.length > 0 ? (
                <div className="space-y-3">
                  {successTracking.slice(0, 15).map((tracking, index) => (
                    <div key={tracking.date} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{tracking.date}</div>
                          <div className="text-sm text-muted-foreground">
                            {tracking.totalSearches} searches
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{tracking.successfulSearches}</span>
                        </div>
                        <div className={`font-medium ${getSuccessRateColor(tracking.successRate)}`}>
                          {formatPercentage(tracking.successRate)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tracking.averageResults.toFixed(1)} avg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Target className="h-8 w-8 mx-auto mb-2" />
                  <p>No success tracking data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}