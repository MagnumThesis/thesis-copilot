import { getSupabase } from './supabase';
import type { 
  Reference, 
  ReferenceFormData, 
  ReferenceSearchOptions, 
  ReferenceListResponse,
  ReferenceStatistics,
  CitationInstance,
  Author,
  ReferenceType,
  CitationStyle
} from '../../lib/ai-types';

/**
 * Reference Database Operations
 * Handles all database operations for references and citation instances
 */
export class ReferenceDatabaseOperations {
  private supabase;

  constructor() {
    this.supabase = getSupabase();
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
      access_date: data.accessDate ? new Date(data.accessDate) : null,
      notes: data.notes || null,
      tags: data.tags || [],
      metadata_confidence: 1.0 // Default confidence for manual entries
    };

    const { data: result, error } = await this.supabase
      .from('references')
      .insert([referenceData])
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create reference: ${error.message}`);
    }

    return this.mapDatabaseToReference(result);
  }

  /**
   * Get a reference by ID
   */
  async getReferenceById(id: string): Promise<Reference | null> {
    const { data, error } = await this.supabase
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
    const updateData: any = {};
    
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

    const { data: result, error } = await this.supabase
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
    const { error } = await this.supabase
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
    let query = this.supabase
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

    const { data, error, count } = await query;

    if (error) {
      return {
        success: false,
        error: `Failed to get references: ${error.message}`
      };
    }

    const references = data?.map(item => this.mapDatabaseToReference(item)) || [];
    const statistics = await this.getConversationStatistics(conversationId);

    return {
      success: true,
      references,
      total: count || references.length,
      statistics
    };
  }

  /**
   * Search references across all conversations (for reference sharing)
   */
  async searchReferences(options: ReferenceSearchOptions = {}): Promise<ReferenceListResponse> {
    let query = this.supabase
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

    const references = data?.map(item => this.mapDatabaseToReference(item)) || [];

    return {
      success: true,
      references,
      total: count || references.length
    };
  }

  /**
   * Get statistics for references in a conversation
   */
  async getConversationStatistics(conversationId: string): Promise<ReferenceStatistics> {
    const { data, error } = await this.supabase
      .from('references')
      .select('type, publication_date, doi, url, metadata_confidence')
      .eq('conversation_id', conversationId);

    if (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }

    const stats: ReferenceStatistics = {
      total: data.length,
      byType: {} as Record<ReferenceType, number>,
      byYear: {},
      withDoi: 0,
      withUrl: 0,
      averageConfidence: 0
    };

    // Initialize type counts
    Object.values(ReferenceType).forEach(type => {
      stats.byType[type] = 0;
    });

    let totalConfidence = 0;

    data.forEach(ref => {
      // Count by type
      stats.byType[ref.type as ReferenceType]++;

      // Count by year
      if (ref.publication_date) {
        const year = new Date(ref.publication_date).getFullYear().toString();
        stats.byYear[year] = (stats.byYear[year] || 0) + 1;
      }

      // Count DOI and URL
      if (ref.doi) stats.withDoi++;
      if (ref.url) stats.withUrl++;

      // Sum confidence
      totalConfidence += ref.metadata_confidence || 1.0;
    });

    stats.averageConfidence = data.length > 0 ? totalConfidence / data.length : 0;

    return stats;
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
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
      .from('citation_instances')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get citation instances: ${error.message}`);
    }

    return data?.map(item => this.mapDatabaseToCitationInstance(item)) || [];
  }

  /**
   * Delete citation instances for a reference
   */
  async deleteCitationInstancesForReference(referenceId: string): Promise<void> {
    const { error } = await this.supabase
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
  private mapDatabaseToReference(data: any): Reference {
    return {
      id: data.id,
      conversationId: data.conversation_id,
      type: data.type as ReferenceType,
      title: data.title,
      authors: typeof data.authors === 'string' ? JSON.parse(data.authors) : data.authors,
      publicationDate: data.publication_date ? new Date(data.publication_date) : undefined,
      url: data.url || undefined,
      doi: data.doi || undefined,
      journal: data.journal || undefined,
      volume: data.volume || undefined,
      issue: data.issue || undefined,
      pages: data.pages || undefined,
      publisher: data.publisher || undefined,
      isbn: data.isbn || undefined,
      edition: data.edition || undefined,
      chapter: data.chapter || undefined,
      editor: data.editor || undefined,
      accessDate: data.access_date ? new Date(data.access_date) : undefined,
      notes: data.notes || undefined,
      tags: data.tags || [],
      metadataConfidence: data.metadata_confidence || 1.0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  /**
   * Map database row to CitationInstance interface
   */
  private mapDatabaseToCitationInstance(data: any): CitationInstance {
    return {
      id: data.id,
      referenceId: data.reference_id,
      conversationId: data.conversation_id,
      citationStyle: data.citation_style as CitationStyle,
      citationText: data.citation_text,
      documentPosition: data.document_position || undefined,
      context: data.context || undefined,
      createdAt: new Date(data.created_at)
    };
  }
}