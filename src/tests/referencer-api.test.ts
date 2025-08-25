import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ReferenceType, CitationStyle } from '../lib/ai-types';

// Mock the reference management engine module
vi.mock('../worker/lib/reference-management-engine', () => ({
  ReferenceManagementEngine: vi.fn().mockImplementation(() => ({
    createReference: vi.fn(),
    getReferenceById: vi.fn(),
    updateReference: vi.fn(),
    deleteReference: vi.fn(),
    getReferencesForConversation: vi.fn(),
    extractMetadata: vi.fn(),
    formatCitation: vi.fn(),
    generateBibliography: vi.fn()
  }))
}));

// Mock Hono context
const createMockContext = (params: any = {}, query: any = {}, body: any = {}) => ({
  req: {
    param: (key: string) => params[key],
    query: (key: string) => query[key],
    json: vi.fn().mockResolvedValue(body)
  },
  json: vi.fn((data: any, status?: number) => ({ data, status }))
});

describe('ReferencerAPIHandler', () => {
  let handler: any;
  let mockEngine: any;

  beforeEach(async () => {
    const { ReferencerAPIHandler } = await import('../worker/handlers/referencer-api');
    handler = new ReferencerAPIHandler();
    mockEngine = handler.engine;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createReference', () => {
    it('should create a reference successfully', async () => {
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

      mockEngine.createReference.mockResolvedValue(mockReference);

      const context = createMockContext({}, {}, {
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        extractMetadata: false
      });

      const result = await handler.createReference(context as any);

      expect(mockEngine.createReference).toHaveBeenCalledWith(
        {
          conversationId: 'conv-123',
          type: ReferenceType.JOURNAL_ARTICLE,
          title: 'Test Article',
          authors: [{ firstName: 'John', lastName: 'Doe' }]
        },
        false
      );

      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          reference: mockReference
        }),
        201
      );
    });

    it('should return 400 for missing required fields', async () => {
      const context = createMockContext({}, {}, {
        // Missing conversationId, type, and title
        authors: [{ firstName: 'John', lastName: 'Doe' }]
      });

      const result = await handler.createReference(context as any);

      expect(mockEngine.createReference).not.toHaveBeenCalled();
      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Missing required field: conversationId'
        }),
        400
      );
    });

    it('should return 400 for invalid reference type', async () => {
      const context = createMockContext({}, {}, {
        conversationId: 'conv-123',
        type: 'invalid_type',
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }]
      });

      const result = await handler.createReference(context as any);

      expect(mockEngine.createReference).not.toHaveBeenCalled();
      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid reference type: invalid_type'
        }),
        400
      );
    });

    it('should handle engine errors', async () => {
      mockEngine.createReference.mockRejectedValue(new Error('Database error'));

      const context = createMockContext({}, {}, {
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Test Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }]
      });

      const result = await handler.createReference(context as any);

      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Database connection failed'
        }),
        500
      );
    });
  });

  describe('getReferencesForConversation', () => {
    it('should get references successfully', async () => {
      const mockResponse = {
        success: true,
        references: [
          {
            id: 'ref-1',
            conversationId: 'conv-123',
            type: ReferenceType.JOURNAL_ARTICLE,
            title: 'Test Article',
            authors: [{ firstName: 'John', lastName: 'Doe' }],
            tags: [],
            metadataConfidence: 1.0,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        total: 1
      };

      mockEngine.getReferencesForConversation.mockResolvedValue(mockResponse);

      const context = createMockContext(
        { conversationId: 'conv-123' },
        { query: 'test', type: 'journal_article', limit: '10' }
      );

      const result = await handler.getReferencesForConversation(context as any);

      expect(mockEngine.getReferencesForConversation).toHaveBeenCalledWith(
        'conv-123',
        expect.objectContaining({
          query: 'test',
          type: ReferenceType.JOURNAL_ARTICLE,
          limit: 10
        })
      );

      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          references: mockResponse.references,
          total: 1
        })
      );
    });

    it('should return 400 for missing conversation ID', async () => {
      const context = createMockContext({}, {});

      const result = await handler.getReferencesForConversation(context as any);

      expect(mockEngine.getReferencesForConversation).not.toHaveBeenCalled();
      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Conversation ID is required'
        }),
        400
      );
    });
  });

  describe('updateReference', () => {
    it('should update reference successfully', async () => {
      const mockReference = {
        id: 'ref-1',
        conversationId: 'conv-123',
        type: ReferenceType.JOURNAL_ARTICLE,
        title: 'Updated Article',
        authors: [{ firstName: 'John', lastName: 'Doe' }],
        tags: [],
        metadataConfidence: 1.0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockEngine.updateReference.mockResolvedValue(mockReference);

      const context = createMockContext(
        { referenceId: 'ref-1' },
        {},
        { title: 'Updated Article', extractMetadata: false }
      );

      const result = await handler.updateReference(context as any);

      expect(mockEngine.updateReference).toHaveBeenCalledWith(
        'ref-1',
        { title: 'Updated Article' },
        false
      );

      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          reference: mockReference
        })
      );
    });

    it('should return 404 for reference not found', async () => {
      mockEngine.updateReference.mockRejectedValue(new Error('Reference with ID ref-1 not found'));

      const context = createMockContext(
        { referenceId: 'ref-1' },
        {},
        { title: 'Updated Article' }
      );

      const result = await handler.updateReference(context as any);

      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Reference not found'
        }),
        404
      );
    });
  });

  describe('deleteReference', () => {
    it('should delete reference successfully', async () => {
      mockEngine.deleteReference.mockResolvedValue(undefined);

      const context = createMockContext({ referenceId: 'ref-1' });

      const result = await handler.deleteReference(context as any);

      expect(mockEngine.deleteReference).toHaveBeenCalledWith('ref-1');
      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Reference deleted successfully'
        })
      );
    });

    it('should return 400 for missing reference ID', async () => {
      const context = createMockContext({});

      const result = await handler.deleteReference(context as any);

      expect(mockEngine.deleteReference).not.toHaveBeenCalled();
      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Reference ID is required'
        }),
        400
      );
    });
  });

  describe('extractMetadata', () => {
    it('should extract metadata successfully', async () => {
      const mockResponse = {
        success: true,
        metadata: {
          title: 'Extracted Title',
          authors: [{ firstName: 'Jane', lastName: 'Smith' }],
          confidence: 0.9
        },
        extractionTime: 1000,
        source: 'https://example.com'
      };

      mockEngine.extractMetadata.mockResolvedValue(mockResponse);

      const context = createMockContext({}, {}, {
        source: 'https://example.com',
        type: 'url',
        conversationId: 'conv-123'
      });

      const result = await handler.extractMetadata(context as any);

      expect(mockEngine.extractMetadata).toHaveBeenCalledWith({
        source: 'https://example.com',
        type: 'url',
        conversationId: 'conv-123'
      });

      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          metadata: mockResponse.metadata
        })
      );
    });

    it('should return 400 for invalid type', async () => {
      const context = createMockContext({}, {}, {
        source: 'https://example.com',
        type: 'invalid',
        conversationId: 'conv-123'
      });

      const result = await handler.extractMetadata(context as any);

      expect(mockEngine.extractMetadata).not.toHaveBeenCalled();
      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Type must be either "url" or "doi"'
        }),
        400
      );
    });
  });

  describe('formatCitation', () => {
    it('should format citation successfully', async () => {
      const mockResponse = {
        success: true,
        citation: '(Doe, 2023)',
        style: CitationStyle.APA,
        type: 'inline' as const
      };

      mockEngine.formatCitation.mockResolvedValue(mockResponse);

      const context = createMockContext({}, {}, {
        referenceId: 'ref-1',
        style: CitationStyle.APA,
        type: 'inline',
        context: 'Test context'
      });

      const result = await handler.formatCitation(context as any);

      expect(mockEngine.formatCitation).toHaveBeenCalledWith({
        referenceId: 'ref-1',
        style: CitationStyle.APA,
        type: 'inline',
        context: 'Test context'
      });

      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          citation: '(Doe, 2023)'
        })
      );
    });

    it('should return 400 for invalid citation style', async () => {
      const context = createMockContext({}, {}, {
        referenceId: 'ref-1',
        style: 'invalid_style',
        type: 'inline'
      });

      const result = await handler.formatCitation(context as any);

      expect(mockEngine.formatCitation).not.toHaveBeenCalled();
      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid citation style: invalid_style'
        }),
        400
      );
    });

    it('should return 400 for invalid citation type', async () => {
      const context = createMockContext({}, {}, {
        referenceId: 'ref-1',
        style: CitationStyle.APA,
        type: 'invalid_type'
      });

      const result = await handler.formatCitation(context as any);

      expect(mockEngine.formatCitation).not.toHaveBeenCalled();
      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Type must be either "inline" or "bibliography"'
        }),
        400
      );
    });
  });

  describe('generateBibliography', () => {
    it('should generate bibliography successfully', async () => {
      const mockResponse = {
        success: true,
        bibliography: 'Doe, J. (2023). Test Article.\n\nSmith, A. (2022). Another Article.',
        referenceCount: 2,
        style: CitationStyle.APA
      };

      mockEngine.generateBibliography.mockResolvedValue(mockResponse);

      const context = createMockContext({}, {}, {
        conversationId: 'conv-123',
        style: CitationStyle.APA,
        sortOrder: 'alphabetical',
        includeUrls: false
      });

      const result = await handler.generateBibliography(context as any);

      expect(mockEngine.generateBibliography).toHaveBeenCalledWith({
        conversationId: 'conv-123',
        style: CitationStyle.APA,
        sortOrder: 'alphabetical',
        includeUrls: false
      });

      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          bibliography: mockResponse.bibliography,
          referenceCount: 2
        })
      );
    });

    it('should return 400 for invalid sort order', async () => {
      const context = createMockContext({}, {}, {
        conversationId: 'conv-123',
        style: CitationStyle.APA,
        sortOrder: 'invalid_order'
      });

      const result = await handler.generateBibliography(context as any);

      expect(mockEngine.generateBibliography).not.toHaveBeenCalled();
      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Sort order must be "alphabetical", "chronological", or "appearance"'
        }),
        400
      );
    });
  });

  describe('getReferenceById', () => {
    it('should get reference by ID successfully', async () => {
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

      mockEngine.getReferenceById.mockResolvedValue(mockReference);

      const context = createMockContext({ referenceId: 'ref-1' });

      const result = await handler.getReferenceById(context as any);

      expect(mockEngine.getReferenceById).toHaveBeenCalledWith('ref-1');
      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          reference: mockReference
        })
      );
    });

    it('should return 404 for reference not found', async () => {
      mockEngine.getReferenceById.mockResolvedValue(null);

      const context = createMockContext({ referenceId: 'ref-1' });

      const result = await handler.getReferenceById(context as any);

      expect(context.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Reference not found'
        }),
        404
      );
    });
  });
});