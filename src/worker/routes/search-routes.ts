// src/worker/routes/search-routes.ts
// Route handlers for /search and /extract endpoints
// Part of modular refactor (see code-modularization-refactor spec)

// import type { SearchQuery } from '../../../types';
import type { Context } from '../types';
import { SearchService, SearchServiceRequest, SearchServiceResponse } from '../services/search-service';

/**
 * Handles the /search endpoint
 * @param ctx - The request context
 * @returns SearchServiceResponse
 */
export async function handleSearchRoute(ctx: Context): Promise<SearchServiceResponse> {
  // Basic validation: ensure body has query and conversationId
  const body = ctx.request?.body;
  if (!body || typeof body.query !== 'string' || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing query or conversationId');
  }
  const req: SearchServiceRequest = {
    query: body.query,
    conversationId: body.conversationId,
    filters: body.filters,
    options: body.options,
  };
  // Call SearchService.search with env
  const response = await SearchService.search(req, (ctx as any).env);
  return response;
}

/**
 * Handles the /extract endpoint
 * @param ctx - The request context
 * @returns SearchServiceResponse
 */
export async function handleExtractRoute(ctx: Context): Promise<SearchServiceResponse> {
  // Basic validation: ensure body has query and conversationId (for extract)
  const body = ctx.request?.body;
  if (!body || typeof body.source !== 'string' || typeof body.conversationId !== 'string') {
    throw new Error('Invalid request: missing source or conversationId');
  }
  const req: SearchServiceRequest = {
    query: body.source, // For extract, source is passed as query
    conversationId: body.conversationId,
    filters: body.filters,
    options: { ...body.options, type: body.type },
  };
  // Call SearchService.extract with env
  const response = await SearchService.extract(req, (ctx as any).env);
  return response;
}


