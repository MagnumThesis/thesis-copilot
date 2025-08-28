// Unit tests for analytics route handlers

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  handleTrackEventRoute, 
  handleGetMetricsRoute, 
  handleGetPerformanceRoute, 
  handleGenerateReportRoute,
  handleHealthRoute 
} from '../analytics-routes';
import { AnalyticsService } from '../../services/analytics-service';

describe('analytics-routes', () => {
  const validContext = (body: any) => ({ request: { body } });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleTrackEventRoute', () => {
    it('should throw error if eventType or eventData is missing', async () => {
      await expect(handleTrackEventRoute(validContext({}))).rejects.toThrow('Invalid request: missing eventType or eventData');
      await expect(handleTrackEventRoute(validContext({ eventType: 'click' }))).rejects.toThrow('Invalid request: missing eventType or eventData');
      await expect(handleTrackEventRoute(validContext({ eventData: { button: 'search' } }))).rejects.toThrow('Invalid request: missing eventType or eventData');
    });

    it('should call AnalyticsService.trackEvent with correct params and return response', async () => {
      const mockResponse = { success: true, metadata: { tracked: true } };
      const spy = vi.spyOn(AnalyticsService, 'trackEvent').mockResolvedValueOnce(mockResponse as any);
      const ctx = validContext({ 
        eventType: 'search_performed', 
        eventData: { query: 'test', results: 5 }, 
        conversationId: 'c1', 
        userId: 'u1', 
        metadata: { timestamp: '2023-01-01' } 
      });
      const result = await handleTrackEventRoute(ctx as any);
      expect(spy).toHaveBeenCalledWith({ 
        eventType: 'search_performed', 
        eventData: { query: 'test', results: 5 }, 
        conversationId: 'c1', 
        userId: 'u1', 
        metadata: { timestamp: '2023-01-01' } 
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('handleGetMetricsRoute', () => {
    it('should throw error if request body is missing', async () => {
      await expect(handleGetMetricsRoute({ request: {} } as any)).rejects.toThrow('Invalid request: missing request body');
    });

    it('should call AnalyticsService.getMetrics with correct params and return response', async () => {
      const mockResponse = { success: true, metrics: { searches: 100, clicks: 50 }, metadata: { period: 'week' } };
      const spy = vi.spyOn(AnalyticsService, 'getMetrics').mockResolvedValueOnce(mockResponse as any);
      const ctx = validContext({ 
        metricType: 'usage', 
        timeRange: { start: '2023-01-01', end: '2023-01-07' }, 
        filters: { userId: 'u1' }, 
        aggregation: 'daily' 
      });
      const result = await handleGetMetricsRoute(ctx as any);
      expect(spy).toHaveBeenCalledWith({ 
        metricType: 'usage', 
        timeRange: { start: '2023-01-01', end: '2023-01-07' }, 
        filters: { userId: 'u1' }, 
        aggregation: 'daily' 
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('handleGetPerformanceRoute', () => {
    it('should throw error if request body is missing', async () => {
      await expect(handleGetPerformanceRoute({ request: {} } as any)).rejects.toThrow('Invalid request: missing request body');
    });

    it('should call AnalyticsService.getPerformance with correct params and return response', async () => {
      const mockResponse = { success: true, data: { avgResponseTime: 250, successRate: 0.95 }, metadata: { analyzed: true } };
      const spy = vi.spyOn(AnalyticsService, 'getPerformance').mockResolvedValueOnce(mockResponse as any);
      const ctx = validContext({ 
        conversationId: 'c2', 
        timeRange: { start: '2023-01-01', end: '2023-01-07' }, 
        performanceType: 'response_time', 
        filters: { endpoint: 'search' } 
      });
      const result = await handleGetPerformanceRoute(ctx as any);
      expect(spy).toHaveBeenCalledWith({ 
        conversationId: 'c2', 
        timeRange: { start: '2023-01-01', end: '2023-01-07' }, 
        performanceType: 'response_time', 
        filters: { endpoint: 'search' } 
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('handleGenerateReportRoute', () => {
    it('should throw error if reportType is missing', async () => {
      await expect(handleGenerateReportRoute(validContext({}))).rejects.toThrow('Invalid request: missing reportType');
      await expect(handleGenerateReportRoute(validContext({ timeRange: { start: '2023-01-01', end: '2023-01-07' } }))).rejects.toThrow('Invalid request: missing reportType');
    });

    it('should call AnalyticsService.generateReport with correct params and return response', async () => {
      const mockResponse = { success: true, report: { summary: 'Weekly report generated' }, metadata: { reportId: 'r123' } };
      const spy = vi.spyOn(AnalyticsService, 'generateReport').mockResolvedValueOnce(mockResponse as any);
      const ctx = validContext({ 
        reportType: 'weekly_usage', 
        timeRange: { start: '2023-01-01', end: '2023-01-07' }, 
        filters: { department: 'research' }, 
        format: 'pdf', 
        options: { includeCharts: true } 
      });
      const result = await handleGenerateReportRoute(ctx as any);
      expect(spy).toHaveBeenCalledWith({ 
        reportType: 'weekly_usage', 
        timeRange: { start: '2023-01-01', end: '2023-01-07' }, 
        filters: { department: 'research' }, 
        format: 'pdf', 
        options: { includeCharts: true } 
      });
      expect(result).toBe(mockResponse);
    });
  });
});

describe('handleHealthRoute', () => {
  it('should call AnalyticsService.getHealthStatus and return response', async () => {
    const mockResponse = { 
      success: true, 
      data: { status: 'healthy' },
      metadata: { operation: 'health-check' }
    };
    vi.spyOn(AnalyticsService, 'getHealthStatus').mockResolvedValue(mockResponse);

    const ctx = {
      request: {
        body: {},
      },
    };

    const result = await handleHealthRoute(ctx);

    expect(AnalyticsService.getHealthStatus).toHaveBeenCalledWith({
      conversationId: 'system',
      metadata: { operation: 'health-check' }
    });
    expect(result).toEqual(mockResponse);
  });
});
