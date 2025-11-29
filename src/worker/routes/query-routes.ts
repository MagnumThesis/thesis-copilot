// src/worker/routes/query-routes.ts
// Route handlers for query generation and refinement endpoints
// Part of modular refactor (see code-modularization-refactor spec)

import type { Context } from '../types';
import { QueryService, QueryServiceRequest, QueryServiceResponse } from '../services/query-service';

/**
 * Handles the /generate-query endpoint
 * @param ctx - The request context
 * @returns QueryServiceResponse
 */
export async function handleGenerateQueryRoute(ctx: Context): Promise<QueryServiceResponse> {
  // Basic validation: ensure body has required fields
  const body = ctx.request?.body;
  if (!body || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: QueryServiceRequest = {
    conversationId: body.conversationId,
    prompt: body.prompt,
    contentSources: body.contentSources,
    context: { env: ctx.env },
    options: body.options,
  };
  
  // Call QueryService.generateQuery
  const response = await QueryService.generateQuery(req);
  return response;
}

/**
 * Handles the /validate-query endpoint
 * @param ctx - The request context
 * @returns QueryServiceResponse
 */
export async function handleValidateQueryRoute(ctx: Context): Promise<QueryServiceResponse> {
  // Basic validation: ensure body has query and conversationId
  const body = ctx.request?.body;
  if (!body || typeof body.query !== 'string' || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing query or conversationId');
  }
  
  const req: QueryServiceRequest = {
    conversationId: body.conversationId,
    query: body.query,
    options: body.options,
  };
  
  // Call QueryService.validateQuery
  const response = await QueryService.validateQuery(req);
  return response;
}

/**
 * Handles the /combine-queries endpoint
 * @param ctx - The request context
 * @returns QueryServiceResponse
 */
export async function handleCombineQueriesRoute(ctx: Context): Promise<QueryServiceResponse> {
  // Basic validation: ensure body has queries array and conversationId
  const body = ctx.request?.body;
  if (!body || !Array.isArray(body.queries) || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing queries array or conversationId');
  }
  
  const req: QueryServiceRequest = {
    conversationId: body.conversationId,
    queries: body.queries,
    options: body.options,
  };
  
  // Call QueryService.combineQueries
  const response = await QueryService.combineQueries(req);
  return response;
}

/**
 * Handles the /refine-query endpoint
 * @param ctx - The request context
 * @returns QueryServiceResponse
 */
export async function handleRefineQueryRoute(ctx: Context): Promise<QueryServiceResponse> {
  // Basic validation: ensure body has query and conversationId
  const body = ctx.request?.body;
  if (!body || typeof body.query !== 'string' || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing query or conversationId');
  }
  
  const req: QueryServiceRequest = {
    conversationId: body.conversationId,
    query: body.query,
    refinementContext: body.refinementContext,
    options: body.options,
  };
  
  // Call QueryService.refineQuery
  const response = await QueryService.refineQuery(req);
  return response;
}

/**
 * Handles the /extract-content endpoint
 * @param ctx - The request context
 * @returns QueryServiceResponse
 */
export async function handleExtractContentRoute(ctx: Context): Promise<QueryServiceResponse> {
  // Basic validation: ensure body has required fields
  const body = ctx.request?.body;
  if (!body || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: QueryServiceRequest = {
    conversationId: body.conversationId,
    contentSources: body.contentSources,
    context: { env: ctx.env },
    options: body.options || {},
  };
  
  // Delegate to service layer
  return await QueryService.extractContent(req);
}

/**
 * Handles the /content-preview endpoint
 * @param ctx - The request context
 * @returns QueryServiceResponse
 */
export async function handleContentPreviewRoute(ctx: Context): Promise<QueryServiceResponse> {
  // Basic validation: ensure body has required fields
  const body = ctx.request?.body;
  if (!body || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing conversationId');
  }
  
  const req: QueryServiceRequest = {
    conversationId: body.conversationId,
    source: body.source,
    id: body.id,
    context: { env: ctx.env },
    options: body.options || {},
  };
  
  // Delegate to service layer
  return await QueryService.contentPreview(req);
}
