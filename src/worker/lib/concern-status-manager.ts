/**
 * Concern Status Manager
 * Manages proofreading concern status updates, persistence, and lifecycle
 */

import { 
  ProofreadingConcern,
  ConcernStatus,
  ConcernStatusUpdate,
  ConcernStatistics,
  ConcernStatusBreakdown,
  ConcernCategory,
  ConcernSeverity
} from '../../lib/ai-types';
import { getSupabase, type SupabaseEnv } from './supabase';

export interface ConcernStatusManager {
  updateConcernStatus(concernId: string, status: ConcernStatus, notes?: string): Promise<void>;
  getConcernsByStatus(conversationId: string, status?: ConcernStatus): Promise<ProofreadingConcern[]>;
  getConcernStatistics(conversationId: string): Promise<ConcernStatistics>;
  getConcernById(concernId: string): Promise<ProofreadingConcern | null>;
  deleteConcern(concernId: string): Promise<void>;
  bulkUpdateConcernStatus(updates: ConcernStatusUpdate[]): Promise<void>;
  saveConcerns(concerns: ProofreadingConcern[]): Promise<void>;
}

export class ConcernStatusManagerImpl implements ConcernStatusManager {
  constructor(private env?: SupabaseEnv) {}

  /**
   * Update the status of a specific concern
   */
  async updateConcernStatus(concernId: string, status: ConcernStatus, notes?: string): Promise<void> {
    if (!concernId) {
      throw new Error('Concern ID is required');
    }

    if (!this.isValidStatus(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    try {
      const supabase = getSupabase(this.env);
      
      const { error } = await supabase
        .from('proofreading_concerns')
        .update({ 
          status: (status as any),
          updated_at: new Date().toISOString()
        })
        .eq('id', concernId);

      if (error) {
        throw new Error(`Failed to update concern status: ${error.message}`);
      }

      // Log status change for audit purposes
      console.log(`Concern ${concernId} status updated to ${status}${notes ? ` with notes: ${notes}` : ''}`);
      
    } catch (error) {
      console.error('Error updating concern status:', error);
      throw error instanceof Error ? error : new Error('Unknown error updating concern status');
    }
  }

  /**
   * Retrieve concerns filtered by status
   */
  async getConcernsByStatus(conversationId: string, status?: ConcernStatus): Promise<ProofreadingConcern[]> {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    try {
      const supabase = getSupabase(this.env);
      
      let query = supabase
        .from('proofreading_concerns')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (status) {
        if (!this.isValidStatus(status)) {
          throw new Error(`Invalid status filter: ${status}`);
        }
        query = query.eq('status', (status as any));
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to retrieve concerns: ${error.message}`);
      }

      return (data || []).map(this.mapDatabaseToConcern);
      
    } catch (error) {
      console.error('Error retrieving concerns by status:', error);
      throw error instanceof Error ? error : new Error('Unknown error retrieving concerns');
    }
  }

  /**
   * Get comprehensive statistics for concerns in a conversation
   */
  async getConcernStatistics(conversationId: string): Promise<ConcernStatistics> {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    try {
      const concerns = await this.getConcernsByStatus(conversationId);
      
      // Calculate overall statistics
      const total = concerns.length;
      const toBeDone = concerns.filter(c => c.status === ConcernStatus.TO_BE_DONE).length;
      const addressed = concerns.filter(c => c.status === ConcernStatus.ADDRESSED).length;
      const rejected = concerns.filter(c => c.status === ConcernStatus.REJECTED).length;

      // Calculate statistics by category
      const byCategory: Record<ConcernCategory, ConcernStatusBreakdown> = {} as Record<ConcernCategory, ConcernStatusBreakdown>;
      
      Object.values(ConcernCategory).forEach(category => {
        const categoryData = concerns.filter(c => c.category === category);
        const total = categoryData.length;
        const toBeDone = categoryData.filter(c => c.status === ConcernStatus.TO_BE_DONE).length;
        const addressed = categoryData.filter(c => c.status === ConcernStatus.ADDRESSED).length;
        const rejected = categoryData.filter(c => c.status === ConcernStatus.REJECTED).length;
        byCategory[category] = {
          status: category as unknown as ConcernStatus, // This is a workaround - category is a ConcernCategory, not ConcernStatus
          count: total,
          percentage: total > 0 ? (addressed / total) * 100 : 0,
          total,
          toBeDone,
          addressed,
          rejected
        };
      });

      // Calculate statistics by severity
      const bySeverity: Record<ConcernSeverity, ConcernStatusBreakdown> = {} as Record<ConcernSeverity, ConcernStatusBreakdown>;
      
      Object.values(ConcernSeverity).forEach(severity => {
        const severityData = concerns.filter(c => c.severity === severity);
        const total = severityData.length;
        const toBeDone = severityData.filter(c => c.status === ConcernStatus.TO_BE_DONE).length;
        const addressed = severityData.filter(c => c.status === ConcernStatus.ADDRESSED).length;
        const rejected = severityData.filter(c => c.status === ConcernStatus.REJECTED).length;
        bySeverity[severity] = {
          status: severity as unknown as ConcernStatus, // This is a workaround - severity is a ConcernSeverity, not ConcernStatus
          count: total,
          percentage: total > 0 ? (addressed / total) * 100 : 0,
          total,
          toBeDone,
          addressed,
          rejected
        };
      });

      // Calculate concerns by status
      const concernsByStatus: Record<ConcernStatus, number> = {
        [ConcernStatus.OPEN]: concerns.filter(c => c.status === ConcernStatus.OPEN).length,
        [ConcernStatus.RESOLVED]: concerns.filter(c => c.status === ConcernStatus.RESOLVED).length,
        [ConcernStatus.DISMISSED]: concerns.filter(c => c.status === ConcernStatus.DISMISSED).length,
        [ConcernStatus.ADDRESSED]: addressed,
        [ConcernStatus.REJECTED]: rejected,
        [ConcernStatus.TO_BE_DONE]: toBeDone
      };

      // Calculate concerns by category
      const concernsByCategory: Record<ConcernCategory, number> = {} as Record<ConcernCategory, number>;
      Object.values(ConcernCategory).forEach(category => {
        concernsByCategory[category] = concerns.filter(c => c.category === category).length;
      });

      // Calculate concerns by severity
      const concernsBySeverity: Record<ConcernSeverity, number> = {} as Record<ConcernSeverity, number>;
      Object.values(ConcernSeverity).forEach(severity => {
        concernsBySeverity[severity] = concerns.filter(c => c.severity === severity).length;
      });

      // Calculate resolution rate (simple calculation)
      const totalConcerns = total;
      const resolvedConcerns = addressed + rejected;
      const resolutionRate = totalConcerns > 0 ? (resolvedConcerns / totalConcerns) * 100 : 0;
      
      // Calculate average resolution time (simplified - using a fixed value for now)
      const averageResolutionTime = 0; // Would need actual timestamps to calculate this properly

      return {
        totalConcerns,
        concernsByStatus,
        concernsByCategory,
        concernsBySeverity,
        resolutionRate,
        averageResolutionTime,
        total,
        toBeDone,
        addressed,
        rejected,
        byCategory,
        bySeverity
      };
      
    } catch (error) {
      console.error('Error calculating concern statistics:', error);
      throw error instanceof Error ? error : new Error('Unknown error calculating statistics');
    }
  }

  /**
   * Get a specific concern by ID
   */
  async getConcernById(concernId: string): Promise<ProofreadingConcern | null> {
    if (!concernId) {
      throw new Error('Concern ID is required');
    }

    try {
      const supabase = getSupabase(this.env);
      
      const { data, error } = await supabase
        .from('proofreading_concerns')
        .select('*')
        .eq('id', concernId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw new Error(`Failed to retrieve concern: ${error.message}`);
      }

      return data ? this.mapDatabaseToConcern(data) : null;
      
    } catch (error) {
      console.error('Error retrieving concern by ID:', error);
      throw error instanceof Error ? error : new Error('Unknown error retrieving concern');
    }
  }

  /**
   * Delete a concern (part of lifecycle management)
   */
  async deleteConcern(concernId: string): Promise<void> {
    if (!concernId) {
      throw new Error('Concern ID is required');
    }

    try {
      const supabase = getSupabase(this.env);
      
      const { error } = await supabase
        .from('proofreading_concerns')
        .delete()
        .eq('id', concernId);

      if (error) {
        throw new Error(`Failed to delete concern: ${error.message}`);
      }

      console.log(`Concern ${concernId} deleted successfully`);
      
    } catch (error) {
      console.error('Error deleting concern:', error);
      throw error instanceof Error ? error : new Error('Unknown error deleting concern');
    }
  }

  /**
   * Bulk update multiple concern statuses
   */
  async bulkUpdateConcernStatus(updates: ConcernStatusUpdate[]): Promise<void> {
    if (!updates || updates.length === 0) {
      throw new Error('Updates array is required and cannot be empty');
    }

    // Validate all updates before processing
    for (const update of updates) {
      if (!update.concernId) {
        throw new Error('All updates must have a concern ID');
      }
      if (!this.isValidStatus(update.status)) {
        throw new Error(`Invalid status in update: ${update.status}`);
      }
    }

    try {
      const supabase = getSupabase(this.env);
      
      // Process updates in batches to avoid overwhelming the database
      const batchSize = 10;
      const batches = this.chunkArray(updates, batchSize);
      
      for (const batch of batches) {
        const promises = batch.map(update => 
          supabase
            .from('proofreading_concerns')
            .update({ 
              status: (update.status as any),
              updated_at: new Date().toISOString()
            })
            .eq('id', update.concernId)
        );

        const results = await Promise.all(promises);
        
        // Check for errors in batch
        const errors = results.filter(result => result.error);
        if (errors.length > 0) {
          throw new Error(`Batch update failed: ${errors.map(e => e.error?.message).join(', ')}`);
        }
      }

      console.log(`Successfully updated ${updates.length} concern statuses`);
      
    } catch (error) {
      console.error('Error in bulk status update:', error);
      throw error instanceof Error ? error : new Error('Unknown error in bulk update');
    }
  }

  /**
   * Get concerns that need attention (lifecycle management)
   */
  async getConcernsNeedingAttention(conversationId: string): Promise<ProofreadingConcern[]> {
    try {
      // Get high and critical severity concerns that are still to be done
      const concerns = await this.getConcernsByStatus(conversationId, ConcernStatus.TO_BE_DONE);
      
      return concerns.filter(concern => 
        concern.severity === ConcernSeverity.HIGH || 
        concern.severity === ConcernSeverity.CRITICAL
      );
      
    } catch (error) {
      console.error('Error retrieving concerns needing attention:', error);
      throw error instanceof Error ? error : new Error('Unknown error retrieving priority concerns');
    }
  }

  /**
   * Save new concerns to the database
   */
  async saveConcerns(concerns: ProofreadingConcern[]): Promise<void> {
    if (!concerns || concerns.length === 0) {
      return;
    }

    try {
      const supabase = getSupabase(this.env);
      
      // Convert concerns to database format
      const dbConcerns = concerns.map(concern => ({
        id: concern.id,
        conversation_id: concern.conversationId,
        category: concern.category,
        severity: concern.severity,
        title: concern.title,
        description: concern.description,
        location: concern.location ? JSON.stringify(concern.location) : null,
        suggestions: concern.suggestions || [],
        related_ideas: concern.relatedIdeas || [],
        status: concern.status,
        created_at: concern.createdAt || new Date().toISOString(),
        updated_at: concern.updatedAt || new Date().toISOString()
      }));

      const { error } = await supabase
        .from('proofreading_concerns')
        .insert((dbConcerns as any));

      if (error) {
        throw new Error(`Failed to save concerns: ${error.message}`);
      }

      console.log(`Successfully saved ${concerns.length} concerns`);
      
    } catch (error) {
      console.error('Error saving concerns:', error);
      throw error instanceof Error ? error : new Error('Unknown error saving concerns');
    }
  }

  /**
   * Archive old concerns (lifecycle management)
   */
  async archiveOldConcerns(conversationId: string, daysOld: number = 30): Promise<number> {
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    if (daysOld < 1) {
      throw new Error('Days old must be at least 1');
    }

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const supabase = getSupabase(this.env);
      
      // First, get the concerns that will be archived
      const { data: concernsToArchive, error: selectError } = await supabase
        .from('proofreading_concerns')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('status', ConcernStatus.ADDRESSED)
        .lt('updated_at', cutoffDate.toISOString());

      if (selectError) {
        throw new Error(`Failed to identify concerns for archiving: ${selectError.message}`);
      }

      if (!concernsToArchive || concernsToArchive.length === 0) {
        return 0;
      }

      // Delete the old addressed concerns
      const { error: deleteError } = await supabase
        .from('proofreading_concerns')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('status', ConcernStatus.ADDRESSED)
        .lt('updated_at', cutoffDate.toISOString());

      if (deleteError) {
        throw new Error(`Failed to archive concerns: ${deleteError.message}`);
      }

      const archivedCount = concernsToArchive.length;
      console.log(`Archived ${archivedCount} old concerns for conversation ${conversationId}`);
      
      return archivedCount;
      
    } catch (error) {
      console.error('Error archiving old concerns:', error);
      throw error instanceof Error ? error : new Error('Unknown error archiving concerns');
    }
  }

  /**
   * Validate concern status
   */
  private isValidStatus(status: string): status is ConcernStatus {
    return Object.values(ConcernStatus).includes(status as ConcernStatus);
  }

  /**
   * Map database row to ProofreadingConcern object
   */
  private mapDatabaseToConcern(data: any): ProofreadingConcern {
    const location = data.location ? JSON.parse(data.location) : {};
    return {
      id: data.id,
      text: data.text || '',
      conversationId: data.conversation_id,
      category: data.category as ConcernCategory,
      severity: data.severity as ConcernSeverity,
      status: data.status as ConcernStatus,
      suggestions: data.suggestions || [],
      relatedIdeas: data.related_ideas || [],
      position: {
        start: location.start || 0,
        end: location.end || 0
      },
      explanation: data.explanation || '',
      created_at: data.created_at,
      updated_at: data.updated_at,
      createdAt: new Date(data.created_at).toISOString(),
      updatedAt: new Date(data.updated_at).toISOString(),
      title: data.title,
      description: data.description,
      location: location
    };
  }

  /**
   * Utility function to chunk array into smaller batches
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * Factory function to create a ConcernStatusManager instance
 */
export function createConcernStatusManager(env?: SupabaseEnv): ConcernStatusManager {
  return new ConcernStatusManagerImpl(env);
}