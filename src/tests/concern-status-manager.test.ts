/**
 * Unit tests for Concern Status Manager
 * Tests status management operations, persistence, and lifecycle management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConcernStatusManagerImpl,
  createConcernStatusManager,
  type ConcernStatusManager
} from '../worker/lib/concern-status-manager';
import {
  ConcernStatus,
  ConcernCategory,
  ConcernSeverity,
  type ProofreadingConcern,
  type ConcernStatusUpdate
} from '../lib/ai-types';

// Mock Supabase with a simple approach
const mockSupabaseResult = { data: null, error: null };
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue(mockSupabaseResult)
};

// Make the chain methods return promises
mockSupabase.from.mockImplementation(() => ({
  ...mockSupabase,
  select: vi.fn().mockImplementation(() => ({
    ...mockSupabase,
    eq: vi.fn().mockImplementation(() => ({
      ...mockSupabase,
      order: vi.fn().mockResolvedValue(mockSupabaseResult),
      single: vi.fn().mockResolvedValue(mockSupabaseResult)
    }))
  })),
  update: vi.fn().mockImplementation(() => ({
    ...mockSupabase,
    eq: vi.fn().mockResolvedValue(mockSupabaseResult)
  })),
  delete: vi.fn().mockImplementation(() => ({
    ...mockSupabase,
    eq: vi.fn().mockResolvedValue(mockSupabaseResult)
  })),
  insert: vi.fn().mockResolvedValue(mockSupabaseResult)
}));

// Mock the supabase module
vi.mock('../worker/lib/supabase', () => ({
  getSupabase: vi.fn(() => mockSupabase)
}));

describe('ConcernStatusManager', () => {
  let statusManager: ConcernStatusManager;
  let mockConcerns: ProofreadingConcern[];

  beforeEach(() => {
    vi.clearAllMocks();
    statusManager = new ConcernStatusManagerImpl();
    
    // Setup mock concerns data
    mockConcerns = [
      {
        id: 'concern-1',
        conversationId: 'conv-123',
        category: ConcernCategory.CLARITY,
        severity: ConcernSeverity.HIGH,
        title: 'Unclear sentence structure',
        description: 'The sentence structure needs improvement',
        status: ConcernStatus.TO_BE_DONE,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'concern-2',
        conversationId: 'conv-123',
        category: ConcernCategory.GRAMMAR,
        severity: ConcernSeverity.MEDIUM,
        title: 'Grammar issue',
        description: 'Minor grammatical error',
        status: ConcernStatus.ADDRESSED,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-03')
      }
    ];

    // Reset mock result
    mockSupabaseResult.data = null;
    mockSupabaseResult.error = null;
  });

  describe('Input Validation', () => {
    it('should throw error for missing concern ID in updateConcernStatus', async () => {
      await expect(
        statusManager.updateConcernStatus('', ConcernStatus.ADDRESSED)
      ).rejects.toThrow('Concern ID is required');
    });

    it('should throw error for invalid status in updateConcernStatus', async () => {
      await expect(
        statusManager.updateConcernStatus('concern-1', 'invalid_status' as ConcernStatus)
      ).rejects.toThrow('Invalid status: invalid_status');
    });

    it('should throw error for missing conversation ID in getConcernsByStatus', async () => {
      await expect(
        statusManager.getConcernsByStatus('')
      ).rejects.toThrow('Conversation ID is required');
    });

    it('should throw error for missing concern ID in getConcernById', async () => {
      await expect(
        statusManager.getConcernById('')
      ).rejects.toThrow('Concern ID is required');
    });

    it('should throw error for missing concern ID in deleteConcern', async () => {
      await expect(
        statusManager.deleteConcern('')
      ).rejects.toThrow('Concern ID is required');
    });

    it('should throw error for empty updates array in bulkUpdateConcernStatus', async () => {
      await expect(
        statusManager.bulkUpdateConcernStatus([])
      ).rejects.toThrow('Updates array is required and cannot be empty');
    });

    it('should throw error for invalid update data in bulkUpdateConcernStatus', async () => {
      const invalidUpdates = [
        { concernId: '', status: ConcernStatus.ADDRESSED }
      ];

      await expect(
        statusManager.bulkUpdateConcernStatus(invalidUpdates)
      ).rejects.toThrow('All updates must have a concern ID');
    });

    it('should throw error for invalid status in bulkUpdateConcernStatus', async () => {
      const invalidUpdates = [
        { concernId: 'concern-1', status: 'invalid_status' as ConcernStatus }
      ];

      await expect(
        statusManager.bulkUpdateConcernStatus(invalidUpdates)
      ).rejects.toThrow('Invalid status in update: invalid_status');
    });

    it('should throw error for missing conversation ID in getConcernStatistics', async () => {
      await expect(
        statusManager.getConcernStatistics('')
      ).rejects.toThrow('Conversation ID is required');
    });

    it('should throw error for missing conversation ID in archiveOldConcerns', async () => {
      await expect(
        statusManager.archiveOldConcerns('', 30)
      ).rejects.toThrow('Conversation ID is required');
    });

    it('should throw error for invalid days parameter in archiveOldConcerns', async () => {
      await expect(
        statusManager.archiveOldConcerns('conv-123', 0)
      ).rejects.toThrow('Days old must be at least 1');
    });
  });

  describe('Status Validation', () => {
    it('should validate concern status correctly', () => {
      const manager = new ConcernStatusManagerImpl();
      
      // Access private method through type assertion for testing
      const isValidStatus = (manager as any).isValidStatus;
      
      expect(isValidStatus(ConcernStatus.TO_BE_DONE)).toBe(true);
      expect(isValidStatus(ConcernStatus.ADDRESSED)).toBe(true);
      expect(isValidStatus(ConcernStatus.REJECTED)).toBe(true);
      expect(isValidStatus('invalid_status')).toBe(false);
    });
  });

  describe('Data Mapping', () => {
    it('should map database data to concern object correctly', () => {
      const manager = new ConcernStatusManagerImpl();
      const mapDatabaseToConcern = (manager as any).mapDatabaseToConcern;
      
      const dbData = {
        id: 'concern-1',
        conversation_id: 'conv-123',
        category: ConcernCategory.CLARITY,
        severity: ConcernSeverity.HIGH,
        title: 'Test concern',
        description: 'Test description',
        location: JSON.stringify({ section: 'Introduction' }),
        suggestions: ['suggestion 1', 'suggestion 2'],
        related_ideas: ['idea-1'],
        status: ConcernStatus.TO_BE_DONE,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const concern = mapDatabaseToConcern(dbData);

      expect(concern.id).toBe('concern-1');
      expect(concern.conversationId).toBe('conv-123');
      expect(concern.category).toBe(ConcernCategory.CLARITY);
      expect(concern.severity).toBe(ConcernSeverity.HIGH);
      expect(concern.location).toEqual({ section: 'Introduction' });
      expect(concern.suggestions).toEqual(['suggestion 1', 'suggestion 2']);
      expect(concern.relatedIdeas).toEqual(['idea-1']);
      expect(concern.createdAt).toBeInstanceOf(Date);
      expect(concern.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle null location in database data', () => {
      const manager = new ConcernStatusManagerImpl();
      const mapDatabaseToConcern = (manager as any).mapDatabaseToConcern;
      
      const dbData = {
        id: 'concern-1',
        conversation_id: 'conv-123',
        category: ConcernCategory.CLARITY,
        severity: ConcernSeverity.HIGH,
        title: 'Test concern',
        description: 'Test description',
        location: null,
        suggestions: [],
        related_ideas: [],
        status: ConcernStatus.TO_BE_DONE,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      const concern = mapDatabaseToConcern(dbData);
      expect(concern.location).toBeUndefined();
    });
  });

  describe('Utility Functions', () => {
    it('should chunk array correctly', () => {
      const manager = new ConcernStatusManagerImpl();
      const chunkArray = (manager as any).chunkArray;
      
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      const chunks = chunkArray(array, 3);
      
      expect(chunks).toHaveLength(4);
      expect(chunks[0]).toEqual([1, 2, 3]);
      expect(chunks[1]).toEqual([4, 5, 6]);
      expect(chunks[2]).toEqual([7, 8, 9]);
      expect(chunks[3]).toEqual([10, 11]);
    });

    it('should handle empty array in chunk function', () => {
      const manager = new ConcernStatusManagerImpl();
      const chunkArray = (manager as any).chunkArray;
      
      const chunks = chunkArray([], 3);
      expect(chunks).toHaveLength(0);
    });

    it('should handle single element array in chunk function', () => {
      const manager = new ConcernStatusManagerImpl();
      const chunkArray = (manager as any).chunkArray;
      
      const chunks = chunkArray([1], 3);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual([1]);
    });
  });

  describe('Factory Function', () => {
    it('should create ConcernStatusManager instance', () => {
      const manager = createConcernStatusManager();
      expect(manager).toBeInstanceOf(ConcernStatusManagerImpl);
    });

    it('should create ConcernStatusManager with environment', () => {
      const env = { SUPABASE_URL: 'test-url', SUPABASE_ANON: 'test-key' };
      const manager = createConcernStatusManager(env);
      expect(manager).toBeInstanceOf(ConcernStatusManagerImpl);
    });
  });

  describe('Successful Operations', () => {
    beforeEach(() => {
      mockSupabaseResult.error = null;
    });

    it('should successfully update concern status', async () => {
      await expect(
        statusManager.updateConcernStatus('concern-1', ConcernStatus.ADDRESSED)
      ).resolves.not.toThrow();
    });

    it('should successfully delete concern', async () => {
      await expect(
        statusManager.deleteConcern('concern-1')
      ).resolves.not.toThrow();
    });

    it('should successfully bulk update concern statuses', async () => {
      const updates: ConcernStatusUpdate[] = [
        { concernId: 'concern-1', status: ConcernStatus.ADDRESSED },
        { concernId: 'concern-2', status: ConcernStatus.REJECTED }
      ];

      await expect(
        statusManager.bulkUpdateConcernStatus(updates)
      ).resolves.not.toThrow();
    });

    it('should successfully save concerns', async () => {
      await expect(
        statusManager.saveConcerns(mockConcerns)
      ).resolves.not.toThrow();
    });

    it('should handle empty concerns array in saveConcerns', async () => {
      await expect(
        statusManager.saveConcerns([])
      ).resolves.not.toThrow();
    });

    it('should return null for non-existent concern', async () => {
      mockSupabaseResult.error = { code: 'PGRST116' };
      
      const concern = await statusManager.getConcernById('non-existent');
      expect(concern).toBeNull();
    });

    it('should return 0 when no concerns to archive', async () => {
      mockSupabaseResult.data = [];
      
      const archivedCount = await statusManager.archiveOldConcerns('conv-123', 30);
      expect(archivedCount).toBe(0);
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate statistics correctly with mock data', async () => {
      // Mock the database response
      const mockDbData = mockConcerns.map(concern => ({
        id: concern.id,
        conversation_id: concern.conversationId,
        category: concern.category,
        severity: concern.severity,
        title: concern.title,
        description: concern.description,
        location: null,
        suggestions: concern.suggestions,
        related_ideas: concern.relatedIdeas,
        status: concern.status,
        created_at: concern.createdAt.toISOString(),
        updated_at: concern.updatedAt.toISOString()
      }));

      // Set up the mock to return our test data
      mockSupabaseResult.data = mockDbData;
      mockSupabaseResult.error = null;

      const stats = await statusManager.getConcernStatistics('conv-123');

      expect(stats.total).toBe(2);
      expect(stats.toBeDone).toBe(1);
      expect(stats.addressed).toBe(1);
      expect(stats.rejected).toBe(0);
    });

    it('should handle empty conversation in statistics', async () => {
      mockSupabaseResult.data = [];
      mockSupabaseResult.error = null;

      const stats = await statusManager.getConcernStatistics('conv-empty');

      expect(stats.total).toBe(0);
      expect(stats.toBeDone).toBe(0);
      expect(stats.addressed).toBe(0);
      expect(stats.rejected).toBe(0);
    });
  });
});

describe('ConcernStatusManager Type Safety', () => {
  it('should enforce correct enum values', () => {
    // Test that TypeScript enforces correct enum usage
    const validStatuses = Object.values(ConcernStatus);
    expect(validStatuses).toContain(ConcernStatus.TO_BE_DONE);
    expect(validStatuses).toContain(ConcernStatus.ADDRESSED);
    expect(validStatuses).toContain(ConcernStatus.REJECTED);
    expect(validStatuses).toHaveLength(3);
  });

  it('should enforce correct category values', () => {
    const validCategories = Object.values(ConcernCategory);
    expect(validCategories).toContain(ConcernCategory.CLARITY);
    expect(validCategories).toContain(ConcernCategory.GRAMMAR);
    expect(validCategories).toContain(ConcernCategory.STRUCTURE);
    expect(validCategories).toHaveLength(9);
  });

  it('should enforce correct severity values', () => {
    const validSeverities = Object.values(ConcernSeverity);
    expect(validSeverities).toContain(ConcernSeverity.LOW);
    expect(validSeverities).toContain(ConcernSeverity.MEDIUM);
    expect(validSeverities).toContain(ConcernSeverity.HIGH);
    expect(validSeverities).toContain(ConcernSeverity.CRITICAL);
    expect(validSeverities).toHaveLength(4);
  });
});