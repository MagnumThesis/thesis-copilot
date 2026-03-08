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
      const { content: extractedContent, errors } = await this.fetchContentFromSources(contentSources, req.context?.env);

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

      const { content: extractedContent, errors } = await this.fetchContentFromSources(contentSources, context?.env);

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
      const { content: contents } = await this.fetchContentFromSources([{ source, id }], context?.env);
      const content = contents[0];

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
   * Helper: Fetch content from different sources in bulk
   */
  private static async fetchContentFromSources(
    sources: Array<{ source: string; id: string }>,
    env: any
  ): Promise<{ content: ExtractedContent[], errors: string[] }> {
    const extractedContent: ExtractedContent[] = [];
    const errors: string[] = [];

    try {
      const supabase = getSupabase(env);

      // Group IDs by source to batch queries
      const ideasIds: number[] = [];
      const builderIds: string[] = [];

      for (const source of sources) {
        if (source.source === 'ideas') {
          const numId = parseInt(source.id, 10);
          if (!isNaN(numId)) {
            ideasIds.push(numId);
          } else {
            errors.push(`Invalid ID format for ideas: ${source.id}`);
          }
        } else if (source.source === 'builder') {
          builderIds.push(source.id);
        } else {
          errors.push(`Unknown source type: ${source.source}`);
        }
      }

      const fetchPromises: Promise<void>[] = [];

      // Fetch ideas in batch
      if (ideasIds.length > 0) {
        fetchPromises.push(Promise.resolve(
          supabase
            .from('ideas')
            .select('*')
            .in('id', ideasIds)
            .then(({ data, error }) => {
              if (error) {
                errors.push(`Error fetching ideas: ${error.message}`);
                return;
              }
              if (data) {
                for (const item of data) {
                  const text = item.description || '';
                  const title = item.title || '';
                  const keywords = this.extractKeywordsFromText(text, title);

                  extractedContent.push({
                    source: 'ideas',
                    id: String(item.id),
                    title,
                    content: text,
                    keywords,
                    confidence: 0.9
                  });
                }

                // Track missing IDs
                const fetchedIds = new Set(data.map(d => d.id));
                for (const id of ideasIds) {
                  if (!fetchedIds.has(id)) {
                    errors.push(`Failed to fetch ideas:${id}`);
                  }
                }
              }
            })
        ).catch((err: any) => { errors.push(`Error fetching ideas: ${err.message}`); }) as Promise<void>);
      }

      // Fetch builder messages in batch
      if (builderIds.length > 0) {
        fetchPromises.push(Promise.resolve(
          supabase
            .from('messages')
            .select('*')
            .in('message_id', builderIds)
            .then(({ data, error }) => {
              if (error) {
                errors.push(`Error fetching builder messages: ${error.message}`);
                return;
              }
              if (data) {
                for (const item of data) {
                  const content = Array.isArray(item.content)
                    ? item.content.map((c: any) => c.text || '').join(' ')
                    : item.content || '';

                  const keywords = this.extractKeywordsFromText(content);

                  extractedContent.push({
                    source: 'builder',
                    id: item.message_id,
                    title: `Message`,
                    content: content,
                    keywords,
                    confidence: 0.85
                  });
                }

                // Track missing IDs
                const fetchedIds = new Set(data.map(d => d.message_id));
                for (const id of builderIds) {
                  if (!fetchedIds.has(id)) {
                    errors.push(`Failed to fetch builder:${id}`);
                  }
                }
              }
            })
        ).catch((err: any) => { errors.push(`Error fetching builder messages: ${err.message}`); }) as Promise<void>);
      }

      // Wait for all batch queries to complete
      await Promise.all(fetchPromises);

      // Sort the results to match the original sources order
      const sortedContent: ExtractedContent[] = [];
      for (const source of sources) {
        const found = extractedContent.find(c => c.source === source.source && c.id === source.id);
        if (found) {
          sortedContent.push(found);
        }
      }

      return { content: sortedContent, errors };

    } catch (error) {
      console.error(`Error fetching content from sources:`, error);
      errors.push(`Global error fetching content: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { content: [], errors };
    }
  }
}
