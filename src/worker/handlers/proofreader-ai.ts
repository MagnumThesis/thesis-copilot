import { Context } from "hono";
import { getSupabase, SupabaseEnv } from "../lib/supabase";
import { Env } from "../types/env";
import { getGoogleGenerativeAIKey } from "../lib/api-keys";
import { createConcernAnalysisEngine } from "../lib/concern-analysis-engine";
import { 
  ProofreaderAnalysisRequest,
  ProofreaderAnalysisResponse,
  ProofreadingConcern,
  ConcernStatus,
  ConcernStatusUpdate,
  ConcernStatistics,
  ConcernCategory,
  ConcernSeverity,
  AnalysisMetadata
} from "../../lib/ai-types";

// Enhanced error handling for proofreader operations
interface ProofreaderErrorContext {
  operation: string;
  conversationId: string;
  timestamp: number;
  requestId?: string;
}

/**
 * Create standardized error response for proofreader operations
 */
function createProofreaderErrorResponse(
  error: unknown,
  context: ProofreaderErrorContext,
  processingTime: number
): ProofreaderAnalysisResponse {
  let errorMessage = "An unexpected error occurred during proofreading analysis";

  if (error instanceof Error) {
    errorMessage = error.message;
    
    // Categorize errors for better handling
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      errorMessage = "AI service authentication failed";
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      errorMessage = "AI service quota exceeded";
    } else if (error.message.includes('timeout') || error.message.includes('network')) {
      errorMessage = "Network connection failed";
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      errorMessage = "Too many requests, please wait";
    } else if (error.message.includes('content filter') || error.message.includes('safety')) {
      errorMessage = "Content was blocked by safety filters";
    } else if (error.message.includes('Content is required')) {
      errorMessage = "Document content is required for analysis";
    } else {
      errorMessage = "Proofreading service temporarily unavailable";
    }
  }

  console.error(`Proofreader Error in ${context.operation}:`, {
    error: errorMessage,
    context,
    processingTime,
    timestamp: new Date().toISOString()
  });

  return {
    success: false,
    concerns: [],
    analysis: {
      totalConcerns: 0,
      concernsByCategory: {} as Record<ConcernCategory, number>,
      concernsBySeverity: {} as Record<ConcernSeverity, number>,
      overallQualityScore: 0
    },
    metadata: {
      processingTime: 0,
      modelUsed: '',
      analysisTimestamp: new Date().toISOString(),
      version: '1.0',
      confidence: 0
    },
    error: errorMessage
  };
}

/**
 * Validate proofreader analysis request
 */
function validateProofreaderRequest(body: any): void {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  if (!body.conversationId || typeof body.conversationId !== 'string') {
    throw new Error('Missing or invalid conversation ID');
  }

  if (!body.documentContent || typeof body.documentContent !== 'string') {
    throw new Error('Missing or invalid document content');
  }

  // Check content length limits
  if (body.documentContent.length > 100000) {
    throw new Error('Document content too large (max 100KB)');
  }

  if (body.documentContent.trim().length < 10) {
    throw new Error('Document content too short for meaningful analysis');
  }

  // Validate idea definitions if provided
  if (body.ideaDefinitions && !Array.isArray(body.ideaDefinitions)) {
    throw new Error('Invalid idea definitions format');
  }
}

/**
 * Validate concern status update request
 */
function validateStatusUpdateRequest(body: any): void {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  if (!body.status || typeof body.status !== 'string') {
    throw new Error('Missing or invalid status');
  }

  if (!Object.values(ConcernStatus).includes(body.status as ConcernStatus)) {
    throw new Error('Invalid concern status value');
  }
}

/**
 * Proofreader Analysis Handler
 * Analyzes document content and generates proofreading concerns
 */
export async function proofreaderAnalysisHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
): Promise<Response> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  let context: ProofreaderErrorContext = {
    operation: 'analysis',
    conversationId: 'unknown',
    timestamp: startTime,
    requestId
  };
  
  try {
    const body = await c.req.json();
    
    // Validate request
    try {
      validateProofreaderRequest(body);
    } catch (validationError) {
      const processingTime = Date.now() - startTime;
      return c.json(createProofreaderErrorResponse(
        validationError,
        context,
        processingTime
      ), 400);
    }
    
    const { conversationId, documentContent, ideaDefinitions = [], analysisOptions }: ProofreaderAnalysisRequest = body;
    
    // Update context with actual conversation ID
    context = {
      operation: 'analysis',
      conversationId,
      timestamp: startTime,
      requestId
    };
    
    // Get AI API key
    const apiKey = getGoogleGenerativeAIKey(c);
    if (!apiKey) {
      const processingTime = Date.now() - startTime;
      return c.json(createProofreaderErrorResponse(
        new Error('AI service authentication failed'),
        context,
        processingTime
      ), 503);
    }
    
    // Initialize concern analysis engine
    const analysisEngine = createConcernAnalysisEngine(apiKey);
    
    // Perform content analysis
    let concerns: ProofreadingConcern[];
    try {
      concerns = await analysisEngine.analyzeContent(documentContent, conversationId);
    } catch (error) {
      console.error('Content analysis failed:', error);
      const processingTime = Date.now() - startTime;
      return c.json(createProofreaderErrorResponse(error, context, processingTime), 500);
    }
    
    // Apply analysis options filters if provided
    if (analysisOptions) {
      concerns = applyAnalysisFilters(concerns, analysisOptions);
    }
    
    // Store concerns in database
    const supabase = getSupabase(c.env);
    try {
      await storeConcernsInDatabase(supabase, concerns);
    } catch (error) {
      console.error('Failed to store concerns in database:', error);
      // Continue with response even if storage fails
    }
    
    // Generate analysis metadata
    const processingTime = Date.now() - startTime;
    const analysisMetadata: AnalysisMetadata = {
      processingTime: processingTime,
      modelUsed: 'default-model',
      analysisTimestamp: new Date().toISOString(),
      version: '1.0',
      confidence: 0.95,
      totalConcerns: concerns.length,
      concernsByCategory: generateCategoryBreakdown(concerns),
      concernsBySeverity: generateSeverityBreakdown(concerns),
      analysisTime: processingTime,
      contentLength: documentContent.length,
      ideaDefinitionsUsed: ideaDefinitions.length
    };
    
    const response: ProofreaderAnalysisResponse = {
      success: true,
      concerns,
      analysis: {
        totalConcerns: concerns.length,
        concernsByCategory: generateCategoryBreakdown(concerns),
        concernsBySeverity: generateSeverityBreakdown(concerns),
        overallQualityScore: 0.8 // Placeholder value
      },
      metadata: {
        processingTime: processingTime,
        modelUsed: 'default-model',
        analysisTimestamp: new Date().toISOString(),
        version: '1.0',
        confidence: 0.95
      },
      analysisMetadata
    };
    
    return c.json(response);
    
  } catch (err: unknown) {
    const processingTime = Date.now() - startTime;
    return c.json(createProofreaderErrorResponse(err, context, processingTime), 500);
  }
}

/**
 * Get Concerns Handler
 * Retrieves proofreading concerns for a conversation with optional filtering
 */
export async function getConcernsHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
): Promise<Response> {
  
  try {
    const conversationId = c.req.param('conversationId');
    if (!conversationId) {
      return c.json({ success: false, error: 'Missing conversation ID' }, 400);
    }
    
    // Get query parameters for filtering
    const status = c.req.query('status') as ConcernStatus | undefined;
    const category = c.req.query('category') as ConcernCategory | undefined;
    const severity = c.req.query('severity') as ConcernSeverity | undefined;
    
    const supabase = getSupabase(c.env);
    
    // Build query with filters
    let query = supabase
      .from('proofreading_concerns')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (severity) {
      query = query.eq('severity', severity);
    }
    
    const { data: concerns, error } = await query;
    
    if (error) {
      console.error('Failed to retrieve concerns:', error);
      return c.json({ success: false, error: 'Failed to retrieve concerns' }, 500);
    }
    
    // Convert database records to ProofreadingConcern objects
    const formattedConcerns: ProofreadingConcern[] = (concerns || []).map(concern => ({
      id: concern.id,
      conversationId: concern.conversation_id,
      category: concern.category as ConcernCategory,
      severity: concern.severity as ConcernSeverity,
      title: concern.title,
      description: concern.description,
      location: concern.location,
      suggestions: concern.suggestions || [],
      relatedIdeas: concern.related_ideas || [],
      status: concern.status as ConcernStatus,
      createdAt: concern.created_at,
      updatedAt: concern.updated_at,
      text: concern.text || '',
      position: concern.position || { start: 0, end: 0 },
      explanation: concern.explanation || '',
      aiGenerated: concern.ai_generated === true || concern.aiGenerated === true || (typeof concern.explanation === 'string' && concern.explanation.startsWith('(AI-generated)')),
      created_at: concern.created_at,
      updated_at: concern.updated_at
    }));
    
    return c.json({
      success: true,
      concerns: formattedConcerns
    });
    
  } catch (err: unknown) {
    console.error('Error retrieving concerns:', err);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
}

/**
 * Update Concern Status Handler
 * Updates the status of a specific proofreading concern
 */
export async function updateConcernStatusHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
): Promise<Response> {
  
  try {
    const concernId = c.req.param('concernId');
    if (!concernId) {
      return c.json({ success: false, error: 'Missing concern ID' }, 400);
    }
    
    const body = await c.req.json();
    
    // Validate request
    try {
      validateStatusUpdateRequest(body);
    } catch (validationError) {
      const errorMessage = validationError instanceof Error ? validationError.message : 'Validation failed';
      return c.json({ success: false, error: errorMessage }, 400);
    }
    
    const { status }: ConcernStatusUpdate = body;
    
    const supabase = getSupabase(c.env);
    
    // Update concern status in database
    const { data, error } = await supabase
      .from('proofreading_concerns')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', concernId)
      .select()
      .single();
    
    if (error) {
      console.error('Failed to update concern status:', error);
      return c.json({ success: false, error: 'Failed to update concern status' }, 500);
    }
    
    if (!data) {
      return c.json({ success: false, error: 'Concern not found' }, 404);
    }
    
    // Convert database record to ProofreadingConcern object
    const updatedConcern: ProofreadingConcern = {
      id: data.id,
      conversationId: data.conversation_id,
      category: data.category as ConcernCategory,
      severity: data.severity as ConcernSeverity,
      title: data.title,
      description: data.description,
      location: data.location,
      suggestions: data.suggestions || [],
      relatedIdeas: data.related_ideas || [],
      status: data.status as ConcernStatus,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      text: data.text || '',
      position: data.position || { start: 0, end: 0 },
      explanation: data.explanation || '',
      aiGenerated: data.ai_generated === true || data.aiGenerated === true || (typeof data.explanation === 'string' && data.explanation.startsWith('(AI-generated)')),
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    return c.json({
      success: true,
      concern: updatedConcern
    });
    
  } catch (err: unknown) {
    console.error('Error updating concern status:', err);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
}

/**
 * Get Concern Statistics Handler
 * Retrieves statistics about concerns for a conversation
 */
export async function getConcernStatisticsHandler(
  c: Context<{ Bindings: Env & SupabaseEnv }>
): Promise<Response> {
  try {
    const conversationId = c.req.param('conversationId');
    if (!conversationId) {
      return c.json({ success: false, error: 'Missing conversation ID' }, 400);
    }
    
    const supabase = getSupabase(c.env);
    
    // Get all concerns for the conversation
    const { data: concerns, error } = await supabase
      .from('proofreading_concerns')
      .select('category, severity, status')
      .eq('conversation_id', conversationId);
    
    if (error) {
      console.error('Failed to retrieve concern statistics:', error);
      return c.json({ success: false, error: 'Failed to retrieve statistics' }, 500);
    }
    
    // Generate statistics
    const statistics = generateConcernStatistics(concerns || []);
    
    return c.json({
      success: true,
      statistics
    });
    
  } catch (err: unknown) {
    console.error('Error retrieving concern statistics:', err);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
}

// Helper functions

/**
 * Apply analysis options filters to concerns
 */
function applyAnalysisFilters(concerns: ProofreadingConcern[], options: any): ProofreadingConcern[] {
  let filtered = concerns;
  
  if (options.categories && options.categories.length > 0) {
    filtered = filtered.filter(concern => options.categories.includes(concern.category));
  }
  
  if (options.minSeverity) {
    const severityOrder = [ConcernSeverity.LOW, ConcernSeverity.MEDIUM, ConcernSeverity.HIGH, ConcernSeverity.CRITICAL];
    const minIndex = severityOrder.indexOf(options.minSeverity);
    filtered = filtered.filter(concern => severityOrder.indexOf(concern.severity) >= minIndex);
  }
  
  if (options.includeGrammar === false) {
    filtered = filtered.filter(concern => concern.category !== ConcernCategory.GRAMMAR);
  }
  
  return filtered;
}

/**
 * Store concerns in database
 */
async function storeConcernsInDatabase(supabase: any, concerns: ProofreadingConcern[]): Promise<void> {
  if (concerns.length === 0) return;
  
  // Convert concerns to database format
  const dbConcerns = concerns.map(concern => ({
    id: concern.id,
    conversation_id: concern.conversationId,
    category: concern.category,
    severity: concern.severity,
    title: concern.title,
    description: concern.description,
    location: concern.location,
    suggestions: concern.suggestions,
    related_ideas: concern.relatedIdeas,
    status: concern.status,
    ai_generated: (concern as any).aiGenerated === true || (typeof concern.explanation === 'string' && concern.explanation.startsWith('(AI-generated)')),
    created_at: concern.createdAt || new Date().toISOString(),
    updated_at: concern.updatedAt || new Date().toISOString()
  }));
  
  // Delete existing 'to_be_done' concerns for this conversation before inserting new analysis results
  // This preserves concerns that were addressed/rejected by the user.
  await supabase
    .from('proofreading_concerns')
    .delete()
    .eq('conversation_id', concerns[0].conversationId)
    .eq('status', ConcernStatus.TO_BE_DONE);
  
  // Insert new concerns
  const { error } = await supabase
    .from('proofreading_concerns')
    .insert(dbConcerns);
  
  if (error) {
    throw new Error(`Failed to store concerns: ${error.message}`);
  }
}

/**
 * Generate category breakdown for analysis metadata
 */
function generateCategoryBreakdown(concerns: ProofreadingConcern[]): Record<ConcernCategory, number> {
  const breakdown = {} as Record<ConcernCategory, number>;
  
  // Initialize all categories with 0
  Object.values(ConcernCategory).forEach(category => {
    breakdown[category] = 0;
  });
  
  // Count concerns by category
  concerns.forEach(concern => {
    breakdown[concern.category]++;
  });
  
  return breakdown;
}

/**
 * Generate severity breakdown for analysis metadata
 */
function generateSeverityBreakdown(concerns: ProofreadingConcern[]): Record<ConcernSeverity, number> {
  const breakdown = {} as Record<ConcernSeverity, number>;
  
  // Initialize all severities with 0
  Object.values(ConcernSeverity).forEach(severity => {
    breakdown[severity] = 0;
  });
  
  // Count concerns by severity
  concerns.forEach(concern => {
    breakdown[concern.severity]++;
  });
  
  return breakdown;
}

/**
 * Generate concern statistics from database records
 */
function generateConcernStatistics(concerns: any[]): ConcernStatistics {
  const total = concerns.length;
  const toBeDone = concerns.filter(c => c.status === ConcernStatus.TO_BE_DONE).length;
  const addressed = concerns.filter(c => c.status === ConcernStatus.ADDRESSED).length;
  const rejected = concerns.filter(c => c.status === ConcernStatus.REJECTED).length;
  
  // Generate breakdown by category
  const byCategory = {} as Record<ConcernCategory, any>;
  Object.values(ConcernCategory).forEach(category => {
    const categoryData = concerns.filter(c => c.category === category);
    byCategory[category] = {
      total: categoryData.length,
      toBeDone: categoryData.filter(c => c.status === ConcernStatus.TO_BE_DONE).length,
      addressed: categoryData.filter(c => c.status === ConcernStatus.ADDRESSED).length,
      rejected: categoryData.filter(c => c.status === ConcernStatus.REJECTED).length
    };
  });
  
  // Generate breakdown by severity
  const bySeverity = {} as Record<ConcernSeverity, any>;
  Object.values(ConcernSeverity).forEach(severity => {
    const severityData = concerns.filter(c => c.severity === severity);
    bySeverity[severity] = {
      total: severityData.length,
      toBeDone: severityData.filter(c => c.status === ConcernStatus.TO_BE_DONE).length,
      addressed: severityData.filter(c => c.status === ConcernStatus.ADDRESSED).length,
      rejected: severityData.filter(c => c.status === ConcernStatus.REJECTED).length
    };
  });
  
  return {
    totalConcerns: total,
    concernsByStatus: {
      [ConcernStatus.OPEN]: 0, // Placeholder values
      [ConcernStatus.RESOLVED]: 0,
      [ConcernStatus.DISMISSED]: 0,
      [ConcernStatus.ADDRESSED]: addressed,
      [ConcernStatus.REJECTED]: rejected,
      [ConcernStatus.TO_BE_DONE]: toBeDone
    },
    concernsByCategory: byCategory as Record<ConcernCategory, number>,
    concernsBySeverity: bySeverity as Record<ConcernSeverity, number>,
    resolutionRate: total > 0 ? (addressed + rejected) / total : 0,
    averageResolutionTime: 0, // Placeholder value
    total,
    toBeDone,
    addressed,
    rejected,
    byCategory,
    bySeverity
  };
}