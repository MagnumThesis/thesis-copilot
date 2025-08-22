import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ReferenceDatabaseOperations } from '../worker/lib/reference-database-operations';
import { ReferenceType, CitationStyle } from '../lib/ai-types';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  insert: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  update: vi.fn(() => mockSupabase),
  delete: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn(),
  or: vi.fn(() => mockSupabase),
  ilike: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  lt: vi.fn(() => mockSupabase),
  overlaps: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  limit: vi.fn(() => mockSupabase),
  range: vi.fn(() => mockSupabase)
};

// Mock the supabase module
vi.mock('../worker/lib/supabase', () => ({
  getSupabase: () => mockSupabase
}));

describe('ReferenceDatabaseOperations', () => {
  let dbOps: ReferenceDatabaseOperations;

  beforeEach(() => {
    dbOps = new ReferenceDatabaseOperations();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createReference', () => {
    it('should create a reference successfully', async () => {
      const mockReference = {
        id: 'test-id',
        conversation_id: 'conv-123',
        type: 'journal_article',
        title: 'Test Article',
        authors: JSON.stringify([{ firstName: 'John', lastName: 'Doe' }]),
        publication_date: '2023-01-01',
        url: 'https://example.com',
        doi: '10.1000/test',
        journal: 'Test Journal',
        volume: '1',
        issue: '1',
        pages: '1-10',
        publisher: 'Test Publisher',
        isbn: null,
        edition: null,
        chapter: null,
        editor: null,
        access_date: null,
        notes: 'Test notes',
        tags: ['test', 'article'],
        metadata_confidence: 1.0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      mockSupabase.single.mockResolvedValue({
        data: mockReference,
        error: null
      });

      const referenceData = {
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        publicationDate: '2023-01-01',
        url: 'https://example.com',
        doi: '10.1000/test',
        journal: 'Test Journal',
        volume: '1',
        issue: '1',
        pages: '1-10',
        publisher: 'Test Publisher',
        notes: 'Test notes',
        tags: ['test', 'article']
      };

      const result = await dbOps.createReference(referenceData);

      expect(mockSupabase.from).toHaveBeenCalledWith('references');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result).toEqual({
        id: 'test-id',
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        publicationDate: new Date('2023-01-01'),
        url: 'https://example.com',
        doi: '10.1000/test',
        journal: 'Test Journal',
        volume: '1',
        issue: '1',
        pages: '1-10',
        publisher: 'Test Publisher',
        notes: 'Test notes',
        tags: ['test', 'article'],
        metadataConfidence: 1.0,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      });
    });

    it('should throw error when creation fails', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const referenceData = {
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        tags: []
      };

      await expect(dbOps.createReference(referenceData)).rejects.toThrow('Failed to create reference: Database error');
    });
  });

  describe('getReferenceById', () => {
    it('should get reference by ID successfully', async () => {
      const mockReference = {
        id: 'test-id',
        conversation_id: 'conv-123',
        type: 'journal_article',
        title: 'Test Article',
        authors: JSON.stringify([{ firstName: 'John', lastName: 'Doe' }]),
        publication_date: '2023-01-01',
        url: null,
        doi: null,
        journal: null,
        volume: null,
        issue: null,
        pages: null,
        publisher: null,
        isbn: null,
        edition: null,
        chapter: null,
        editor: null,
        access_date: null,
        notes: null,
        tags: [],
        metadata_confidence: 1.0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      mockSupabase.single.mockResolvedValue({
        data: mockReference,
        error: null
      });

      const result = await dbOps.getReferenceById('test-id');

      expect(mockSupabase.from).toHaveBeenCalledWith('references');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result).toEqual({
        id: 'test-id',
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        publicationDate: new Date('2023-01-01'),
        tags: [],
        metadataConfidence: 1.0,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      });
    });

    it('should return null when reference not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'No rows found' }
      });

      const result = await dbOps.getReferenceById('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection error' }
      });

      await expect(dbOps.getReferenceById('test-id')).rejects.toThrow('Failed to get reference: Database connection error');
    });
  });

  describe('updateReference', () => {
    it('should update reference successfully', async () => {
      const mockUpdatedReference = {
        id: 'test-id',
        conversation_id: 'conv-123',
        type: 'journal_article',
        title: 'Updated Article',
        authors: JSON.stringify([{ firstName: 'Jane', lastName: 'Smith' }]),
        publication_date: '2023-02-01',
        url: null,
        doi: null,
        journal: null,
        volume: null,
        issue: null,
        pages: null,
        publisher: null,
        isbn: null,
        edition: null,
        chapter: null,
        editor: null,
        access_date: null,
        notes: null,
        tags: ['updated'],
        metadata_confidence: 1.0,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-02-01T00:00:00Z'
      };

      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedReference,
        error: null
      });

      const updateData = {
        title: 'Updated Article',
        authors: [{ firstName: 'Jane', lastName: 'Smith' }],
        publicationDate: '2023-02-01',
        tags: ['updated']
      };

      const result = await dbOps.updateReference('test-id', updateData);

      expect(mockSupabase.from).toHaveBeenCalledWith('references');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result.title).toBe('Updated Article');
      expect(result.authors).toEqual([{ firstName: 'Jane', lastName: 'Smith' }]);
      expect(result.tags).toEqual(['updated']);
    });

    it('should throw error when update fails', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      });

      await expect(dbOps.updateReference('test-id', { title: 'New Title' })).rejects.toThrow('Failed to update reference: Update failed');
    });
  });

  describe('deleteReference', () => {
    it('should delete reference successfully', async () => {
      mockSupabase.eq.mockResolvedValue({
        error: null
      });

      await dbOps.deleteReference('test-id');

      expect(mockSupabase.from).toHaveBeenCalledWith('references');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'test-id');
    });

    it('should throw error when deletion fails', async () => {
      mockSupabase.eq.mockResolvedValue({
        error: { message: 'Deletion failed' }
      });

      await expect(dbOps.deleteReference('test-id')).rejects.toThrow('Failed to delete reference: Deletion failed');
    });
  });

  describe('getReferencesForConversation', () => {
    it('should handle database errors', async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await dbOps.getReferencesForConversation('conv-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to get references: Database error');
    });
  });

  describe('createCitationInstance', () => {
    it('should create citation instance successfully', async () => {
      const mockCitationInstance = {
        id: 'citation-1',
        reference_id: 'ref-1',
        conversation_id: 'conv-123',
        citation_style: 'apa',
        citation_text: '(Doe, 2023)',
        document_position: 100,
        context: 'This is a test citation',
        created_at: '2023-01-01T00:00:00Z'
      };

      mockSupabase.single.mockResolvedValue({
        data: mockCitationInstance,
        error: null
      });

      const citationData = {
        referenceId: 'ref-1',
        conversationId: 'conv-123',
        citationStyle: CitationStyle.APA,
        citationText: '(Doe, 2023)',
        documentPosition: 100,
        context: 'This is a test citation'
      };

      const result = await dbOps.createCitationInstance(citationData);

      expect(mockSupabase.from).toHaveBeenCalledWith('citation_instances');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result).toEqual({
        id: 'citation-1',
        referenceId: 'ref-1',
        conversationId: 'conv-123',
        citationStyle: CitationStyle.APA,
        citationText: '(Doe, 2023)',
        documentPosition: 100,
        context: 'This is a test citation',
        createdAt: new Date('2023-01-01T00:00:00Z')
      });
    });

    it('should throw error when creation fails', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Creation failed' }
      });

      const citationData = {
        referenceId: 'ref-1',
        conversationId: 'conv-123',
        citationStyle: CitationStyle.APA,
        citationText: '(Doe, 2023)'
      };

      await expect(dbOps.createCitationInstance(citationData)).rejects.toThrow('Failed to create citation instance: Creation failed');
    });
  });

  describe('getCitationInstancesForConversation', () => {
    it('should get citation instances successfully', async () => {
      const mockInstances = [
        {
          id: 'citation-1',
          reference_id: 'ref-1',
          conversation_id: 'conv-123',
          citation_style: 'apa',
          citation_text: '(Doe, 2023)',
          document_position: 100,
          context: 'Test context',
          created_at: '2023-01-01T00:00:00Z'
        }
      ];

      mockSupabase.order.mockResolvedValue({
        data: mockInstances,
        error: null
      });

      const result = await dbOps.getCitationInstancesForConversation('conv-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('citation_instances');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('conversation_id', 'conv-123');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });

      expect(result).toHaveLength(1);
      expect(result[0].citationText).toBe('(Doe, 2023)');
    });

    it('should throw error when query fails', async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Query failed' }
      });

      await expect(dbOps.getCitationInstancesForConversation('conv-123')).rejects.toThrow('Failed to get citation instances: Query failed');
    });
  });

  describe('deleteCitationInstancesForReference', () => {
    it('should delete citation instances successfully', async () => {
      mockSupabase.eq.mockResolvedValue({
        error: null
      });

      await dbOps.deleteCitationInstancesForReference('ref-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('citation_instances');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('reference_id', 'ref-1');
    });

    it('should throw error when deletion fails', async () => {
      mockSupabase.eq.mockResolvedValue({
        error: { message: 'Deletion failed' }
      });

      await expect(dbOps.deleteCitationInstancesForReference('ref-1')).rejects.toThrow('Failed to delete citation instances: Deletion failed');
    });
  });
});