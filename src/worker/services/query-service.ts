// src/worker/services/query-service.ts
// Service for query generation and refinement operations (modular refactor)

import { QueryGenerationEngine } from '../lib/query-generation-engine';
import { ExtractedContent } from '../../lib/ai-types';
import { getSupabase } from '../lib/supabase';

export interface QueryServiceRequest {
  conversationId: string;
  prompt?: string;
  query?: string;
  queries?: string[];
  context?: any;
  refinementContext?: any;
  contentSources?: Array<{ source: string; id: string }>;
  source?: string;
  id?: string;
  options?: Record<string, any>;
}

export interface QueryServiceResponse {
  success?: boolean;
  query?: string;
  queries?: string[] | Array<{ query: string }>;
  isValid?: boolean;
  suggestions?: string[];
  content?: any;
  preview?: any;
  extractedContent?: ExtractedContent;
  error?: string;
  metadata: Record<string, any>;
  analytics?: Record<string, any>;
}

export class QueryService {
  /**
   * Generates a query from a prompt or content sources
   */
  static async generateQuery(req: QueryServiceRequest): Promise<QueryServiceResponse> {
    try {
      const { contentSources, options, conversationId } = req;
      
      console.log('Generate query request:', { contentSources, hasEnv: !!req.context?.env });
      
      if (!contentSources || contentSources.length === 0) {
        return {
          success: true,
          query: req.prompt || '',
          queries: [{ query: req.prompt || '' }],
          metadata: {
            generated: true,
            source: 'prompt'
          }
        };
      }

      // Extract content from sources (ideas, messages, etc.)
      const extractedContent: ExtractedContent[] = [];
      const errors: string[] = [];
      
      for (const source of contentSources) {
        try {
          const content = await this.fetchContentFromSource(source.source, source.id, req.context?.env);
          if (content) {
            extractedContent.push(content);
          } else {
            errors.push(`Failed to fetch ${source.source}:${source.id}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error fetching ${source.source}:${source.id} - ${errorMsg}`);
          console.error(`Error fetching content from ${source.source}:${source.id}:`, error);
        }
      }

      if (extractedContent.length === 0) {
        return {
          success: false,
          query: '',
          queries: [],
          error: 'No content could be extracted',
          metadata: {
            generated: false,
            error: 'No content could be extracted',
            details: errors
          }
        };
      }

      // Generate queries using QueryGenerationEngine
      const engine = new QueryGenerationEngine();
      const queries = engine.generateQueries(extractedContent, {
        maxKeywords: options?.maxKeywords || 8,
        maxTopics: options?.maxTopics || 5,
        optimizeForAcademic: options?.optimizeForAcademic !== false,
        includeKeywords: options?.includeKeywords !== false,
        includeTopics: options?.includeTopics !== false
      });

      const mainQuery = queries[0];
      
      return {
        success: true,
        query: mainQuery.query,
        queries: queries.map(q => ({ query: q.query })),
        extractedContent: extractedContent[0], // Pass first extracted content for preview
        metadata: {
          generated: true,
          keywords: mainQuery.keywords,
          topics: mainQuery.topics,
          confidence: mainQuery.confidence,
          source: 'content-extraction',
          extractedCount: extractedContent.length,
          errors: errors.length > 0 ? errors : undefined
        }
      };
    } catch (error) {
      console.error('Error generating query:', error);
      return {
        success: false,
        query: req.prompt || '',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          generated: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Validates a query
   */
  static async validateQuery(req: QueryServiceRequest): Promise<QueryServiceResponse> {
    const query = req.query || '';
    const isValid = query.length > 3 && query.length < 500;
    
    const suggestions: string[] = [];
    if (query.length <= 3) {
      suggestions.push('Query is too short. Add more specific terms.');
    }
    if (query.length >= 500) {
      suggestions.push('Query is too long. Consider simplifying.');
    }
    
    return {
      isValid,
      suggestions,
      metadata: {
        queryLength: query.length,
        wordCount: query.split(/\s+/).length
      }
    };
  }

  /**
   * Combines multiple queries into one
   */
  static async combineQueries(req: QueryServiceRequest): Promise<QueryServiceResponse> {
    const queries = req.queries || [];
    
    if (queries.length === 0) {
      return {
        query: '',
        metadata: { combined: false }
      };
    }
    
    if (queries.length === 1) {
      return {
        query: queries[0],
        metadata: { combined: false }
      };
    }
    
    // Simple combination - join with OR
    const combinedQuery = queries.join(' OR ');
    
    return {
      query: combinedQuery,
      metadata: {
        combined: true,
        sourceQueriesCount: queries.length
      }
    };
  }

  /**
   * Refines an existing query
   */
  static async refineQuery(req: QueryServiceRequest): Promise<QueryServiceResponse> {
    const originalQuery = req.query || '';
    const refinementContext = req.refinementContext || {};
    
    // Simple refinement - add filters/modifiers
    let refinedQuery = originalQuery;
    
    if (refinementContext.yearStart) {
      refinedQuery += ` after:${refinementContext.yearStart}`;
    }
    
    return {
      query: refinedQuery,
      metadata: {
        refined: true,
        originalQuery
      }
    };
  }

  /**
   * Extracts content from sources
   */
  static async extractContent(req: QueryServiceRequest): Promise<QueryServiceResponse> {
    try {
      const { contentSources, context } = req;
      
      console.log('Extract content request:', { contentSources, hasEnv: !!context?.env });
      
      if (!contentSources || contentSources.length === 0) {
        return {
          content: [],
          metadata: { extracted: false, error: 'No content sources provided' }
        };
      }
      
      const extractedContent: ExtractedContent[] = [];
      const errors: string[] = [];
      
      for (const source of contentSources) {
        try {
          const content = await this.fetchContentFromSource(source.source, source.id, context?.env);
          if (content) {
            extractedContent.push(content);
          } else {
            errors.push(`Failed to fetch ${source.source}:${source.id}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error fetching ${source.source}:${source.id} - ${errorMsg}`);
          console.error(`Error fetching content from ${source.source}:${source.id}:`, error);
        }
      }
      
      return {
        content: extractedContent,
        metadata: {
          extracted: true,
          count: extractedContent.length,
          errors: errors.length > 0 ? errors : undefined
        }
      };
    } catch (error) {
      console.error('Error in extractContent:', error);
      return {
        content: [],
        metadata: {
          extracted: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Generates content preview
   */
  static async contentPreview(req: QueryServiceRequest): Promise<QueryServiceResponse> {
    const { source, id, context } = req;
    
    console.log('Content preview request:', { source, id, hasEnv: !!context?.env });
    
    if (!source || !id) {
      return {
        preview: null,
        metadata: { success: false, error: 'Missing source or id' }
      };
    }
    
    try {
      const content = await this.fetchContentFromSource(source, id, context?.env);
      
      console.log('Fetched content:', { content: !!content, source, id });
      
      if (!content) {
        return {
          preview: null,
          metadata: { success: false, error: 'Content not found' }
        };
      }
      
      // Generate extracted content in the format the frontend expects
      const extractedContent = {
        source: content.source,
        title: content.title || 'Untitled',
        content: content.content || '',
        keywords: content.keywords || [],
        keyPhrases: content.keyPhrases || [],
        topics: content.topics || [],
        confidence: content.confidence || 0.85
      };
      
      return {
        extractedContent,
        preview: {
          title: content.title || 'Untitled',
          text: (content.content || '').substring(0, 200) + ((content.content?.length || 0) > 200 ? '...' : ''),
          keywords: content.keywords || [],
          source: content.source
        },
        metadata: {
          success: true,
          source,
          id
        }
      };
    } catch (error) {
      console.error('Error in contentPreview:', error);
      return {
        preview: null,
        metadata: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Helper: Extract keywords from text
   */
  private static extractKeywordsFromText(text: string, title?: string): string[] {
    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when',
      'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
      'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
      'than', 'too', 'very', 'also'
    ]);

    // Combine title and text
    const combinedText = title ? `${title} ${text}` : text;
    
    // Extract words (3+ chars, alphanumeric)
    const words = combinedText
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 3 && !stopWords.has(word));

    // Count word frequency
    const wordCounts = new Map<string, number>();
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    // Sort by frequency and take top keywords
    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word]) => word);
  }

  /**
   * Helper: Fetch content from different sources
   */
  private static async fetchContentFromSource(
    source: string,
    id: string,
    env: any
  ): Promise<ExtractedContent | null> {
    try {
      const supabase = getSupabase(env);
      
      if (source === 'ideas') {
        const numId = parseInt(id as string, 10);
        const { data, error } = await supabase
          .from('ideas')
          .select('*')
          .eq('id', numId)
          .single();
        
        if (error || !data) return null;
        
        const text = data.description || '';
        const title = data.title || '';
        const keywords = this.extractKeywordsFromText(text, title);
        
        return {
          source: 'ideas',
          id: data.id,
          title,
          content: text,
          keywords,
          confidence: 0.9
        };
      }
      
      if (source === 'builder') {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('message_id', id)
          .single();
        
        if (error || !data) return null;
        
        const content = Array.isArray(data.content) 
          ? data.content.map((c: any) => c.text || '').join(' ')
          : data.content || '';
        
        const keywords = this.extractKeywordsFromText(content);
        
        return {
          source: 'builder',
          id: data.message_id,
          title: `Message`,
          content: content,
          keywords,
          confidence: 0.85
        };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching content from ${source}:`, error);
      return null;
    }
  }
}
