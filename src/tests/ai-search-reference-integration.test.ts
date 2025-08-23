import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AISearchReferenceManager, AddReferenceFromSearchOptions } from '../worker/lib/ai-search-reference-manager';
import { ReferenceDatabaseOperations } from '../worker/lib/reference-database-operations';
import { DuplicateDetectionEngine } from '../worker/lib/duplicate-detection-engine';
import { ReferenceType, ScholarSearchResult, ReferenceMetadata, Reference } from '../lib/ai-types';

// Mock the database operations
vi.mock('../worker/lib/reference-database-operations');
vi.mock('../worker/lib/duplicate-detection-engine');

const mockDbOps = {
  createReference: vi.fn(),
  updateReference: vi.fn(),
  getReferencesForConversation: vi.fn(),
  getReferenceById: vi.fn(),
  deleteReference: vi.fn(),
  searchReferences: vi.fn(),
  getConversationStatistics: vi.fn(),
  createCitationInstance: vi.fn(),
  getCitationInstancesForConversation: vi.fn(),
  deleteCitationInstancesForReference: vi.fn()
};

const mockDuplicateEngine = {
  detectDuplicates: vi.fn(),
  removeDuplicates: vi.fn()
};

// Mock the constructors
vi.mocked(ReferenceDatabaseOperations).mockImplementation(() => mockDbOps as any);
vi.mocked(DuplicateDetectionEngine).mockImplementation(() => mockDuplicateEngine as any);

describe('AISearchReferenceManager', () => {
  let manager: AISearchReferenceManager;
  const conversationId = 'test-conversation-123';

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new AISearchReferenceManager();
  });

  const mockScholarResult: ScholarSearchResult = {
    title: 'Machine Learning in Academic Research',
    authors: ['Smith, J.', 'Johnson, A.'],
    year: 2023,
    journal: 'Journal of AI Research',
    doi: '10.1234/jair.2023.001',
    url: 'https://doi.org/10.1234/jair.2023.001',
    confidence: 0.92,
    relevance_score: 0.88,
    citation_count: 45,
    keywords: ['machine learning', 'research', 'AI'],
    publisher: 'AI Research Press'
  };

  const mockCreatedReference: Reference = {
    id: 'ref-123',
    conversationId,
    type: ReferenceType.JOURNAL_ARTICLE,
    title: mockScholarResult.title,
    authors: mockScholarResult.authors,
    publicationDate: new Date(2023, 0, 1),
    journal: mockScholarResult.journal,
    doi: mockScholarResult.doi,
    url: mockScholarResult.url,
    metadataConfidence: mockScholarResult.confidence,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('addReferenceFromSearchResult', () => {

    it('should successfully add a reference from search result', async () => {
      // Setup mocks
      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: true,
        references: []
      });
      mockDbOps.createReference.mockResolvedValue(mockCreatedReference);

      const result = await manager.addReferenceFromSearchResult(
        mockScholarResult,
        conversationId
      );

      expect(result.success).toBe(true);
      expect(result.reference).toEqual(mockCreatedReference);
      expect(result.isDuplicate).toBeUndefined();
      expect(mockDbOps.createReference).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId,
          type: ReferenceType.JOURNAL_ARTICLE,
          title: mockScholarResult.title,
          authors: mockScholarResult.authors,
          doi: mockScholarResult.doi,
          url: mockScholarResult.url
        })
      );
    });

    it('should reject reference below confidence threshold', async () => {
      const lowConfidenceResult = {
        ...mockScholarResult,
        confidence: 0.3
      };

      const result = await manager.addReferenceFromSearchResult(
        lowConfidenceResult,
        conversationId,
        { minConfidence: 0.5 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('confidence');
      expect(result.error).toContain('below minimum threshold');
      expect(mockDbOps.createReference).not.toHaveBeenCalled();
    });

    it('should detect and handle duplicates with prompt_user option', async () => {
      const existingReference: Reference = {
        ...mockCreatedReference,
        id: 'existing-ref-456'
      };

      // Mock existing references
      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: true,
        references: [existingReference]
      });

      // Mock duplicate detection - need to return groups that include existing references
      const existingScholarResult = {
        title: existingReference.title,
        authors: existingReference.authors,
        year: existingReference.publicationDate?.getFullYear(),
        journal: existingReference.journal,
        doi: existingReference.doi,
        url: existingReference.url,
        confidence: existingReference.metadataConfidence || 1.0,
        relevance_score: 0.8,
        citation_count: 0,
        keywords: []
      };

      mockDuplicateEngine.detectDuplicates.mockReturnValue([
        {
          primary: existingScholarResult,
          duplicates: [mockScholarResult],
          confidence: 0.95,
          mergeStrategy: 'title_author'
        }
      ]);

      const result = await manager.addReferenceFromSearchResult(
        mockScholarResult,
        conversationId,
        { duplicateHandling: 'prompt_user' }
      );

      expect(result.success).toBe(false);
      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateReference).toEqual(existingReference);
      expect(result.mergeOptions).toBeDefined();
      expect(result.error).toContain('user intervention required');
      expect(mockDbOps.createReference).not.toHaveBeenCalled();
    });

    it('should skip duplicate when duplicateHandling is skip', async () => {
      const existingReference: Reference = {
        ...mockCreatedReference,
        id: 'existing-ref-456'
      };

      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: true,
        references: [existingReference]
      });

      const existingScholarResult = {
        title: existingReference.title,
        authors: existingReference.authors,
        year: existingReference.publicationDate?.getFullYear(),
        journal: existingReference.journal,
        doi: existingReference.doi,
        url: existingReference.url,
        confidence: existingReference.metadataConfidence || 1.0,
        relevance_score: 0.8,
        citation_count: 0,
        keywords: []
      };

      mockDuplicateEngine.detectDuplicates.mockReturnValue([
        {
          primary: existingScholarResult,
          duplicates: [mockScholarResult],
          confidence: 0.95,
          mergeStrategy: 'title_author'
        }
      ]);

      const result = await manager.addReferenceFromSearchResult(
        mockScholarResult,
        conversationId,
        { duplicateHandling: 'skip' }
      );

      expect(result.success).toBe(false);
      expect(result.isDuplicate).toBe(true);
      expect(result.error).toContain('duplicate handling is set to skip');
      expect(mockDbOps.createReference).not.toHaveBeenCalled();
    });

    it('should merge duplicate when duplicateHandling is merge', async () => {
      const existingReference: Reference = {
        ...mockCreatedReference,
        id: 'existing-ref-456',
        doi: undefined // Missing DOI to test merging
      };

      const updatedReference: Reference = {
        ...existingReference,
        doi: mockScholarResult.doi
      };

      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: true,
        references: [existingReference]
      });

      const existingScholarResult = {
        title: existingReference.title,
        authors: existingReference.authors,
        year: existingReference.publicationDate?.getFullYear(),
        journal: existingReference.journal,
        doi: existingReference.doi,
        url: existingReference.url,
        confidence: existingReference.metadataConfidence || 1.0,
        relevance_score: 0.8,
        citation_count: 0,
        keywords: []
      };

      mockDuplicateEngine.detectDuplicates.mockReturnValue([
        {
          primary: existingScholarResult,
          duplicates: [mockScholarResult],
          confidence: 0.95,
          mergeStrategy: 'title_author'
        }
      ]);

      mockDbOps.updateReference.mockResolvedValue(updatedReference);

      const result = await manager.addReferenceFromSearchResult(
        mockScholarResult,
        conversationId,
        { duplicateHandling: 'merge' }
      );

      expect(result.success).toBe(true);
      expect(result.reference).toEqual(updatedReference);
      expect(result.isDuplicate).toBe(true);
      expect(mockDbOps.updateReference).toHaveBeenCalledWith(
        existingReference.id,
        expect.objectContaining({ doi: mockScholarResult.doi })
      );
    });

    it('should add anyway when duplicateHandling is add_anyway', async () => {
      const existingReference: Reference = {
        ...mockCreatedReference,
        id: 'existing-ref-456'
      };

      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: true,
        references: [existingReference]
      });

      mockDuplicateEngine.detectDuplicates.mockReturnValue([
        {
          primary: mockScholarResult,
          duplicates: [existingReference],
          confidence: 0.95,
          mergeStrategy: 'title_author'
        }
      ]);

      mockDbOps.createReference.mockResolvedValue(mockCreatedReference);

      const result = await manager.addReferenceFromSearchResult(
        mockScholarResult,
        conversationId,
        { duplicateHandling: 'add_anyway' }
      );

      expect(result.success).toBe(true);
      expect(result.reference).toEqual(mockCreatedReference);
      expect(mockDbOps.createReference).toHaveBeenCalled();
    });

    it('should handle ReferenceMetadata input format', async () => {
      const metadataResult: ReferenceMetadata = {
        title: 'AI Research Methods',
        authors: ['Brown, C.', 'Davis, E.'],
        journal: 'Research Methods Journal',
        publication_date: '2023-06-15',
        doi: '10.5678/rmj.2023.002',
        confidence: 0.89,
        keywords: ['AI', 'research', 'methods']
      };

      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: true,
        references: []
      });
      mockDbOps.createReference.mockResolvedValue(mockCreatedReference);

      const result = await manager.addReferenceFromSearchResult(
        metadataResult,
        conversationId
      );

      expect(result.success).toBe(true);
      expect(mockDbOps.createReference).toHaveBeenCalledWith(
        expect.objectContaining({
          title: metadataResult.title,
          authors: metadataResult.authors,
          journal: metadataResult.journal,
          doi: metadataResult.doi
        })
      );
    });
  });

  describe('addMultipleReferencesFromSearchResults', () => {
    const mockResults: ScholarSearchResult[] = [
      {
        title: 'First Research Paper',
        authors: ['Author A'],
        year: 2023,
        confidence: 0.9,
        relevance_score: 0.8,
        citation_count: 10,
        keywords: []
      },
      {
        title: 'Second Research Paper',
        authors: ['Author B'],
        year: 2022,
        confidence: 0.85,
        relevance_score: 0.75,
        citation_count: 15,
        keywords: []
      },
      {
        title: 'Duplicate of First Paper', // This should be detected as duplicate
        authors: ['Author A'],
        year: 2023,
        confidence: 0.88,
        relevance_score: 0.82,
        citation_count: 12,
        keywords: []
      }
    ];

    it('should add multiple references with duplicate detection', async () => {
      // Mock duplicate detection to identify the third result as duplicate of first
      mockDuplicateEngine.detectDuplicates.mockReturnValue([
        {
          primary: mockResults[0],
          duplicates: [mockResults[2]],
          confidence: 0.92,
          mergeStrategy: 'title_author'
        }
      ]);

      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: true,
        references: []
      });

      mockDbOps.createReference
        .mockResolvedValueOnce({ ...mockCreatedReference, id: 'ref-1', title: mockResults[0].title })
        .mockResolvedValueOnce({ ...mockCreatedReference, id: 'ref-2', title: mockResults[1].title });

      const results = await manager.addMultipleReferencesFromSearchResults(
        mockResults,
        conversationId
      );

      expect(results).toHaveLength(2); // Only 2 results, third was duplicate
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockDbOps.createReference).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed success and failure results', async () => {
      const lowConfidenceResults = mockResults.map(r => ({ ...r, confidence: 0.3 }));

      mockDuplicateEngine.detectDuplicates.mockReturnValue([]);
      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: true,
        references: []
      });

      const results = await manager.addMultipleReferencesFromSearchResults(
        lowConfidenceResults,
        conversationId,
        { minConfidence: 0.5 }
      );

      expect(results).toHaveLength(3);
      expect(results.every(r => !r.success)).toBe(true);
      expect(results.every(r => r.error?.includes('confidence'))).toBe(true);
      expect(mockDbOps.createReference).not.toHaveBeenCalled();
    });
  });

  describe('reference type determination', () => {
    it('should determine journal article type from journal field', async () => {
      const result: ScholarSearchResult = {
        title: 'Test Article',
        authors: ['Test Author'],
        journal: 'Test Journal',
        year: 2023,
        confidence: 0.9,
        relevance_score: 0.8,
        citation_count: 5,
        keywords: []
      };

      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: true,
        references: []
      });
      mockDbOps.createReference.mockResolvedValue(mockCreatedReference);

      await manager.addReferenceFromSearchResult(result, conversationId);

      expect(mockDbOps.createReference).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ReferenceType.JOURNAL_ARTICLE
        })
      );
    });

    it('should determine book type from publisher without journal', async () => {
      const result: ScholarSearchResult = {
        title: 'Test Book',
        authors: ['Test Author'],
        publisher: 'Test Publisher',
        year: 2023,
        confidence: 0.9,
        relevance_score: 0.8,
        citation_count: 5,
        keywords: []
      };

      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: true,
        references: []
      });
      mockDbOps.createReference.mockResolvedValue({
        ...mockCreatedReference,
        type: ReferenceType.BOOK
      });

      await manager.addReferenceFromSearchResult(result, conversationId);

      expect(mockDbOps.createReference).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ReferenceType.BOOK
        })
      );
    });

    it('should determine website type from URL without journal or publisher', async () => {
      const result: ScholarSearchResult = {
        title: 'Test Website',
        authors: ['Test Author'],
        url: 'https://example.com/article',
        year: 2023,
        confidence: 0.9,
        relevance_score: 0.8,
        citation_count: 5,
        keywords: []
      };

      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: true,
        references: []
      });
      mockDbOps.createReference.mockResolvedValue({
        ...mockCreatedReference,
        type: ReferenceType.WEBSITE
      });

      await manager.addReferenceFromSearchResult(result, conversationId);

      expect(mockDbOps.createReference).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ReferenceType.WEBSITE
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockDbOps.createReference.mockRejectedValue(dbError);
      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: true,
        references: []
      });
      mockDuplicateEngine.detectDuplicates.mockReturnValue([]);

      const result = await manager.addReferenceFromSearchResult(
        {
          title: 'Test',
          authors: ['Author'],
          confidence: 0.9,
          relevance_score: 0.8,
          citation_count: 5,
          keywords: []
        },
        conversationId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(dbError.message);
    });

    it('should handle invalid input gracefully', async () => {
      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: true,
        references: []
      });
      mockDuplicateEngine.detectDuplicates.mockReturnValue([]);
      mockDbOps.createReference.mockRejectedValue(new Error('Invalid data'));

      const result = await manager.addReferenceFromSearchResult(
        {} as ScholarSearchResult,
        conversationId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});