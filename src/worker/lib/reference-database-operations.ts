import { getSupabase } from './supabase';
import type {
  Reference,
  ReferenceFormData,
  ReferenceSearchOptions,
  ReferenceListResponse,
  ReferenceStatistics,
  CitationInstance,
  CitationStyle
} from '../../lib/ai-types';
import { ReferenceType } from '../../lib/ai-types';

/**
 * Reference Database Operations
 * Handles all database operations for references and citation instances
 */
export class ReferenceDatabaseOperations {
  private supabase: any = null;
  private env?: any;

  constructor(env?: any) {
    this.env = env;
  }

  private getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = getSupabase(this.env);
    }
    return this.supabase;
  }

  /**
   * Create a new reference
   */
  async createReference(data: ReferenceFormData & { conversationId: string }): Promise<Reference> {
    const referenceData = {
      conversation_id: data.conversationId,
      type: data.type,
      title: data.title,
      authors: JSON.stringify(data.authors),
      publication_date: data.publicationDate ? new Date(data.publicationDate) : null,
      url: data.url || null,
      doi: data.doi || null,
      journal: data.journal || null,
      volume: data.volume || null,
      issue: data.issue || null,
      pages: data.pages || null,
      publisher: data.publisher || null,
      isbn: data.isbn || null,
      edition: data.edition || null,
      chapter: data.chapter || null,
      editor: data.editor || null,
      access_date: data.accessDate ? (typeof data.accessDate === 'string' ? data.accessDate : new Date(data.accessDate).toISOString()) : null,
      notes: data.notes || null,
      tags: data.tags || [],
      metadata_confidence: 1.0 // Default confidence for manual entries
    } as any;

    const response: any = await this.getSupabaseClient()
      .from('references')
      .insert([referenceData] as any)
      .select('*');
      
    const result = response.data?.[0];
    const error = response.error;

    if (error) {
      throw new Error(`Failed to create reference: ${error.message}`);
    }

    return this.mapDatabaseToReference(result);
  }

  /**
   * Get a reference by ID
   */
  async getReferenceById(id: string): Promise<Reference | null> {
    const { data, error } = await this.getSupabaseClient()
      .from('references')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.message.includes('No rows found')) {
        return null;
      }
      throw new Error(`Failed to get reference: ${error.message}`);
    }

    return this.mapDatabaseToReference(data);
  }

  /**
   * Update a reference
   */
  async updateReference(id: string, data: Partial<ReferenceFormData>): Promise<Reference> {
    const updateData: Record<string, unknown> = {};
    
    if (data.type !== undefined) updateData.type = data.type;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.authors !== undefined) updateData.authors = JSON.stringify(data.authors);
    if (data.publicationDate !== undefined) {
      updateData.publication_date = data.publicationDate ? new Date(data.publicationDate) : null;
    }
    if (data.url !== undefined) updateData.url = data.url || null;
    if (data.doi !== undefined) updateData.doi = data.doi || null;
    if (data.journal !== undefined) updateData.journal = data.journal || null;
    if (data.volume !== undefined) updateData.volume = data.volume || null;
    if (data.issue !== undefined) updateData.issue = data.issue || null;
    if (data.pages !== undefined) updateData.pages = data.pages || null;
    if (data.publisher !== undefined) updateData.publisher = data.publisher || null;
    if (data.isbn !== undefined) updateData.isbn = data.isbn || null;
    if (data.edition !== undefined) updateData.edition = data.edition || null;
    if (data.chapter !== undefined) updateData.chapter = data.chapter || null;
    if (data.editor !== undefined) updateData.editor = data.editor || null;
    if (data.accessDate !== undefined) {
      updateData.access_date = data.accessDate ? new Date(data.accessDate) : null;
    }
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.tags !== undefined) updateData.tags = data.tags || [];

    const { data: result, error } = await this.getSupabaseClient()
      .from('references')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update reference: ${error.message}`);
    }

    return this.mapDatabaseToReference(result);
  }

  /**
   * Delete a reference
   */
  async deleteReference(id: string): Promise<void> {
    const { error } = await this.getSupabaseClient()
      .from('references')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete reference: ${error.message}`);
    }
  }

  /**
   * Get references for a conversation with search and filtering
   */
  async getReferencesForConversation(
    conversationId: string, 
    options: ReferenceSearchOptions = {}
  ): Promise<ReferenceListResponse> {
    try {
      let query = this.getSupabaseClient()
        .from('references')
        .select('*')
        .eq('conversation_id', conversationId);

      // Apply filters
      if (options.type && options.type !== 'all') {
        query = query.eq('type', options.type);
      }

      if (options.query) {
        // Search in title, authors, and journal
        query = query.or(`title.ilike.%${options.query}%,journal.ilike.%${options.query}%,authors.ilike.%${options.query}%`);
      }

      if (options.author) {
        query = query.ilike('authors', `%${options.author}%`);
      }

      if (options.year) {
        query = query.gte('publication_date', `${options.year}-01-01`)
                     .lt('publication_date', `${options.year + 1}-01-01`);
      }

      if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }

      // Apply sorting
      const sortBy = options.sortBy || 'created_at';
      const sortOrder = options.sortOrder || 'desc';
      
      switch (sortBy) {
        case 'title':
          query = query.order('title', { ascending: sortOrder === 'asc' });
          break;
        case 'author':
          query = query.order('authors', { ascending: sortOrder === 'asc' });
          break;
        case 'date':
          query = query.order('publication_date', { ascending: sortOrder === 'asc', nullsFirst: false });
          break;
        case 'created':
        default:
          query = query.order('created_at', { ascending: sortOrder === 'asc' });
          break;
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      // Add timeout to prevent hanging
      const queryPromise = query;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 10000); // 10 second timeout
      });

      const { data, error, count } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching references:', error);
        return {
          success: false,
          error: `Failed to get references: ${error.message}`
        };
      }

      const references = data?.map((item: any) => this.mapDatabaseToReference(item)) || [];
      
      // Get statistics with its own timeout
      let statistics: ReferenceStatistics;
      try {
        const statsPromise = this.getConversationStatistics(conversationId);
        const statsTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Statistics timeout')), 5000); // 5 second timeout
        });
        statistics = await Promise.race([statsPromise, statsTimeoutPromise]) as ReferenceStatistics;
      } catch (statsError) {
        console.error('Error fetching statistics, using defaults:', statsError);
        statistics = {
          totalReferences: references.length,
          referencesByType: {} as Record<ReferenceType, number>,
          recentlyAdded: 0,
          averageConfidence: 0,
          topTags: []
        };
      }

      return {
        success: true,
        references,
        total: count || references.length,
        statistics
      };
    } catch (error) {
      console.error('Fatal error in getReferencesForConversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching references'
      };
    }
  }

  /**
   * Search references across all conversations (for reference sharing)
   */
  async searchReferences(options: ReferenceSearchOptions = {}): Promise<ReferenceListResponse> {
    let query = this.getSupabaseClient()
      .from('references')
      .select('*');

    // Apply the same filters as getReferencesForConversation but without conversation filter
    if (options.type && options.type !== 'all') {
      query = query.eq('type', options.type);
    }

    if (options.query) {
      query = query.or(`title.ilike.%${options.query}%,journal.ilike.%${options.query}%,authors.ilike.%${options.query}%`);
    }

    if (options.author) {
      query = query.ilike('authors', `%${options.author}%`);
    }

    if (options.year) {
      query = query.gte('publication_date', `${options.year}-01-01`)
                   .lt('publication_date', `${options.year + 1}-01-01`);
    }

    if (options.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags);
    }

    // Apply sorting
    const sortBy = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    
    switch (sortBy) {
      case 'title':
        query = query.order('title', { ascending: sortOrder === 'asc' });
        break;
      case 'author':
        query = query.order('authors', { ascending: sortOrder === 'asc' });
        break;
      case 'date':
        query = query.order('publication_date', { ascending: sortOrder === 'asc', nullsFirst: false });
        break;
      case 'created':
      default:
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
        break;
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      return {
        success: false,
        error: `Failed to search references: ${error.message}`
      };
    }

      const references = data?.map((item: any) => this.mapDatabaseToReference(item)) || [];    return {
      success: true,
      references,
      total: count || references.length
    };
  }

  /**
   * Get statistics for references in a conversation
   */
  async getConversationStatistics(conversationId: string): Promise<ReferenceStatistics> {
    try {
      const { data, error } = await this.getSupabaseClient()
        .from('references')
        .select('type, publication_date, doi, url, metadata_confidence, created_at, tags')
        .eq('conversation_id', conversationId);

      if (error) {
        console.error('Error in getConversationStatistics:', error);
        throw new Error(`Failed to get statistics: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from statistics query');
      }

      // Initialize stats with proper structure to satisfy ReferenceStatistics interface
      const stats: ReferenceStatistics = {
        totalReferences: data.length,
        referencesByType: {} as Record<ReferenceType, number>,
        recentlyAdded: 0, // Will calculate this based on recent references
        averageConfidence: 0,
        topTags: [] // Will populate with most common tags
      };

      // Initialize type counts
      Object.values(ReferenceType).forEach(type => {
        stats.referencesByType[type] = 0;
      });

      let totalConfidence = 0;
      const tagCounts: Record<string, number> = {};
      let recentCount = 0;
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago

      data.forEach((ref: any) => {
        // Count by type
        stats.referencesByType[ref.type as ReferenceType]++;

        // Count DOI and URL
        if (ref.doi) (stats as any).withDoi = ((stats as any).withDoi || 0) + 1;
        if (ref.url) (stats as any).withUrl = ((stats as any).withUrl || 0) + 1;

        // Sum confidence
        totalConfidence += ref.metadata_confidence || 1.0;

        // Check if recently added (within last 7 days)
        if (ref.created_at) {
          const createdDate = new Date(ref.created_at as string | number | Date);
          if (createdDate.getTime() > oneWeekAgo) {
            recentCount++;
          }
        }

        // Count tags
        if (Array.isArray(ref.tags)) {
          ref.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      stats.averageConfidence = data.length > 0 ? totalConfidence / data.length : 0;
      stats.recentlyAdded = recentCount;

      // Get top 5 tags
      stats.topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);

      return stats;
    } catch (error) {
      console.error('Fatal error in getConversationStatistics:', error);
      // Return default stats on error
      return {
        totalReferences: 0,
        referencesByType: {} as Record<ReferenceType, number>,
        recentlyAdded: 0,
        averageConfidence: 0,
        topTags: []
      };
    }
  }

  /**
   * Create a citation instance
   */
  async createCitationInstance(citationData: {
    referenceId: string;
    conversationId: string;
    citationStyle: CitationStyle;
    citationText: string;
    documentPosition?: number;
    context?: string;
  }): Promise<CitationInstance> {
    const { data, error } = await this.getSupabaseClient()
      .from('citation_instances')
      .insert([{
        reference_id: citationData.referenceId,
        conversation_id: citationData.conversationId,
        citation_style: citationData.citationStyle,
        citation_text: citationData.citationText,
        document_position: citationData.documentPosition || null,
        context: citationData.context || null
      }])
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create citation instance: ${error.message}`);
    }

    return this.mapDatabaseToCitationInstance(data);
  }

  /**
   * Get citation instances for a conversation
   */
  async getCitationInstancesForConversation(conversationId: string): Promise<CitationInstance[]> {
    const { data, error } = await this.getSupabaseClient()
      .from('citation_instances')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get citation instances: ${error.message}`);
    }

    return data?.map((item: any) => this.mapDatabaseToCitationInstance(item)) || [];
  }

  /**
   * Delete citation instances for a reference
   */
  async deleteCitationInstancesForReference(referenceId: string): Promise<void> {
    const { error } = await this.getSupabaseClient()
      .from('citation_instances')
      .delete()
      .eq('reference_id', referenceId);

    if (error) {
      throw new Error(`Failed to delete citation instances: ${error.message}`);
    }
  }

  /**
   * Map database row to Reference interface
   */
  private mapDatabaseToReference(data: Record<string, unknown>): Reference {
    return {
      id: String(data.id),
      conversation_id: String(data.conversation_id),
      type: data.type as ReferenceType,
      title: String(data.title),
      authors: typeof data.authors === 'string' ? JSON.parse(data.authors) : data.authors,
      publication_date: data.publication_date ? new Date(data.publication_date as string | number | Date).toISOString() : undefined,
      url: data.url ? String(data.url) : undefined,
      doi: data.doi ? String(data.doi) : undefined,
      journal: data.journal ? String(data.journal) : undefined,
      volume: data.volume ? String(data.volume) : undefined,
      issue: data.issue ? String(data.issue) : undefined,
      pages: data.pages ? String(data.pages) : undefined,
      publisher: data.publisher ? String(data.publisher) : undefined,
      isbn: data.isbn ? String(data.isbn) : undefined,
      edition: data.edition ? String(data.edition) : undefined,
      chapter: data.chapter ? String(data.chapter) : undefined,
      editor: data.editor ? String(data.editor) : undefined,
      access_date: data.access_date ? new Date(data.access_date as string | number | Date).toISOString() : undefined,
      notes: data.notes ? String(data.notes) : undefined,
      tags: Array.isArray(data.tags) ? data.tags as string[] : [],
      metadata_confidence: typeof data.metadata_confidence === 'number' ? data.metadata_confidence : 1.0,
      ai_confidence: typeof data.ai_confidence === 'number' ? data.ai_confidence : 0,
      ai_relevance_score: typeof data.ai_relevance_score === 'number' ? data.ai_relevance_score : 0,
      created_at: new Date(data.created_at as string | number | Date).toISOString(),
      updated_at: new Date(data.updated_at as string | number | Date).toISOString()
    };
  }

  /**
   * Map database row to CitationInstance interface
   */
  private mapDatabaseToCitationInstance(data: Record<string, unknown>): CitationInstance {
    return {
      id: String(data.id),
      reference_id: String(data.reference_id),
      conversation_id: String(data.conversation_id),
      citation_style: data.citation_style as CitationStyle,
      citation_text: String(data.citation_text),
      document_position: typeof data.document_position === 'number' ? data.document_position : undefined,
      context: data.context ? String(data.context) : undefined,
      created_at: new Date(data.created_at as string | number | Date).toISOString()
    };
  }
}
