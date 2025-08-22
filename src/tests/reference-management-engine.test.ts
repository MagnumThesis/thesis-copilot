import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReferenceManagementEngine } from '../worker/lib/reference-management-engine';
import { ReferenceType, CitationStyle } from '../lib/ai-types';

// Mock the database operations
const mockDbOps = {
  createReference: vi.fn(),
  getReferenceById: vi.fn(),
  updateReference: vi.fn(),
  deleteReference: vi.fn(),
  getReferencesForConversation: vi.fn(),
  searchReferences: vi.fn(),
  createCitationInstance: vi.fn(),
  deleteCitationInstancesForReference: vi.fn()
};

// Mock the metadata extraction engine
const mockMetadataEngine = {
  extractMetadata: vi.fn()
};

// Mock the modules
vi.mock('../worker/lib/reference-database-operations', () => ({
  ReferenceDatabaseOperations: vi.fn(() => mockDbOps)
}));

vi.mock('../worker/lib/metadata-extraction-engine', () => ({
  MetadataExtractionEngine: vi.fn(() => mockMetadataEngine)
}));

vi.mock('../worker/lib/citation-style-engine', () => ({
  CitationStyleEngine: {
    formatInlineCitationAPA: vi.fn(() => '(Doe, 2023)'),
    formatBibliographyEntryAPA: vi.fn(() => 'Doe, J. (2023). Test Article.'),
    formatInlineCitationMLA: vi.fn(() => '(Doe)'),
    formatBibliographyEntryMLA: vi.fn(() => 'Doe, John. "Test Article."'),
    formatInlineCitationChicago: vi.fn(() => '(Doe 2023)'),
    formatBibliographyEntryChicago: vi.fn(() => 'Doe, John. "Test Article."'),
    formatInlineCitationHarvard: vi.fn(() => '(Doe 2023)'),
    formatBibliographyEntryHarvard: vi.fn(() => 'Doe, J. 2023, Test Article.')
  }
}));

describe('ReferenceManagementEngine', () => {
  let engine: ReferenceManagementEngine;

  beforeEach(() => {
    engine = new ReferenceManagementEngine();
    vi.clearAllMocks();
  });

  describe('createReference', () => {
    it('should create a reference without metadata extraction', async () => {
      const mockReference = {
        id: 'ref-1',
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        tags: [],
        metadataConfidence: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDbOps.createReference.mockResolvedValue(mockReference);

      const referenceData = {
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        tags: []
      };

      const result = await engine.createReference(referenceData, false);

      expect(mockDbOps.createReference).toHaveBeenCalledWith(referenceData);
      expect(mockMetadataEngine.extractMetadata).not.toHaveBeenCalled();
      expect(result).toEqual(mockReference);
    });

    it('should create a reference with metadata extraction', async () => {
      const mockReference = {
        id: 'ref-1',
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Enhanced Article Title',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        journal: 'Test Journal',
        tags: [],
        metadataConfidence: 0.9,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockMetadata = {
        title: 'Enhanced Article Title',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        journal: 'Test Journal',
        confidence: 0.9
      };

      mockMetadataEngine.extractMetadata.mockResolvedValue({
        success: true,
        metadata: mockMetadata,
        extractionTime: 1000,
        source: 'https://example.com'
      });

      mockDbOps.createReference.mockResolvedValue(mockReference);

      const referenceData = {
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        url: 'https://example.com',
        tags: []
      };

      const result = await engine.createReference(referenceData, true);

      expect(mockMetadataEngine.extractMetadata).toHaveBeenCalledWith({
        source: 'https://example.com',
        type: 'url',
        conversationId: 'conv-123'
      });

      expect(mockDbOps.createReference).toHaveBeenCalled();
      const callArgs = mockDbOps.createReference.mock.calls[0][0];
      expect(callArgs.title).toBe('Enhanced Article Title');
      expect(callArgs.journal).toBe('Test Journal');

      expect(result).toEqual(mockReference);
    });

    it('should handle metadata extraction failure gracefully', async () => {
      const mockReference = {
        id: 'ref-1',
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        tags: [],
        metadataConfidence: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockMetadataEngine.extractMetadata.mockRejectedValue(new Error('Extraction failed'));
      mockDbOps.createReference.mockResolvedValue(mockReference);

      const referenceData = {
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        url: 'https://example.com',
        tags: []
      };

      const result = await engine.createReference(referenceData, true);

      expect(mockMetadataEngine.extractMetadata).toHaveBeenCalled();
      expect(mockDbOps.createReference).toHaveBeenCalledWith(referenceData);
      expect(result).toEqual(mockReference);
    });

    it('should throw error for invalid reference data', async () => {
      const referenceData = {
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: '', // Invalid: empty title
        authors: [],
        tags: []
      };

      await expect(engine.createReference(referenceData)).rejects.toThrow('Validation failed');
      expect(mockDbOps.createReference).not.toHaveBeenCalled();
    });
  });

  describe('updateReference', () => {
    it('should update a reference successfully', async () => {
      const existingReference = {
        id: 'ref-1',
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Original Title',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        tags: [],
        metadataConfidence: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedReference = {
        ...existingReference,
        title: 'Updated Title'
      };

      mockDbOps.getReferenceById.mockResolvedValue(existingReference);
      mockDbOps.updateReference.mockResolvedValue(updatedReference);

      const updateData = {
        title: 'Updated Title'
      };

      const result = await engine.updateReference('ref-1', updateData);

      expect(mockDbOps.getReferenceById).toHaveBeenCalledWith('ref-1');
      expect(mockDbOps.updateReference).toHaveBeenCalledWith('ref-1', updateData);
      expect(result).toEqual(updatedReference);
    });

    it('should throw error when reference not found', async () => {
      mockDbOps.getReferenceById.mockResolvedValue(null);

      await expect(engine.updateReference('non-existent', { title: 'New Title' }))
        .rejects.toThrow('Reference with ID non-existent not found');

      expect(mockDbOps.updateReference).not.toHaveBeenCalled();
    });
  });

  describe('deleteReference', () => {
    it('should delete reference and citation instances', async () => {
      mockDbOps.deleteCitationInstancesForReference.mockResolvedValue(undefined);
      mockDbOps.deleteReference.mockResolvedValue(undefined);

      await engine.deleteReference('ref-1');

      expect(mockDbOps.deleteCitationInstancesForReference).toHaveBeenCalledWith('ref-1');
      expect(mockDbOps.deleteReference).toHaveBeenCalledWith('ref-1');
    });
  });

  describe('formatCitation', () => {
    it('should format inline citation successfully', async () => {
      const mockReference = {
        id: 'ref-1',
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        publicationDate: new Date('2023-01-01'),
        tags: [],
        metadataConfidence: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDbOps.getReferenceById.mockResolvedValue(mockReference);

      mockDbOps.createCitationInstance.mockResolvedValue({
        id: 'citation-1',
        referenceId: 'ref-1',
        conversationId: 'conv-123',
        citationStyle: CitationStyle.APA,
        citationText: '(Doe, 2023)',
        createdAt: new Date()
      });

      const request = {
        referenceId: 'ref-1',
        style: CitationStyle.APA,
        type: 'inline' as const,
        context: 'This is a test citation'
      };

      const result = await engine.formatCitation(request);

      expect(mockDbOps.getReferenceById).toHaveBeenCalledWith('ref-1');

      expect(mockDbOps.createCitationInstance).toHaveBeenCalledWith({
        referenceId: 'ref-1',
        conversationId: 'conv-123',
        citationStyle: CitationStyle.APA,
        citationText: '(Doe, 2023)',
        context: 'This is a test citation'
      });

      expect(result).toEqual({
        success: true,
        citation: '(Doe, 2023)',
        style: CitationStyle.APA,
        type: 'inline'
      });
    });

    it('should format bibliography entry successfully', async () => {
      const mockReference = {
        id: 'ref-1',
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        publicationDate: new Date('2023-01-01'),
        tags: [],
        metadataConfidence: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDbOps.getReferenceById.mockResolvedValue(mockReference);

      mockDbOps.createCitationInstance.mockResolvedValue({
        id: 'citation-1',
        referenceId: 'ref-1',
        conversationId: 'conv-123',
        citationStyle: CitationStyle.APA,
        citationText: 'Doe, J. (2023). Test Article.',
        createdAt: new Date()
      });

      const request = {
        referenceId: 'ref-1',
        style: CitationStyle.APA,
        type: 'bibliography' as const
      };

      const result = await engine.formatCitation(request);

      expect(mockDbOps.getReferenceById).toHaveBeenCalledWith('ref-1');


      expect(result).toEqual({
        success: true,
        citation: 'Doe, J. (2023). Test Article.',
        style: CitationStyle.APA,
        type: 'bibliography'
      });
    });

    it('should handle reference not found', async () => {
      mockDbOps.getReferenceById.mockResolvedValue(null);

      const request = {
        referenceId: 'non-existent',
        style: CitationStyle.APA,
        type: 'inline' as const
      };

      const result = await engine.formatCitation(request);

      expect(result).toEqual({
        success: false,
        error: 'Reference with ID non-existent not found',
        style: CitationStyle.APA,
        type: 'inline'
      });
    });
  });

  describe('generateBibliography', () => {
    it('should handle empty reference list', async () => {
      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: true,
        references: [],
        total: 0
      });

      const request = {
        conversationId: 'conv-123',
        style: CitationStyle.APA,
        sortOrder: 'alphabetical' as const,
        includeUrls: false
      };

      const result = await engine.generateBibliography(request);

      expect(result).toEqual({
        success: true,
        bibliography: '',
        referenceCount: 0,
        style: CitationStyle.APA
      });
    });

    it('should handle database error', async () => {
      mockDbOps.getReferencesForConversation.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      const request = {
        conversationId: 'conv-123',
        style: CitationStyle.APA,
        sortOrder: 'alphabetical' as const,
        includeUrls: false
      };

      const result = await engine.generateBibliography(request);

      expect(result).toEqual({
        success: false,
        error: 'Database error',
        referenceCount: 0,
        style: CitationStyle.APA
      });
    });
  });

  describe('validateReferenceData', () => {
    it('should validate valid reference data', () => {
      const validData = {
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        journal: 'Test Journal',
        tags: []
      };

      const result = engine.validateReferenceData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidData = {
        type: ReferenceType.JOURNAL_ARTICLE,
        title: '', // Empty title
        authors: [], // No authors
        tags: []
      };

      const result = engine.validateReferenceData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.warnings).toHaveLength(2); // No authors, no journal
      expect(result.missingFields).toContain('title');
      expect(result.missingFields).toContain('authors');
    });

    it('should validate URL format', () => {
      const invalidData = {
        type: ReferenceType.WEBSITE,
        title: 'Test Website',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        url: 'invalid-url',
        tags: []
      };

      const result = engine.validateReferenceData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'url')).toBe(true);
    });

    it('should validate DOI format', () => {
      const invalidData = {
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        doi: 'invalid-doi',
        tags: []
      };

      const result = engine.validateReferenceData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'doi')).toBe(true);
    });
  });
});