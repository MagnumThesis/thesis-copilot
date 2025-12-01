// src/worker/routes/analytics-routes.ts
// Route handlers for analytics and tracking endpoints
// Part of modular refactor (see code-modularization-refactor spec)

import type { Context } from '../types';
import { AnalyticsService, AnalyticsServiceRequest, AnalyticsServiceResponse } from '../services/analytics-service';

/**
 * Handles the /analytics/track endpoint - tracks user events
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleTrackEventRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Basic validation: ensure body has event data
  const body = ctx.request?.body;
  if (!body || typeof body.eventType !== 'string' || !body.eventData) {
    throw new Error('Invalid request: missing eventType or eventData');
  }
  
  const req: AnalyticsServiceRequest = {
    eventType: body.eventType,
    eventData: body.eventData,
    conversationId: body.conversationId,
    userId: body.userId,
    metadata: body.metadata,
  };
  
  // Call AnalyticsService.trackEvent
  const response = await AnalyticsService.trackEvent(req);
  return response;
}

/**
 * Handles the /analytics/metrics endpoint - retrieves analytics metrics
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleGetMetricsRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Basic validation: ensure body has required parameters
  const body = ctx.request?.body;
  if (!body) {
    throw new Error('Invalid request: missing request body');
  }
  
  const req: AnalyticsServiceRequest = {
    metricType: body.metricType,
    timeRange: body.timeRange,
    filters: body.filters,
    aggregation: body.aggregation,
  };
  
  // Call AnalyticsService.getMetrics
  const response = await AnalyticsService.getMetrics(req);
  return response;
}

/**
 * Handles the /analytics/performance endpoint - retrieves performance analytics
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleGetPerformanceRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Basic validation: ensure body exists
  const body = ctx.request?.body;
  if (!body) {
    throw new Error('Invalid request: missing request body');
  }
  
  const req: AnalyticsServiceRequest = {
    conversationId: body.conversationId,
    timeRange: body.timeRange,
    performanceType: body.performanceType,
    filters: body.filters,
  };
  
  // Call AnalyticsService.getPerformance
  const response = await AnalyticsService.getPerformance(req);
  return response;
}

/**
 * Handles the /analytics/report endpoint - generates analytics reports
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleGenerateReportRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Basic validation: ensure body has report type
  const body = ctx.request?.body;
  if (!body || typeof body.reportType !== 'string') {
    throw new Error('Invalid request: missing reportType');
  }
  
  const req: AnalyticsServiceRequest = {
    reportType: body.reportType,
    timeRange: body.timeRange,
    filters: body.filters,
    format: body.format,
    options: body.options,
  };
  
  // Call AnalyticsService.generateReport
  const response = await AnalyticsService.generateReport(req);
  return response;
}

/**
 * Handles the /analytics endpoint
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleGetAnalyticsRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Basic validation: ensure query has conversationId
  const conversationId = ctx.request?.query?.conversationId;
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: AnalyticsServiceRequest = {
    conversationId,
    metadata: { operation: 'get-analytics' }
  };
  
  // Delegate to service layer
  return await AnalyticsService.getAnalytics(req);
}

/**
 * Handles the /trending endpoint
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleGetTrendingRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Basic validation: ensure query has conversationId
  const conversationId = ctx.request?.query?.conversationId;
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: AnalyticsServiceRequest = {
    conversationId,
    metadata: { operation: 'get-trending' }
  };
  
  // Delegate to service layer
  return await AnalyticsService.getTrending(req);
}

/**
 * Handles the /statistics endpoint
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleGetStatisticsRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Basic validation: ensure query has conversationId
  const conversationId = ctx.request?.query?.conversationId;
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: AnalyticsServiceRequest = {
    conversationId,
    metadata: { operation: 'get-statistics' }
  };
  
  // Delegate to service layer
  return await AnalyticsService.getStatistics(req);
}

/**
 * Handles the /analytics/performance-metrics endpoint
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleGetPerformanceMetricsRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Basic validation: ensure query has conversationId
  const conversationId = ctx.request?.query?.conversationId;
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: AnalyticsServiceRequest = {
    conversationId,
    metadata: { operation: 'get-performance-metrics' }
  };
  
  // Delegate to service layer
  return await AnalyticsService.getPerformanceMetrics(req);
}

/**
 * Handles the /analytics/clear-cache endpoint
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleClearCacheRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Basic validation: ensure body has conversationId
  const body = ctx.request?.body;
  if (!body || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: AnalyticsServiceRequest = {
    conversationId: body.conversationId,
    metadata: { operation: 'clear-cache' }
  };
  
  // Delegate to service layer
  return await AnalyticsService.clearCache(req);
}

/**
 * Handles the /analytics/query-performance endpoint
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleGetQueryPerformanceRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Basic validation: ensure query has conversationId
  const conversationId = ctx.request?.query?.conversationId;
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: AnalyticsServiceRequest = {
    conversationId,
    metadata: { operation: 'get-query-performance' }
  };
  
  // Delegate to service layer
  return await AnalyticsService.getQueryPerformance(req);
}

/**
 * Handles the /analytics/success-rate-tracking endpoint
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleGetSuccessRateTrackingRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Basic validation: ensure query has conversationId
  const conversationId = ctx.request?.query?.conversationId;
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: AnalyticsServiceRequest = {
    conversationId,
    metadata: { operation: 'get-success-rate-tracking' }
  };
  
  // Delegate to service layer
  return await AnalyticsService.getSuccessRateTracking(req);
}

/**
 * Handles the /analytics/content-source-effectiveness endpoint
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleGetContentSourceEffectivenessRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Basic validation: ensure query has conversationId
  const conversationId = ctx.request?.query?.conversationId;
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: AnalyticsServiceRequest = {
    conversationId,
    metadata: { operation: 'get-content-source-effectiveness' }
  };
  
  // Delegate to service layer
  return await AnalyticsService.getContentSourceEffectiveness(req);
}

/**
 * Handles the /track-result-action endpoint
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleTrackResultActionRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Basic validation: ensure body has required fields
  const body = ctx.request?.body;
  if (!body || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: AnalyticsServiceRequest = {
    conversationId: body.conversationId,
    eventData: body,
    metadata: { operation: 'track-result-action' }
  };
  
  // Delegate to service layer
  return await AnalyticsService.trackResultAction(req);
}

/**
 * Handles the /feedback endpoint
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleRecordFeedbackRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Basic validation: ensure body has required fields
  const body = ctx.request?.body;
  if (!body || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: AnalyticsServiceRequest = {
    conversationId: body.conversationId,
    eventData: body,
    metadata: { operation: 'record-feedback' }
  };
  
  // Delegate to service layer
  return await AnalyticsService.recordFeedback(req);
}

/**
 * Handles the /health endpoint
 * @param ctx - The request context
 * @returns AnalyticsServiceResponse
 */
export async function handleHealthRoute(ctx: Context): Promise<AnalyticsServiceResponse> {
  // Health check doesn't require specific validation
  const req: AnalyticsServiceRequest = {
    conversationId: 'system',
    metadata: { operation: 'health-check' }
  };
  
  // Delegate to service layer
  return await AnalyticsService.getHealthStatus(req);
}
