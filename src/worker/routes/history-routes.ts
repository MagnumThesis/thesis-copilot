// src/worker/routes/history-routes.ts
// Route handlers for history management endpoints
// Part of modular refactor (see code-modularization-refactor spec)

import type { Context } from '../types';
import { HistoryService, HistoryServiceRequest, HistoryServiceResponse } from '../services/history-service';

/**
 * Handles the /history endpoint - retrieves conversation history
 * @param ctx - The request context
 * @returns HistoryServiceResponse
 */
export async function handleGetHistoryRoute(ctx: Context): Promise<HistoryServiceResponse> {
  // Basic validation: ensure body has conversationId
  const body = ctx.request?.body;
  if (!body || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: HistoryServiceRequest = {
    conversationId: body.conversationId,
    limit: body.limit,
    offset: body.offset,
    filters: body.filters,
  };
  
  // Call HistoryService.getHistory
  const response = await HistoryService.getHistory(req);
  return response;
}

/**
 * Handles the /history/save endpoint - saves conversation history
 * @param ctx - The request context
 * @returns HistoryServiceResponse
 */
export async function handleSaveHistoryRoute(ctx: Context): Promise<HistoryServiceResponse> {
  // Basic validation: ensure body has conversationId and data
  const body = ctx.request?.body;
  if (!body || typeof body.conversationId !== 'string' || !body.data) {
    throw new Error('Invalid request: missing conversationId or data');
  }
  
  const req: HistoryServiceRequest = {
    conversationId: body.conversationId,
    data: body.data,
    metadata: body.metadata,
  };
  
  // Call HistoryService.saveHistory
  const response = await HistoryService.saveHistory(req);
  return response;
}

/**
 * Handles the /history/delete endpoint - deletes conversation history
 * @param ctx - The request context
 * @returns HistoryServiceResponse
 */
export async function handleDeleteHistoryRoute(ctx: Context): Promise<HistoryServiceResponse> {
  // Basic validation: ensure body has conversationId
  const body = ctx.request?.body;
  if (!body || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: HistoryServiceRequest = {
    conversationId: body.conversationId,
    entryId: body.entryId, // Optional - if provided, delete specific entry
  };
  
  // Call HistoryService.deleteHistory
  const response = await HistoryService.deleteHistory(req);
  return response;
}

/**
 * Handles the /history/search endpoint - searches conversation history
 * @param ctx - The request context
 * @returns HistoryServiceResponse
 */
export async function handleSearchHistoryRoute(ctx: Context): Promise<HistoryServiceResponse> {
  // Basic validation: ensure body has query
  const body = ctx.request?.body;
  if (!body || typeof body.query !== 'string') {
    throw new Error('Invalid request: missing query');
  }
  
  const req: HistoryServiceRequest = {
    conversationId: body.conversationId, // Optional - can search across all conversations
    query: body.query,
    filters: body.filters,
    limit: body.limit,
    offset: body.offset,
  };
  
  // Call HistoryService.searchHistory
  const response = await HistoryService.searchHistory(req);
  return response;
}

/**
 * Handles the /history/clear endpoint
 * @param ctx - The request context
 * @returns HistoryServiceResponse
 */
export async function handleClearHistoryRoute(ctx: Context): Promise<HistoryServiceResponse> {
  // Basic validation: ensure body has conversationId
  const body = ctx.request?.body;
  if (!body || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: HistoryServiceRequest = {
    conversationId: body.conversationId,
    metadata: { operation: 'clear-history' }
  };
  
  // Delegate to service layer
  return await HistoryService.clearHistory(req);
}

/**
 * Handles the /history/export endpoint
 * @param ctx - The request context
 * @returns HistoryServiceResponse
 */
export async function handleExportHistoryRoute(ctx: Context): Promise<HistoryServiceResponse> {
  // Basic validation: ensure query has conversationId
  const conversationId = ctx.request?.query?.conversationId;
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: HistoryServiceRequest = {
    conversationId,
    metadata: { operation: 'export-history' }
  };
  
  // Delegate to service layer
  return await HistoryService.exportHistory(req);
}

/**
 * Handles the /history/stats endpoint
 * @param ctx - The request context
 * @returns HistoryServiceResponse
 */
export async function handleGetHistoryStatsRoute(ctx: Context): Promise<HistoryServiceResponse> {
  // Basic validation: ensure query has conversationId
  const conversationId = ctx.request?.query?.conversationId;
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: HistoryServiceRequest = {
    conversationId,
    metadata: { operation: 'get-history-stats' }
  };
  
  // Delegate to service layer
  return await HistoryService.getHistoryStats(req);
}

/**
 * Handles the /history/content-usage endpoint
 * @param ctx - The request context
 * @returns HistoryServiceResponse
 */
export async function handleGetContentUsageRoute(ctx: Context): Promise<HistoryServiceResponse> {
  // Basic validation: ensure query has conversationId
  const conversationId = ctx.request?.query?.conversationId;
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: HistoryServiceRequest = {
    conversationId,
    metadata: { operation: 'get-content-usage' }
  };
  
  // Delegate to service layer
  return await HistoryService.getContentUsage(req);
}

/**
 * Handles the /history/success-tracking endpoint
 * @param ctx - The request context
 * @returns HistoryServiceResponse
 */
export async function handleGetSuccessTrackingRoute(ctx: Context): Promise<HistoryServiceResponse> {
  // Basic validation: ensure body has conversationId
  const body = ctx.request?.body;
  if (!body || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: HistoryServiceRequest = {
    conversationId: body.conversationId,
    metadata: { operation: 'get-success-tracking' }
  };
  
  // Delegate to service layer
  return await HistoryService.getSuccessTracking(req);
}

/**
 * Handles the /history/next-batch endpoint
 * @param ctx - The request context
 * @returns HistoryServiceResponse
 */
export async function handleGetNextBatchRoute(ctx: Context): Promise<HistoryServiceResponse> {
  // Basic validation: ensure query has conversationId
  const conversationId = ctx.request?.query?.conversationId;
  if (!conversationId || typeof conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: HistoryServiceRequest = {
    conversationId,
    metadata: { operation: 'get-next-batch' }
  };
  
  // Delegate to service layer
  return await HistoryService.getNextBatch(req);
}

/**
 * Handles the /session/:sessionId endpoint
 * @param ctx - The request context
 * @returns HistoryServiceResponse
 */
export async function handleGetSearchSessionDetailsRoute(ctx: Context): Promise<HistoryServiceResponse> {
  // Basic validation: ensure params has sessionId
  const sessionId = ctx.request?.params?.sessionId;
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Invalid request: missing sessionId');
  }
  
  const req: HistoryServiceRequest = {
    conversationId: '', // Will be resolved by service
    metadata: { operation: 'get-session-details', sessionId }
  };
  
  // Delegate to service layer
  return await HistoryService.getSearchSessionDetails(req);
}
