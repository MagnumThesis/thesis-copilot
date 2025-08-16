import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  proofreaderAnalysisHandler,
  getConcernsHandler,
  updateConcernStatusHandler,
  getConcernStatisticsHandler
} from '../worker/handlers/proofreader-ai';
import { 
  ProofreaderAnalysisRequest,
  ProofreaderAnalysisResponse,
  ProofreadingConcern,
  ConcernCategory,
  ConcernSeverity,
  ConcernStatus,
  ConcernStatusUpdate
} from '../lib/ai-types';

// Mock dependencies
vi.mock('../worker/lib/supabase', () => ({
  getSupabase: vi.fn(() => mockSupabase)
}));

vi.mock('../worker/lib/api-keys', () => ({
  getGoogleGenerativeAIKey: vi.fn()
}));

vi.mock('../worker/lib/concern-analysis-engine', () => ({
  ConcernAnalysisEngineImpl: vi.fn(() => mockAnalysisEngine)
}));

// Mock objects
const mockSupabase = {
  from: vi.fn(() => mockQuery)
};

const mockQuery = {
  select: vi.fn(() => mockQuery),
  eq: vi.fn(() => mockQuery),
  order: vi.fn(() => ({ data: mockConcerns, error: null })),
  insert: vi.fn(() => ({ data: null, error: null })),
  update: vi.fn(() => mockQuery),
  single: vi.fn(() => ({ data: mockUpdatedConcern, error: null })),
  delete: vi.fn(() => mockQuery)
};

const mockAnalysisEngine = {
  analyzeContent: vi.fn()
};

const mockConcerns: any[] = [
  {
    id: 'concern-1',
    conversation_id: 'conv-123',
    category: 'clarity',
    severity: 'medium',
    title: 'Unclear sentence structure',
    description: 'Some sentences are difficult to follow',
    location: { section: 'Introduction' },
    suggestions: ['Break down complex sentences'],
    related_ideas: [],
    status: 'to_be_done',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'concern-2',
    conversation_id: 'conv-123',
    category: 'academic_style',
    severity: 'high',
    title: 'Informal language usage',
    description: 'Document contains informal expressions',
    location: { section: 'Methodology' },
    suggestions: ['Use formal academic language'],
    related_ideas: [],
    status: 'to_be_done',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const mockUpdatedConcern = {
  id: 'concern-1',
  conversation_id: 'conv-123',
  category: 'clarity',
  severity: 'medium',
  title: 'Unclear sentence structure',
  description: 'Some sentences are difficult to follow',
  location: { section: 'Introduction' },
  suggestions: ['Break down complex sentences'],
  related_ideas: [],
  status: 'addressed',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T01:00:00Z'
};

const mockProofreadingConcerns: ProofreadingConcern[] = [
  {
    id: 'concern-1',
    conversationId: 'conv-123',
    category: ConcernCategory.CLARITY,
    severity: ConcernSeverity.MEDIUM,
    title: 'Unclear sentence structure',
    description: 'Some sentences are difficult to follow',
    location: { section: 'Introduction' },
    suggestions: ['Break down complex sentences'],
    relatedIdeas: [],
    status: ConcernStatus.TO_BE_DONE,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }
];

const mockContext = {
  req: {
    json: vi.fn(),
    param: vi.fn(),
    query: vi.fn()
  },
  json: vi.fn(),
  env: {
    SUPABASE_URL: 'mock-url',
    SUPABASE_ANON_KEY: 'mock-key',
    GOOGLE_GENERATIVE_AI_API_KEY: 'mock-api-key'
  }
};

describe('Proofreader AI Handler', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockContext.req.json.mockResolvedValue({});
    mockContext.req.param.mockReturnValue('');
    mockContext.req.query.mockReturnValue('');
    mockContext.json.mockReturnValue(new Response());
    
    // Set default API key mock
    const { getGoogleGenerativeAIKey } = await import('../worker/lib/api-keys');
    vi.mocked(getGoogleGenerativeAIKey).mockReturnValue('mock-api-key');
  });

  describe('proofreaderAnalysisHandler', () => {
    it('should successfully analyze document content', async () => {
      const analysisRequest: ProofreaderAnalysisRequest = {
        conversationId: 'conv-123',
        documentContent: 'This is a test document with some content to analyze.',
        ideaDefinitions: [
          { id: 1, title: 'Test Idea', description: 'A test idea definition' }
        ]
      };

      mockContext.req.json.mockResolvedValue(analysisRequest);
      mockAnalysisEngine.analyzeContent.mockResolvedValue(mockProofreadingConcerns);

      await proofreaderAnalysisHandler(mockContext as any);

      expect(mockAnalysisEngine.analyzeContent).toHaveBeenCalledWith(
        analysisRequest.documentContent,
        analysisRequest.ideaDefinitions,
        analysisRequest.conversationId
      );
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          concerns: expect.any(Array),
          analysisMetadata: expect.objectContaining({
            totalConcerns: expect.any(Number),
            concernsByCategory: expect.any(Object),
            concernsBySeverity: expect.any(Object),
            analysisTime: expect.any(Number),
            contentLength: expect.any(Number),
            ideaDefinitionsUsed: expect.any(Number)
          })
        })
      );
    });

    it('should return error for missing conversation ID', async () => {
      mockContext.req.json.mockResolvedValue({
        documentContent: 'Test content'
      });

      await proofreaderAnalysisHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Missing or invalid conversation ID')
        }),
        400
      );
    });

    it('should return error for missing document content', async () => {
      mockContext.req.json.mockResolvedValue({
        conversationId: 'conv-123'
      });

      await proofreaderAnalysisHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Missing or invalid document content')
        }),
        400
      );
    });

    it('should return error for content that is too short', async () => {
      mockContext.req.json.mockResolvedValue({
        conversationId: 'conv-123',
        documentContent: 'Short'
      });

      await proofreaderAnalysisHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Document content too short for meaningful analysis')
        }),
        400
      );
    });

    it('should return error for content that is too large', async () => {
      mockContext.req.json.mockResolvedValue({
        conversationId: 'conv-123',
        documentContent: 'x'.repeat(100001)
      });

      await proofreaderAnalysisHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Document content too large (max 100KB)')
        }),
        400
      );
    });

    it('should handle analysis engine errors gracefully', async () => {
      const analysisRequest: ProofreaderAnalysisRequest = {
        conversationId: 'conv-123',
        documentContent: 'This is a test document with some content to analyze.',
        ideaDefinitions: []
      };

      mockContext.req.json.mockResolvedValue(analysisRequest);
      mockAnalysisEngine.analyzeContent.mockRejectedValue(new Error('Analysis failed'));

      await proofreaderAnalysisHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String)
        }),
        500
      );
    });

    it('should handle missing API key', async () => {
      const analysisRequest: ProofreaderAnalysisRequest = {
        conversationId: 'conv-123',
        documentContent: 'This is a test document with some content to analyze.',
        ideaDefinitions: []
      };

      mockContext.req.json.mockResolvedValue(analysisRequest);
      
      // Mock missing API key
      const { getGoogleGenerativeAIKey } = await import('../worker/lib/api-keys');
      vi.mocked(getGoogleGenerativeAIKey).mockReturnValue(null);

      await proofreaderAnalysisHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('authentication')
        }),
        503
      );
    });
  });

  describe('getConcernsHandler', () => {
    it('should retrieve concerns for a conversation', async () => {
      mockContext.req.param.mockReturnValue('conv-123');

      await getConcernsHandler(mockContext as any);

      expect(mockSupabase.from).toHaveBeenCalledWith('proofreading_concerns');
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          concerns: expect.any(Array)
        })
      );
    });

    it('should return error for missing conversation ID', async () => {
      mockContext.req.param.mockReturnValue('');

      await getConcernsHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Missing conversation ID')
        }),
        400
      );
    });

    it('should apply status filter when provided', async () => {
      mockContext.req.param.mockReturnValue('conv-123');
      mockContext.req.query.mockImplementation((key: string) => {
        if (key === 'status') return 'addressed';
        return '';
      });

      await getConcernsHandler(mockContext as any);

      expect(mockQuery.eq).toHaveBeenCalledWith('conversation_id', 'conv-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'addressed');
    });

    it('should apply category filter when provided', async () => {
      mockContext.req.param.mockReturnValue('conv-123');
      mockContext.req.query.mockImplementation((key: string) => {
        if (key === 'category') return 'clarity';
        return '';
      });

      await getConcernsHandler(mockContext as any);

      expect(mockQuery.eq).toHaveBeenCalledWith('conversation_id', 'conv-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'clarity');
    });

    it('should handle database errors', async () => {
      mockContext.req.param.mockReturnValue('conv-123');
      mockQuery.order.mockReturnValue({ data: null, error: { message: 'Database error' } });

      await getConcernsHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('retrieve concerns')
        }),
        500
      );
    });
  });

  describe('updateConcernStatusHandler', () => {
    it('should successfully update concern status', async () => {
      const statusUpdate: ConcernStatusUpdate = {
        concernId: 'concern-1',
        status: ConcernStatus.ADDRESSED
      };

      mockContext.req.param.mockReturnValue('concern-1');
      mockContext.req.json.mockResolvedValue({ status: 'addressed' });

      await updateConcernStatusHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          concern: expect.objectContaining({
            id: 'concern-1',
            status: 'addressed'
          })
        })
      );
    });

    it('should return error for missing concern ID', async () => {
      mockContext.req.param.mockReturnValue('');
      mockContext.req.json.mockResolvedValue({ status: 'addressed' });

      await updateConcernStatusHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('concern ID')
        }),
        400
      );
    });

    it('should return error for invalid status', async () => {
      mockContext.req.param.mockReturnValue('concern-1');
      mockContext.req.json.mockResolvedValue({ status: 'invalid_status' });

      await updateConcernStatusHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Invalid concern status')
        }),
        400
      );
    });

    it('should return error for missing status', async () => {
      mockContext.req.param.mockReturnValue('concern-1');
      mockContext.req.json.mockResolvedValue({});

      await updateConcernStatusHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('status')
        }),
        400
      );
    });

    it('should handle concern not found', async () => {
      mockContext.req.param.mockReturnValue('concern-1');
      mockContext.req.json.mockResolvedValue({ status: 'addressed' });
      mockQuery.single.mockReturnValue({ data: null, error: null });

      await updateConcernStatusHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('not found')
        }),
        404
      );
    });

    it('should handle database errors', async () => {
      mockContext.req.param.mockReturnValue('concern-1');
      mockContext.req.json.mockResolvedValue({ status: 'addressed' });
      mockQuery.single.mockReturnValue({ data: null, error: { message: 'Database error' } });

      await updateConcernStatusHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('update concern status')
        }),
        500
      );
    });
  });

  describe('getConcernStatisticsHandler', () => {
    it('should retrieve concern statistics for a conversation', async () => {
      mockContext.req.param.mockReturnValue('conv-123');

      const mockQuery = {
        select: vi.fn(() => mockQuery),
        eq: vi.fn(() => ({ 
          data: [
            { category: 'clarity', severity: 'medium', status: 'to_be_done' },
            { category: 'academic_style', severity: 'high', status: 'addressed' }
          ], 
          error: null 
        }))
      };
      mockSupabase.from.mockReturnValue(mockQuery);

      await getConcernStatisticsHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          statistics: expect.objectContaining({
            total: expect.any(Number),
            toBeDone: expect.any(Number),
            addressed: expect.any(Number),
            rejected: expect.any(Number),
            byCategory: expect.any(Object),
            bySeverity: expect.any(Object)
          })
        })
      );
    });

    it('should return error for missing conversation ID', async () => {
      mockContext.req.param.mockReturnValue('');

      await getConcernStatisticsHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Missing conversation ID')
        }),
        400
      );
    });

    it('should handle database errors', async () => {
      mockContext.req.param.mockReturnValue('conv-123');
      mockQuery.eq.mockReturnValue({ data: null, error: { message: 'Database error' } });

      await getConcernStatisticsHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('retrieve statistics')
        }),
        500
      );
    });

    it('should handle empty results', async () => {
      mockContext.req.param.mockReturnValue('conv-123');
      mockQuery.eq.mockReturnValue({ data: [], error: null });

      await getConcernStatisticsHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          statistics: expect.objectContaining({
            total: 0,
            toBeDone: 0,
            addressed: 0,
            rejected: 0
          })
        })
      );
    });
  });
});

describe('Proofreader AI Handler Error Handling', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockContext.json.mockReturnValue(new Response());
    
    // Set default API key mock
    const { getGoogleGenerativeAIKey } = await import('../worker/lib/api-keys');
    vi.mocked(getGoogleGenerativeAIKey).mockReturnValue('mock-api-key');
  });

  it('should handle malformed JSON requests', async () => {
    mockContext.req.json.mockRejectedValue(new Error('Invalid JSON'));

    await proofreaderAnalysisHandler(mockContext as any);

    expect(mockContext.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.any(String)
      }),
      500
    );
  });

  it('should handle network timeouts', async () => {
    const analysisRequest: ProofreaderAnalysisRequest = {
      conversationId: 'conv-123',
      documentContent: 'This is a test document with some content to analyze.',
      ideaDefinitions: []
    };

    mockContext.req.json.mockResolvedValue(analysisRequest);
    mockAnalysisEngine.analyzeContent.mockRejectedValue(new Error('timeout'));

    await proofreaderAnalysisHandler(mockContext as any);

    expect(mockContext.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Network connection failed')
      }),
      500
    );
  });

  it('should handle rate limiting errors', async () => {
    const analysisRequest: ProofreaderAnalysisRequest = {
      conversationId: 'conv-123',
      documentContent: 'This is a test document with some content to analyze.',
      ideaDefinitions: []
    };

    mockContext.req.json.mockResolvedValue(analysisRequest);
    mockAnalysisEngine.analyzeContent.mockRejectedValue(new Error('rate limit exceeded'));

    await proofreaderAnalysisHandler(mockContext as any);

    expect(mockContext.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Too many requests')
      }),
      500
    );
  });

  it('should handle quota exceeded errors', async () => {
    const analysisRequest: ProofreaderAnalysisRequest = {
      conversationId: 'conv-123',
      documentContent: 'This is a test document with some content to analyze.',
      ideaDefinitions: []
    };

    mockContext.req.json.mockResolvedValue(analysisRequest);
    mockAnalysisEngine.analyzeContent.mockRejectedValue(new Error('quota exceeded'));

    await proofreaderAnalysisHandler(mockContext as any);

    expect(mockContext.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('quota exceeded')
      }),
      500
    );
  });
});