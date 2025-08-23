import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './shadcn/card';
import { Button } from './shadcn/button';
import { Badge } from './shadcn/badge';
import { Progress } from './shadcn/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './shadcn/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Star,
  Calendar,
  Target,
  Activity
} from 'lucide-react';

interface SearchAnalytics {
  total_searches: number;
  average_results: number;
  popular_sources: ('ideas' | 'builder')[];
  search_frequency: Record<string, number>;
  period: {
    start: string;
    end: string;
  };
  successRate: number;
  popularTopics: string[];
  averageResults: number;
  topSources: ('ideas' | 'builder')[];
}

interface ConversionMetrics {
  totalSearches: number;
  totalResults: number;
  resultsViewed: number;
  resultsAdded: number;
  resultsRejected: number;
  conversionRate: number;
  viewRate: number;
  rejectionRate: number;
}

interface UserSatisfactionMetrics {
  averageOverallSatisfaction: number;
  averageRelevanceRating: number;
  averageQualityRating: number;
  averageEaseOfUseRating: number;
  recommendationRate: number;
  totalFeedbackCount: number;
}

interface UsageMetrics {
  totalResults: number;
  resultsByAction: Record<string, number>;
  averageRelevanceScore: number;
  averageQualityScore: number;
  topPerformingResults: any[];
}

interface AnalyticsData {
  searchAnalytics: SearchAnalytics;
  conversionMetrics: ConversionMetrics;
  satisfactionMetrics: UserSatisfactionMetrics;
  usageMetrics: UsageMetrics;
  trends: {
    searchTrend: Array<{ date: string; searches: number; success_rate: number }>;
    conversionTrend: Array<{ date: string; conversion_rate: number }>;
  };
  period: {
    days: number;
    start: string;
    end: string;
  };
}

interface SearchAnalyticsDashboardProps {
  conversationId: string;
  onClose?: () => void;
}

export function SearchAnalyticsDashboard({ conversationId, onClose }: SearchAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [conversationId, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ai-searcher/analytics?conversationId=${conversationId}&days=${period}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.analytics);
      } else {
        setError(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError('Failed to fetch analytics');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatRating = (value: number) => `${value.toFixed(1)}/5.0`;

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Search Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Search Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAnalytics} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Search Analytics Dashboard
            </CardTitle>
            <CardDescription>
              Analytics for the last {period} days
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value))}
              className="px-3 py-1 border rounded-md"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            {onClose && (
              <Button onClick={onClose} variant="outline" size="sm">
                Close
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.searchAnalytics.total_searches}</div>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(analytics.searchAnalytics.successRate)} success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Results</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.searchAnalytics.average_results.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  Per search query
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(analytics.conversionMetrics.conversionRate)}</div>
                <p className="text-xs text-muted-foreground">
                  Results added to library
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRating(analytics.satisfactionMetrics.averageOverallSatisfaction)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average rating
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Popular Topics and Sources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analytics.searchAnalytics.popularTopics.slice(0, 10).map((topic, index) => (
                    <Badge key={index} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.searchAnalytics.topSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="capitalize">{source}</span>
                      <Badge variant="outline">{source === 'ideas' ? 'Ideas' : 'Builder'}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conversion Tab */}
        <TabsContent value="conversion" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Results Added
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {analytics.conversionMetrics.resultsAdded}
                </div>
                <Progress 
                  value={analytics.conversionMetrics.conversionRate * 100} 
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formatPercentage(analytics.conversionMetrics.conversionRate)} conversion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Results Viewed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.conversionMetrics.resultsViewed}
                </div>
                <Progress 
                  value={analytics.conversionMetrics.viewRate * 100} 
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formatPercentage(analytics.conversionMetrics.viewRate)} view rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  Results Rejected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {analytics.conversionMetrics.resultsRejected}
                </div>
                <Progress 
                  value={analytics.conversionMetrics.rejectionRate * 100} 
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formatPercentage(analytics.conversionMetrics.rejectionRate)} rejection rate
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Total Results</span>
                  <span className="font-bold">{analytics.conversionMetrics.totalResults}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Results Viewed</span>
                  <span className="font-bold text-blue-600">
                    {analytics.conversionMetrics.resultsViewed} 
                    ({formatPercentage(analytics.conversionMetrics.viewRate)})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Results Added</span>
                  <span className="font-bold text-green-600">
                    {analytics.conversionMetrics.resultsAdded} 
                    ({formatPercentage(analytics.conversionMetrics.conversionRate)})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Satisfaction Tab */}
        <TabsContent value="satisfaction" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Overall Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRating(analytics.satisfactionMetrics.averageOverallSatisfaction)}
                </div>
                <Progress 
                  value={(analytics.satisfactionMetrics.averageOverallSatisfaction / 5) * 100} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Relevance Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRating(analytics.satisfactionMetrics.averageRelevanceRating)}
                </div>
                <Progress 
                  value={(analytics.satisfactionMetrics.averageRelevanceRating / 5) * 100} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quality Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRating(analytics.satisfactionMetrics.averageQualityRating)}
                </div>
                <Progress 
                  value={(analytics.satisfactionMetrics.averageQualityRating / 5) * 100} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ease of Use</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRating(analytics.satisfactionMetrics.averageEaseOfUseRating)}
                </div>
                <Progress 
                  value={(analytics.satisfactionMetrics.averageEaseOfUseRating / 5) * 100} 
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Feedback Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Recommendation Rate</p>
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage(analytics.satisfactionMetrics.recommendationRate / 100)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Feedback Count</p>
                  <div className="text-2xl font-bold">
                    {analytics.satisfactionMetrics.totalFeedbackCount}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Result Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.usageMetrics.resultsByAction).map(([action, count]) => (
                    <div key={action} className="flex items-center justify-between">
                      <span className="capitalize">{action}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Average Relevance</span>
                      <span className="text-sm font-medium">
                        {formatPercentage(analytics.usageMetrics.averageRelevanceScore)}
                      </span>
                    </div>
                    <Progress value={analytics.usageMetrics.averageRelevanceScore * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm">Average Quality</span>
                      <span className="text-sm font-medium">
                        {formatPercentage(analytics.usageMetrics.averageQualityScore)}
                      </span>
                    </div>
                    <Progress value={analytics.usageMetrics.averageQualityScore * 100} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold">{analytics.usageMetrics.totalResults}</div>
                <p className="text-muted-foreground">Total search results processed</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}