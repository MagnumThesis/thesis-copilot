import { Hono, Context } from "hono";
import { SupabaseEnv } from "../lib/supabase";
import { Env } from "../types/env";
import { ReferenceManagementEngine } from "../lib/reference-management-engine";
import { AISearchReferenceManager, AddReferenceFromSearchOptions } from "../lib/ai-search-reference-manager";
import {
  MetadataExtractionRequest,
  CitationRequest,
  BibliographyRequest,
  ReferenceSearchOptions,
  ReferenceType,
  CitationStyle,
  ScholarSearchResult,
  ReferenceMetadata
} from "../../lib/ai-types";

// Type for the Hono context
type ReferencerContext = {
  Bindings: Env & SupabaseEnv;
};

/**
 * Enhanced error handling for referencer operations
 */
interface ReferencerErrorContext {
  operation: string;
  conversationId?: string;
  referenceId?: string;
  timestamp: number;
  requestId?: string;
}

/**
 * Create standardized error response for referencer operations
 */
function createReferencerErrorResponse(
  error: unknown,
  context: ReferencerErrorContext,
  processingTime: number
): { success: false; error: string; processingTime: number } {
  let errorMessage = "An unexpected error occurred during reference operation";

  if (error instanceof Error) {
    errorMessage = error.message;
    
    // Categorize errors for better handling
    if (error.message.includes('not found')) {
      errorMessage = "Reference not found";
    } else if (error.message.includes('validation')) {
      errorMessage = "Invalid reference data provided";
    } else if (error.message.includes('database') || error.message.includes('connection')) {
      errorMessage = "Database connection failed";
    } else if (error.message.includes('timeout')) {
      errorMessage = "Operation timed out";
    } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      errorMessage = "Insufficient permissions";
    }
  }

  console.error(`Referencer operation failed:`, {
    ...context,
    error: errorMessage,
    processingTime
  });

  return {
    success: false,
    error: errorMessage,
    processingTime
  };
}

/**
 * Validate required fields in request body
 */
function validateRequiredFields(data: Record<string, unknown>, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (!data[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/**
 * Referencer API Handler
 * Handles all reference management operations
 */
export class ReferencerAPIHandler {
  private engine: ReferenceManagementEngine;
  private aiSearchManager: AISearchReferenceManager;

  constructor() {
    this.engine = new ReferenceManagementEngine();
    this.aiSearchManager = new AISearchReferenceManager();
  }

  /**
   * POST /api/referencer/references
   * Create a new reference
   */
  async createReference(c: Context<ReferencerContext>) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const body = await c.req.json();
      
      // Validate required fields
      const validationError = validateRequiredFields(body, ['conversationId', 'type', 'title']);
      if (validationError) {
        return c.json({
          success: false,
          error: validationError,
          processingTime: Date.now() - startTime
        }, 400);
      }

      const { conversationId, extractMetadata = false, ...referenceData } = body;

      // Validate reference type
      if (!Object.values(ReferenceType).includes(referenceData.type)) {
        return c.json({
          success: false,
          error: `Invalid reference type: ${referenceData.type}`,
          processingTime: Date.now() - startTime
        }, 400);
      }

      const reference = await this.engine.createReference(
        { ...referenceData, conversationId },
        extractMetadata
      );

      return c.json({
        success: true,
        reference,
        processingTime: Date.now() - startTime
      }, 201);

    } catch (error) {
      const errorResponse = createReferencerErrorResponse(
        error,
        {
          operation: 'createReference',
          conversationId: (await c.req.json().catch(() => ({})))?.conversationId,
          timestamp: Date.now(),
          requestId
        },
        Date.now() - startTime
      );

      return c.json(errorResponse, 500);
    }
  }

  /**
   * GET /api/referencer/references/:conversationId
   * Get references for a conversation
   */
  async getReferencesForConversation(c: Context<ReferencerContext>) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const conversationId = c.req.param('conversationId');
      
      if (!conversationId) {
        return c.json({
          success: false,
          error: 'Conversation ID is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      // Parse query parameters for search options
      const searchOptions: ReferenceSearchOptions = {};
      
      const query = c.req.query('query');
      if (query) searchOptions.query = query;
      
      const type = c.req.query('type');
      if (type && type !== 'all') {
        if (Object.values(ReferenceType).includes(type as ReferenceType)) {
          searchOptions.type = type as ReferenceType;
        }
      }
      
      const author = c.req.query('author');
      if (author) searchOptions.author = author;
      
      const year = c.req.query('year');
      if (year) {
        const yearNum = parseInt(year, 10);
        if (!isNaN(yearNum)) searchOptions.year = yearNum;
      }
      
      const tags = c.req.query('tags');
      if (tags) searchOptions.tags = tags.split(',').map(tag => tag.trim());
      
      const sortBy = c.req.query('sortBy');
      if (sortBy && ['title', 'author', 'date', 'created'].includes(sortBy)) {
        searchOptions.sortBy = sortBy as 'title' | 'author' | 'date' | 'created';
      }
      
      const sortOrder = c.req.query('sortOrder');
      if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
        searchOptions.sortOrder = sortOrder as 'asc' | 'desc';
      }
      
      const limit = c.req.query('limit');
      if (limit) {
        const limitNum = parseInt(limit, 10);
        if (!isNaN(limitNum) && limitNum > 0) searchOptions.limit = limitNum;
      }
      
      const offset = c.req.query('offset');
      if (offset) {
        const offsetNum = parseInt(offset, 10);
        if (!isNaN(offsetNum) && offsetNum >= 0) searchOptions.offset = offsetNum;
      }

      const result = await this.engine.getReferencesForConversation(conversationId, searchOptions);

      return c.json({
        ...result,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      const errorResponse = createReferencerErrorResponse(
        error,
        {
          operation: 'getReferencesForConversation',
          conversationId: c.req.param('conversationId'),
          timestamp: Date.now(),
          requestId
        },
        Date.now() - startTime
      );

      return c.json(errorResponse, 500);
    }
  }

  /**
   * PUT /api/referencer/references/:referenceId
   * Update a reference
   */
  async updateReference(c: Context<ReferencerContext>) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const referenceId = c.req.param('referenceId');
      
      if (!referenceId) {
        return c.json({
          success: false,
          error: 'Reference ID is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const body = await c.req.json();
      const { extractMetadata = false, ...updateData } = body;

      // Validate reference type if provided
      if (updateData.type && !Object.values(ReferenceType).includes(updateData.type)) {
        return c.json({
          success: false,
          error: `Invalid reference type: ${updateData.type}`,
          processingTime: Date.now() - startTime
        }, 400);
      }

      const reference = await this.engine.updateReference(referenceId, updateData, extractMetadata);

      return c.json({
        success: true,
        reference,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      const errorResponse = createReferencerErrorResponse(
        error,
        {
          operation: 'updateReference',
          referenceId: c.req.param('referenceId'),
          timestamp: Date.now(),
          requestId
        },
        Date.now() - startTime
      );

      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      return c.json(errorResponse, statusCode);
    }
  }

  /**
   * DELETE /api/referencer/references/:referenceId
   * Delete a reference
   */
  async deleteReference(c: Context<ReferencerContext>) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const referenceId = c.req.param('referenceId');
      
      if (!referenceId) {
        return c.json({
          success: false,
          error: 'Reference ID is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      await this.engine.deleteReference(referenceId);

      return c.json({
        success: true,
        message: 'Reference deleted successfully',
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      const errorResponse = createReferencerErrorResponse(
        error,
        {
          operation: 'deleteReference',
          referenceId: c.req.param('referenceId'),
          timestamp: Date.now(),
          requestId
        },
        Date.now() - startTime
      );

      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      return c.json(errorResponse, statusCode);
    }
  }

  /**
   * POST /api/referencer/extract-metadata
   * Extract metadata from URL or DOI
   */
  async extractMetadata(c: Context<ReferencerContext>) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const body = await c.req.json();
      
      // Validate required fields
      const validationError = validateRequiredFields(body, ['source', 'conversationId']);
      if (validationError) {
        return c.json({
          success: false,
          error: validationError,
          processingTime: Date.now() - startTime
        }, 400);
      }

      const { source, type, conversationId } = body;

      // Validate type if provided
      if (type && !['url', 'doi'].includes(type)) {
        return c.json({
          success: false,
          error: 'Type must be either "url" or "doi"',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const request: MetadataExtractionRequest = {
        source,
        type: type || 'url',
        conversationId
      };

      const result = await this.engine.extractMetadata(request);

      return c.json({
        ...result,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      const errorResponse = createReferencerErrorResponse(
        error,
        {
          operation: 'extractMetadata',
          conversationId: (await c.req.json().catch(() => ({})))?.conversationId,
          timestamp: Date.now(),
          requestId
        },
        Date.now() - startTime
      );

      return c.json(errorResponse, 500);
    }
  }

  /**
   * POST /api/referencer/format-citation
   * Format a citation for a reference
   */
  async formatCitation(c: Context<ReferencerContext>) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const body = await c.req.json();
      
      // Validate required fields
      const validationError = validateRequiredFields(body, ['referenceId', 'style', 'type']);
      if (validationError) {
        return c.json({
          success: false,
          error: validationError,
          processingTime: Date.now() - startTime
        }, 400);
      }

      const { referenceId, style, type, context } = body;

      // Validate citation style
      if (!Object.values(CitationStyle).includes(style)) {
        return c.json({
          success: false,
          error: `Invalid citation style: ${style}`,
          processingTime: Date.now() - startTime
        }, 400);
      }

      // Validate citation type
      if (!['inline', 'bibliography'].includes(type)) {
        return c.json({
          success: false,
          error: 'Type must be either "inline" or "bibliography"',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const request: CitationRequest = {
        referenceId,
        style,
        type,
        context
      };

      const result = await this.engine.formatCitation(request);

      return c.json({
        ...result,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      const errorResponse = createReferencerErrorResponse(
        error,
        {
          operation: 'formatCitation',
          referenceId: (await c.req.json().catch(() => ({})))?.referenceId,
          timestamp: Date.now(),
          requestId
        },
        Date.now() - startTime
      );

      return c.json(errorResponse, 500);
    }
  }

  /**
   * POST /api/referencer/generate-bibliography
   * Generate a bibliography for a conversation
   */
  async generateBibliography(c: Context<ReferencerContext>) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const body = await c.req.json();
      
      // Validate required fields
      const validationError = validateRequiredFields(body, ['conversationId', 'style']);
      if (validationError) {
        return c.json({
          success: false,
          error: validationError,
          processingTime: Date.now() - startTime
        }, 400);
      }

      const { conversationId, style, sortOrder = 'alphabetical', includeUrls = false } = body;

      // Validate citation style
      if (!Object.values(CitationStyle).includes(style)) {
        return c.json({
          success: false,
          error: `Invalid citation style: ${style}`,
          processingTime: Date.now() - startTime
        }, 400);
      }

      // Validate sort order
      if (!['alphabetical', 'chronological', 'appearance'].includes(sortOrder)) {
        return c.json({
          success: false,
          error: 'Sort order must be "alphabetical", "chronological", or "appearance"',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const request: BibliographyRequest = {
        conversationId,
        style,
        format: 'text', // Default format
        sortOrder,
        includeUrls
      };

      const result = await this.engine.generateBibliography(request);

      return c.json({
        ...result,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      const errorResponse = createReferencerErrorResponse(
        error,
        {
          operation: 'generateBibliography',
          conversationId: (await c.req.json().catch(() => ({})))?.conversationId,
          timestamp: Date.now(),
          requestId
        },
        Date.now() - startTime
      );

      return c.json(errorResponse, 500);
    }
  }

  /**
   * GET /api/referencer/references/:referenceId
   * Get a specific reference by ID
   */
  async getReferenceById(c: Context<ReferencerContext>) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const referenceId = c.req.param('referenceId');
      
      if (!referenceId) {
        return c.json({
          success: false,
          error: 'Reference ID is required',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const reference = await this.engine.getReferenceById(referenceId);

      if (!reference) {
        return c.json({
          success: false,
          error: 'Reference not found',
          processingTime: Date.now() - startTime
        }, 404);
      }

      return c.json({
        success: true,
        reference,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      const errorResponse = createReferencerErrorResponse(
        error,
        {
          operation: 'getReferenceById',
          referenceId: c.req.param('referenceId'),
          timestamp: Date.now(),
          requestId
        },
        Date.now() - startTime
      );

      return c.json(errorResponse, 500);
    }
  }

  /**
   * POST /api/referencer/add-from-search
   * Add a reference from AI search results
   */
  async addReferenceFromSearch(c: Context<ReferencerContext>) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const body = await c.req.json();
      const { searchResult, conversationId, options } = body;

      if (!searchResult || !conversationId) {
        return c.json({
          success: false,
          error: 'Missing required fields: searchResult and conversationId',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const result = await this.aiSearchManager.addReferenceFromSearchResult(
        searchResult,
        conversationId,
        options || {}
      );

      if (result.success) {
        return c.json({
          success: true,
          reference: result.reference,
          isDuplicate: result.isDuplicate,
          duplicateReference: result.duplicateReference,
          processingTime: Date.now() - startTime
        });
      } else {
        return c.json({
          success: false,
          error: result.error,
          isDuplicate: result.isDuplicate,
          duplicateReference: result.duplicateReference,
          mergeOptions: result.mergeOptions,
          processingTime: Date.now() - startTime
        }, result.isDuplicate ? 409 : 400);
      }

    } catch (error) {
      const errorResponse = createReferencerErrorResponse(
        error,
        {
          operation: 'addReferenceFromSearch',
          conversationId: (await c.req.json().catch(() => ({})))?.conversationId,
          timestamp: Date.now(),
          requestId
        },
        Date.now() - startTime
      );

      return c.json(errorResponse, 500);
    }
  }

  /**
   * POST /api/referencer/add-multiple-from-search
   * Add multiple references from AI search results
   */
  async addMultipleReferencesFromSearch(c: Context<ReferencerContext>) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const body = await c.req.json();
      const { searchResults, conversationId, options } = body;

      if (!searchResults || !Array.isArray(searchResults) || !conversationId) {
        return c.json({
          success: false,
          error: 'Missing required fields: searchResults (array) and conversationId',
          processingTime: Date.now() - startTime
        }, 400);
      }

      const results = await this.aiSearchManager.addMultipleReferencesFromSearchResults(
        searchResults,
        conversationId,
        options || {}
      );

      const successCount = results.filter(r => r.success).length;
      const duplicateCount = results.filter(r => r.isDuplicate).length;
      const errorCount = results.filter(r => !r.success).length;

      return c.json({
        success: true,
        results,
        summary: {
          total: results.length,
          successful: successCount,
          duplicates: duplicateCount,
          errors: errorCount
        },
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      const errorResponse = createReferencerErrorResponse(
        error,
        {
          operation: 'addMultipleReferencesFromSearch',
          conversationId: (await c.req.json().catch(() => ({})))?.conversationId,
          timestamp: Date.now(),
          requestId
        },
        Date.now() - startTime
      );

      return c.json(errorResponse, 500);
    }
  }

  /**
   * POST /api/referencer/merge-duplicate
   * Merge a duplicate reference with an existing one
   */
  async mergeDuplicateReference(c: Context<ReferencerContext>) {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      const body = await c.req.json();
      const { existingReferenceId, newReferenceData, mergeOptions } = body;

      if (!existingReferenceId || !newReferenceData) {
        return c.json({
          success: false,
          error: 'Missing required fields: existingReferenceId and newReferenceData',
          processingTime: Date.now() - startTime
        }, 400);
      }

      // Get the existing reference
      const existingReference = await this.engine.getReferenceById(existingReferenceId);
      if (!existingReference) {
        return c.json({
          success: false,
          error: 'Existing reference not found',
          processingTime: Date.now() - startTime
        }, 404);
      }

      // Apply merge options if provided
      const updateData: any = {};
      if (mergeOptions && mergeOptions.conflicts) {
        for (const conflict of mergeOptions.conflicts) {
          if (conflict.recommendation === 'use_new') {
            updateData[conflict.field] = conflict.newValue;
          } else if (conflict.recommendation === 'merge' && conflict.field === 'authors') {
            // Merge author arrays
            const existingAuthors = Array.isArray(conflict.existingValue) ? conflict.existingValue : [];
            const newAuthors = Array.isArray(conflict.newValue) ? conflict.newValue : [];
            updateData[conflict.field] = [...new Set([...existingAuthors, ...newAuthors])];
          }
        }
      } else {
        // Auto-merge: prefer new values for empty fields
        Object.keys(newReferenceData).forEach(key => {
          if ((newReferenceData as any)[key] && !(existingReference as any)[key]) {
            (updateData as any)[key] = (newReferenceData as any)[key];
          }
        });
      }

      const updatedReference = await this.engine.updateReference(existingReferenceId, updateData);

      return c.json({
        success: true,
        reference: updatedReference,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      const errorResponse = createReferencerErrorResponse(
        error,
        {
          operation: 'mergeDuplicateReference',
          referenceId: (await c.req.json().catch(() => ({})))?.existingReferenceId,
          timestamp: Date.now(),
          requestId
        },
        Date.now() - startTime
      );

      return c.json(errorResponse, 500);
    }
  }
}

// Create Hono app instance
const app = new Hono<ReferencerContext>();

// Create handler instance
const referencerAPIHandler = new ReferencerAPIHandler();

// Routes
app.post('/references', (c) => referencerAPIHandler.createReference(c));
app.get('/references/:conversationId', (c) => referencerAPIHandler.getReferencesForConversation(c));
app.get('/references/:referenceId', (c) => referencerAPIHandler.getReferenceById(c));
app.put('/references/:referenceId', (c) => referencerAPIHandler.updateReference(c));
app.delete('/references/:referenceId', (c) => referencerAPIHandler.deleteReference(c));
app.post('/extract-metadata', (c) => referencerAPIHandler.extractMetadata(c));
app.post('/format-citation', (c) => referencerAPIHandler.formatCitation(c));
app.post('/generate-bibliography', (c) => referencerAPIHandler.generateBibliography(c));
app.post('/add-from-search', (c) => referencerAPIHandler.addReferenceFromSearch(c));
app.post('/add-multiple-from-search', (c) => referencerAPIHandler.addMultipleReferencesFromSearch(c));
app.post('/merge-duplicate', (c) => referencerAPIHandler.mergeDuplicateReference(c));

// Export Hono app as default
export default app;
