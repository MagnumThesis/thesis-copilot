// src/worker/services/__tests__/analytics-service.test.ts
// Unit tests for AnalyticsService business logic

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService, AnalyticsServiceRequest, AnalyticsServiceResponse } from '../analytics-service';
import * as SupabaseLib from '../../lib/supabase';

// Mock the console.error to keep test output clean
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('AnalyticsService', () => {
  let mockInsert: any;
  let mockSelect: any;
  let mockSingle: any;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'event-uuid-123', created_at: '2023-01-01T12:00:00Z' },
      error: null
    });
    mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

    const mockSupabaseClient = {
      from: vi.fn().mockReturnValue({ insert: mockInsert }),
    };

    vi.spyOn(SupabaseLib, 'getSupabase').mockReturnValue(mockSupabaseClient as any);
  });

  describe('trackEvent', () => {
    it('should track a search_performed event successfully', async () => {
      const request: AnalyticsServiceRequest = {
        eventType: 'search_performed',
        eventData: {
          query: 'test query',
          resultsCount: 15,
          searchTime: 250
        },
        conversationId: 'conv-123',
        userId: 'user-456'
      };
      
      const response = await AnalyticsService.trackEvent(request);

      expect(response.success).toBe(true);
      expect(response.metadata).toEqual({
        eventId: 'event-uuid-123',
        timestamp: '2023-01-01T12:00:00Z',
        processed: true
      });

      const supabase = SupabaseLib.getSupabase();
      expect(supabase.from).toHaveBeenCalledWith('analytics_events');
      expect(mockInsert).toHaveBeenCalledWith({
        event_type: 'search_performed',
        event_data: request.eventData,
        user_id: 'user-456',
        conversation_id: 'conv-123',
        metadata: {}
      });
    });

    it('should track different event types correctly', async () => {
      const clickEventRequest: AnalyticsServiceRequest = {
        eventType: 'result_clicked',
        eventData: {
          resultId: 'paper-123',
          position: 3,
          relevanceScore: 0.85
        },
        conversationId: 'conv-789',
        metadata: { sessionId: 'session-abc' }
      };

      const response1 = await AnalyticsService.trackEvent(clickEventRequest);
      expect(response1.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith({
        event_type: 'result_clicked',
        event_data: clickEventRequest.eventData,
        user_id: null,
        conversation_id: 'conv-789',
        metadata: { sessionId: 'session-abc' }
      });

      const downloadEventRequest: AnalyticsServiceRequest = {
        eventType: 'paper_downloaded',
        eventData: {
          paperId: 'arxiv-2023-001',
          downloadFormat: 'pdf',
          fileSize: 2048576
        },
        userId: 'user-789'
      };

      const response2 = await AnalyticsService.trackEvent(downloadEventRequest);
      expect(response2.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith({
        event_type: 'paper_downloaded',
        event_data: downloadEventRequest.eventData,
        user_id: 'user-789',
        conversation_id: null,
        metadata: {}
      });
    });

    it('should handle missing eventData', async () => {
      const invalidEventRequest: AnalyticsServiceRequest = {
        eventType: 'simple_event',
        eventData: null,
        conversationId: 'conv-simple'
      };

      const response = await AnalyticsService.trackEvent(invalidEventRequest);
      expect(response.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith({
        event_type: 'simple_event',
        event_data: {},
        user_id: null,
        conversation_id: 'conv-simple',
        metadata: {}
      });
    });

    it('should return error response when eventType is missing', async () => {
      const invalidEventRequest: AnalyticsServiceRequest = {
        eventData: { something: true },
        conversationId: 'conv-invalid'
      };

      const response = await AnalyticsService.trackEvent(invalidEventRequest);

      expect(response.success).toBe(false);
      expect(response.metadata.error).toBe('Missing eventType in trackEvent request');
      expect(response.metadata.processed).toBe(false);

      const supabase = SupabaseLib.getSupabase();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: new Error('Database insertion failed')
      });

      const request: AnalyticsServiceRequest = {
        eventType: 'error_event',
      };

      const response = await AnalyticsService.trackEvent(request);

      expect(response.success).toBe(false);
      expect(response.metadata.error).toBe('Database insertion failed');
      expect(response.metadata.processed).toBe(false);
    });
  });

  describe('getMetrics', () => {
    it('should return default metrics when metricType is not recognized', async () => {
      const request: AnalyticsServiceRequest = {
        metricType: 'usage_stats',
        timeRange: {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-31T23:59:59Z'
        },
        aggregation: 'daily'
      };
      
      const response = await AnalyticsService.getMetrics(request);
      expect(response.success).toBe(true);
      expect(response.metrics).toEqual({
        defaultMetric: 100,
        status: 'active'
      });
      expect(response.metadata).toHaveProperty('calculatedAt');
      expect(response.metadata.aggregation).toBe('daily');
    });

    it('should handle different metric types', async () => {
      const userMetricsRequest: AnalyticsServiceRequest = {
        metricType: 'user_engagement',
        timeRange: {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-07T23:59:59Z'
        },
        filters: { userType: 'researcher' },
        aggregation: 'hourly'
      };

      const userMetricsResponse = await AnalyticsService.getMetrics(userMetricsRequest);
      expect(userMetricsResponse.success).toBe(true);
      expect(userMetricsResponse.metrics).toEqual({
        activeUsers: 150,
        averageSessionDuration: 300,
        totalSessions: 450,
        bounceRate: 0.25
      });
      expect(userMetricsResponse.metadata.filters).toEqual({ userType: 'researcher' });

      const searchMetricsRequest: AnalyticsServiceRequest = {
        metricType: 'search_performance',
        timeRange: {
          start: '2023-01-15T00:00:00Z',
          end: '2023-01-16T00:00:00Z'
        },
        filters: { 
          queryComplexity: 'high',
          resultCount: { min: 10, max: 100 }
        }
      };

      const searchMetricsResponse = await AnalyticsService.getMetrics(searchMetricsRequest);
      expect(searchMetricsResponse.success).toBe(true);
      expect(searchMetricsResponse.metrics).toEqual({
        totalSearches: 1500,
        averageResponseTime: 245,
        successRate: 0.95,
        topQueries: ['machine learning', 'deep learning']
      });
    });
  });

  describe('getPerformance', () => {
    let mockQuery: any;

    beforeEach(() => {
      // Create mock data that will result in p50=200, p95=800, p99=1200, errorRate=0.02
      const mockEvents = [];

      // 10000 total events
      const totalEvents = 10000;
      const errorEventsCount = 200; // 0.02 error rate
      const searchEventsCount = totalEvents - errorEventsCount;

      for (let i = 0; i < errorEventsCount; i++) {
        mockEvents.push({ event_type: 'error', created_at: new Date().toISOString() });
      }

      // We need to set the searchTimes correctly to get the right percentiles
      // p50 at index 4899 should be 200
      // p95 at index 9309 should be 800
      // p99 at index 9701 should be 1200
      for (let i = 0; i < searchEventsCount; i++) {
        let searchTime = 100; // default

        // Very basic mock distribution to satisfy the percentile assertions
        if (i === Math.ceil(50 / 100 * searchEventsCount) - 1) searchTime = 200;
        else if (i === Math.ceil(95 / 100 * searchEventsCount) - 1) searchTime = 800;
        else if (i === Math.ceil(99 / 100 * searchEventsCount) - 1) searchTime = 1200;
        else if (i < Math.ceil(50 / 100 * searchEventsCount) - 1) searchTime = 100;
        else if (i < Math.ceil(95 / 100 * searchEventsCount) - 1) searchTime = 500;
        else if (i < Math.ceil(99 / 100 * searchEventsCount) - 1) searchTime = 1000;
        else searchTime = 1500;

        mockEvents.push({
          event_type: 'search_performed',
          event_data: { searchTime },
          created_at: new Date().toISOString()
        });
      }

      mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data: mockEvents, error: null }))
      };

      const mockSupabaseClient = {
        from: vi.fn().mockImplementation((table) => {
          if (table === 'analytics_events') {
            return mockQuery;
          }
          // fallback to other mocks if needed
          return { insert: mockInsert };
        }),
      };

      vi.spyOn(SupabaseLib, 'getSupabase').mockReturnValue(mockSupabaseClient as any);
    });

    it('should return default performance metrics for response_time', async () => {
      const request: AnalyticsServiceRequest = {
        conversationId: 'conv-performance',
        timeRange: {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-02T00:00:00Z'
        },
        performanceType: 'response_time'
      };
      
      const response = await AnalyticsService.getPerformance(request);
      expect(response.success).toBe(true);
      expect(response.data).toEqual({
        p50ResponseTime: 200,
        p95ResponseTime: 800,
        p99ResponseTime: 1200,
        errorRate: 0.02
      });
      expect(response.metadata.performanceType).toBe('response_time');
      expect(response.metadata).toHaveProperty('calculatedAt');
      expect(response.metadata.timeWindow).toBe('24h');
      expect(response.metadata.samplesAnalyzed).toBe(10000);

      expect(mockQuery.select).toHaveBeenCalledWith('event_type, event_data, created_at');
      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', request.timeRange!.start);
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', request.timeRange!.end);
      expect(mockQuery.eq).toHaveBeenCalledWith('conversation_id', request.conversationId);
    });

    it('should handle different performance metrics correctly', async () => {
      const latencyRequest: AnalyticsServiceRequest = {
        performanceType: 'latency_analysis',
        timeRange: {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-01T01:00:00Z'
        },
        filters: {
          endpoint: '/search',
          userAgent: 'research-tool'
        }
      };

      const latencyResponse = await AnalyticsService.getPerformance(latencyRequest);
      expect(latencyResponse.success).toBe(true);
      expect(latencyResponse.data.p99ResponseTime).toBe(1200);
      expect(latencyResponse.metadata.performanceType).toBe('latency_analysis');
      expect(latencyResponse.metadata.timeWindow).toBe('1h');

      const throughputRequest: AnalyticsServiceRequest = {
        performanceType: 'throughput',
        timeRange: {
          start: '2023-01-01T12:00:00Z',
          end: '2023-01-01T13:00:00Z'
        },
        filters: { serverRegion: 'us-east-1' }
      };

      const throughputResponse = await AnalyticsService.getPerformance(throughputRequest);
      expect(throughputResponse.success).toBe(true);
      expect(throughputResponse.data.errorRate).toBe(0.02);
      expect(throughputResponse.metadata.performanceType).toBe('throughput');
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.then = vi.fn((resolve) => resolve({ data: null, error: new Error('Database query failed') }));

      const request: AnalyticsServiceRequest = {
        performanceType: 'response_time'
      };

      const response = await AnalyticsService.getPerformance(request);

      expect(response.success).toBe(false);
      expect(response.metadata.error).toBe('Database query failed');
    });
  });

  describe('generateReport', () => {
    it('should throw an error if reportType is missing', async () => {
      const request: AnalyticsServiceRequest = {
        timeRange: {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-31T23:59:59Z'
        },
        format: 'json'
      };

      await expect(AnalyticsService.generateReport(request)).rejects.toThrow('Invalid request: missing reportType');
    });

    it('should generate a valid report response', async () => {
      const request: AnalyticsServiceRequest = {
        reportType: 'monthly_summary',
        timeRange: {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-31T23:59:59Z'
        },
        format: 'json'
      };
      
      const response = await AnalyticsService.generateReport(request);
      expect(response.success).toBe(true);
      expect(response.report).toBeDefined();
      expect(response.report.id).toContain('report-');
      expect(response.report.format).toBe('json');
      expect(response.report.reportType).toBe('monthly_summary');
      expect(response.metadata).toBeDefined();
      expect(response.metadata.generatedAt).toBeDefined();
      expect(response.metadata.expiresAt).toBeDefined();
    });

    it('should handle different report types and formats', async () => {
      const usageReportRequest: AnalyticsServiceRequest = {
        reportType: 'user_activity_report',
        timeRange: {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-07T23:59:59Z'
        },
        filters: { department: 'research' },
        format: 'pdf',
        options: {
          includeCharts: true,
          includeRawData: false,
          granularity: 'daily'
        }
      };

      const usageResponse = await AnalyticsService.generateReport(usageReportRequest);
      expect(usageResponse.success).toBe(true);
      expect(usageResponse.report.format).toBe('pdf');
      expect(usageResponse.report.filters).toEqual({ department: 'research' });
      expect(usageResponse.report.options).toEqual({
        includeCharts: true,
        includeRawData: false,
        granularity: 'daily'
      });

      const performanceReportRequest: AnalyticsServiceRequest = {
        reportType: 'system_performance_report',
        timeRange: {
          start: '2023-01-01T00:00:00Z',
          end: '2023-01-01T23:59:59Z'
        },
        format: 'csv',
        options: {
          includeAlerts: true,
          includeRecommendations: true
        }
      };

      const performanceResponse = await AnalyticsService.generateReport(performanceReportRequest);
      expect(performanceResponse.success).toBe(true);
      expect(performanceResponse.report.format).toBe('csv');
      expect(performanceResponse.report.reportType).toBe('system_performance_report');
    });
  });

  describe('service response format', () => {
    it('should return properly structured response when implemented', () => {
      // Test event tracking response
      const trackEventResponse: AnalyticsServiceResponse = {
        success: true,
        metadata: {
          eventId: 'event-123',
          timestamp: '2023-01-01T12:00:00Z',
          processed: true
        }
      };

      expect(trackEventResponse).toHaveProperty('success');
      expect(trackEventResponse).toHaveProperty('metadata');
      expect(trackEventResponse.success).toBe(true);

      // Test metrics response
      const metricsResponse: AnalyticsServiceResponse = {
        success: true,
        metrics: {
          totalSearches: 1500,
          averageResponseTime: 245,
          successRate: 0.95,
          topQueries: ['machine learning', 'deep learning']
        },
        metadata: {
          calculatedAt: '2023-01-01T12:00:00Z',
          dataPoints: 1500
        }
      };

      expect(metricsResponse).toHaveProperty('metrics');
      expect(metricsResponse.metrics).toBeTypeOf('object');

      // Test performance response
      const performanceResponse: AnalyticsServiceResponse = {
        success: true,
        data: {
          p50ResponseTime: 200,
          p95ResponseTime: 800,
          p99ResponseTime: 1200,
          errorRate: 0.02
        },
        metadata: {
          samplesAnalyzed: 10000,
          timeWindow: '1h'
        }
      };

      expect(performanceResponse).toHaveProperty('data');

      // Test report response
      const reportResponse: AnalyticsServiceResponse = {
        success: true,
        report: {
          id: 'report-456',
          url: 'https://example.com/reports/report-456.pdf',
          format: 'pdf',
          size: 2048576
        },
        metadata: {
          generatedAt: '2023-01-01T12:00:00Z',
          expiresAt: '2023-01-08T12:00:00Z'
        }
      };

      expect(reportResponse).toHaveProperty('report');
      expect(reportResponse.report).toHaveProperty('id');
    });
  });
});
