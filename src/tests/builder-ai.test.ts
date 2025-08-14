import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModificationType, AIPromptRequest, AIContinueRequest, AIModifyRequest, AIResponse } from '../lib/ai-types';
import { builderAIPromptHandler, builderAIContinueHandler, builderAIModifyHandler } from '../worker/handlers/builder-ai';

// Mock dependencies
vi.mock('../worker/lib/supabase', () => ({
  getSupabase: vi.fn(() => mockSupabase)
}));

vi.mock('../worker/lib/api-keys', () => ({
  getGoogleGenerativeAIKey: vi.fn(() => 'mock-api-key')
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn())
}));

vi.mock('ai', () => ({
  generateText: vi.fn()
}));

vi.mock('../worker/lib/ai-context-manager', () => ({
  createAIContextManager: vi.fn(() => mockContextManager)
}));

// Mock objects
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }))
  }))
};

const mockContextManager = {
  buildContext: vi.fn(),
  formatContextForAI: vi.fn(() => 'Formatted context for AI'),
  getIdeaDefinitions: vi.fn(() => []),
  getConversationContext: vi.fn(() => ({ title: 'Test Chat', messages: [] }))
};

const mockContext = {
  req: {
    json: vi.fn()
  },
  json: vi.fn(),
  env: {}
};

describe('Builder AI Handler Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup default mocks
    const { getGoogleGenerativeAIKey } = await import('../worker/lib/api-keys');
    (getGoogleGenerativeAIKey as any).mockReturnValue('mock-api-key');
    
    mockContextManager.buildContext.mockResolvedValue({
      content: 'Test document content',
      ideaDefinitions: [],
      conversationTitle: 'Test Chat',
      cursorPosition: 0,
      documentStructure: []
    });
  });

  describe('Prompt Mode Handler', () => {
    it('should return 400 when prompt is missing', async () => {
      const request: Partial<AIPromptRequest> = {
        documentContent: 'Test content',
        cursorPosition: 0,
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIPromptHandler(mockContext as any);
      const result = await response.json();

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Prompt and conversationId are required.'
        }),
        400
      );
    });

    it('should return 400 when conversationId is missing', async () => {
      const request: Partial<AIPromptRequest> = {
        prompt: 'Write about machine learning',
        documentContent: 'Test content',
        cursorPosition: 0,
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIPromptHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Prompt and conversationId are required.'
        }),
        400
      );
    });

    it('should generate content successfully with valid prompt', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'Generated AI content about artificial intelligence',
        usage: { totalTokens: 150 }
      });

      const request: AIPromptRequest = {
        prompt: 'Write a brief introduction about artificial intelligence',
        documentContent: '# My Thesis\n\nThis is my thesis about AI.',
        cursorPosition: 50,
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIPromptHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: 'Generated AI content about artificial intelligence',
          metadata: expect.objectContaining({
            tokensUsed: 150,
            processingTime: expect.any(Number)
          })
        })
      );
    });

    it('should handle empty document content gracefully', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'Generated content for empty document',
        usage: { totalTokens: 100 }
      });

      const request: AIPromptRequest = {
        prompt: 'Write about research methodology',
        documentContent: '',
        cursorPosition: 0,
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIPromptHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: 'Generated content for empty document'
        })
      );
    });

    it('should handle AI service errors gracefully', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockRejectedValue(new Error('AI service error'));

      const request: AIPromptRequest = {
        prompt: 'Write about AI',
        documentContent: 'Test content',
        cursorPosition: 0,
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIPromptHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to generate content. Please try again.',
          metadata: expect.objectContaining({
            tokensUsed: 0,
            processingTime: expect.any(Number)
          })
        }),
        500
      );
    });
  });

  describe('Continue Mode Handler', () => {
    it('should return 400 when conversationId is missing', async () => {
      const request: Partial<AIContinueRequest> = {
        documentContent: 'Test content',
        cursorPosition: 10,
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIContinueHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'ConversationId is required.'
        }),
        400
      );
    });

    it('should continue content successfully', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'many industries by providing intelligent automation and decision-making capabilities.',
        usage: { totalTokens: 120 }
      });

      const request: AIContinueRequest = {
        documentContent: '# Introduction\n\nArtificial intelligence has revolutionized',
        cursorPosition: 55,
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIContinueHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: 'many industries by providing intelligent automation and decision-making capabilities.',
          metadata: expect.objectContaining({
            tokensUsed: 120,
            processingTime: expect.any(Number)
          })
        })
      );
    });

    it('should handle selected text context', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'the systematic collection and analysis of numerical data to test hypotheses.',
        usage: { totalTokens: 90 }
      });

      const request: AIContinueRequest = {
        documentContent: '# Research Methods\n\nQuantitative research involves',
        cursorPosition: 45,
        selectedText: 'Quantitative research',
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIContinueHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: 'the systematic collection and analysis of numerical data to test hypotheses.'
        })
      );
    });

    it('should handle empty document content', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'This document will explore various aspects of the research topic.',
        usage: { totalTokens: 80 }
      });

      const request: AIContinueRequest = {
        documentContent: '',
        cursorPosition: 0,
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIContinueHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: 'This document will explore various aspects of the research topic.'
        })
      );
    });

    it('should handle AI service errors gracefully', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockRejectedValue(new Error('AI service unavailable'));

      const request: AIContinueRequest = {
        documentContent: 'Test content',
        cursorPosition: 5,
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIContinueHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to continue content. Please try again.',
          metadata: expect.objectContaining({
            tokensUsed: 0,
            processingTime: expect.any(Number)
          })
        }),
        500
      );
    });
  });

  describe('Modify Mode Handler', () => {
    it('should return 400 when selectedText is missing', async () => {
      const request: Partial<AIModifyRequest> = {
        modificationType: ModificationType.REWRITE,
        documentContent: 'Test content',
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIModifyHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Selected text, modification type, and conversationId are required.'
        }),
        400
      );
    });

    it('should return 400 when modificationType is missing', async () => {
      const request: Partial<AIModifyRequest> = {
        selectedText: 'This is some text to modify',
        documentContent: 'Test content',
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIModifyHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Selected text, modification type, and conversationId are required.'
        }),
        400
      );
    });

    it('should return 400 when conversationId is missing', async () => {
      const request: Partial<AIModifyRequest> = {
        selectedText: 'This is some text to modify',
        modificationType: ModificationType.REWRITE,
        documentContent: 'Test content',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIModifyHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Selected text, modification type, and conversationId are required.'
        }),
        400
      );
    });

    it('should return 400 for invalid modification type', async () => {
      const request = {
        selectedText: 'This is some text to modify',
        modificationType: 'invalid_type',
        documentContent: 'Test content',
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIModifyHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid modification type.'
        }),
        400
      );
    });

    it('should rewrite text successfully', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'This research contributes significantly to the field by addressing key gaps in current knowledge.',
        usage: { totalTokens: 140 }
      });

      const request: AIModifyRequest = {
        selectedText: 'This research is very important and significant for the field.',
        modificationType: ModificationType.REWRITE,
        documentContent: '# Research Overview\n\nThis research is very important and significant for the field.',
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIModifyHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: 'This research contributes significantly to the field by addressing key gaps in current knowledge.',
          metadata: expect.objectContaining({
            tokensUsed: 140,
            processingTime: expect.any(Number)
          })
        })
      );
    });

    it('should expand text successfully', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'Machine learning is useful for analyzing large datasets, identifying patterns, automating decision-making processes, and providing predictive insights across various industries including healthcare, finance, and technology.',
        usage: { totalTokens: 180 }
      });

      const request: AIModifyRequest = {
        selectedText: 'Machine learning is useful.',
        modificationType: ModificationType.EXPAND,
        documentContent: '# AI Applications\n\nMachine learning is useful.',
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIModifyHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: expect.stringContaining('Machine learning is useful for analyzing large datasets')
        })
      );
    });

    it('should summarize text successfully', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'AI includes ML, NLP, computer vision, and robotics for intelligent task automation.',
        usage: { totalTokens: 95 }
      });

      const request: AIModifyRequest = {
        selectedText: 'Artificial intelligence encompasses a broad range of technologies including machine learning, natural language processing, computer vision, and robotics. These technologies work together to create systems that can perform tasks typically requiring human intelligence.',
        modificationType: ModificationType.SUMMARIZE,
        documentContent: '# AI Overview\n\nArtificial intelligence encompasses a broad range of technologies including machine learning, natural language processing, computer vision, and robotics. These technologies work together to create systems that can perform tasks typically requiring human intelligence.',
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIModifyHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: 'AI includes ML, NLP, computer vision, and robotics for intelligent task automation.'
        })
      );
    });

    it('should improve clarity successfully', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'This research used a comprehensive methodology.',
        usage: { totalTokens: 85 }
      });

      const request: AIModifyRequest = {
        selectedText: 'The methodology that was utilized in this research study was a comprehensive approach.',
        modificationType: ModificationType.IMPROVE_CLARITY,
        documentContent: '# Methodology\n\nThe methodology that was utilized in this research study was a comprehensive approach.',
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIModifyHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: 'This research used a comprehensive methodology.'
        })
      );
    });

    it('should handle custom prompt modification successfully', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'This research methodology incorporates advanced statistical techniques and machine learning algorithms to analyze complex datasets.',
        usage: { totalTokens: 120 }
      });

      const request: AIModifyRequest = {
        selectedText: 'This research uses data analysis.',
        modificationType: ModificationType.PROMPT,
        customPrompt: 'Make this more technical and add details about statistical methods',
        documentContent: '# Analysis\n\nThis research uses data analysis.',
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIModifyHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: 'This research methodology incorporates advanced statistical techniques and machine learning algorithms to analyze complex datasets.'
        })
      );
    });

    it('should handle AI service errors gracefully', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockRejectedValue(new Error('AI service error'));

      const request: AIModifyRequest = {
        selectedText: 'Text to modify',
        modificationType: ModificationType.REWRITE,
        documentContent: 'Test content',
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIModifyHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to modify content. Please try again.',
          metadata: expect.objectContaining({
            tokensUsed: 0,
            processingTime: expect.any(Number)
          })
        }),
        500
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      mockContext.req.json.mockRejectedValue(new Error('Invalid JSON'));
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIPromptHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to generate content. Please try again.',
          metadata: expect.objectContaining({
            tokensUsed: 0,
            processingTime: expect.any(Number)
          })
        }),
        500
      );
    });

    it('should handle missing API key gracefully', async () => {
      const { getGoogleGenerativeAIKey } = await import('../worker/lib/api-keys');
      (getGoogleGenerativeAIKey as any).mockReturnValue(null);

      const request: AIPromptRequest = {
        prompt: 'Test prompt',
        documentContent: 'Test content',
        cursorPosition: 0,
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIPromptHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'AI service is currently unavailable.'
        }),
        500
      );
    });

    it('should handle context manager errors gracefully', async () => {
      mockContextManager.buildContext.mockRejectedValue(new Error('Context error'));

      const request: AIPromptRequest = {
        prompt: 'Test prompt',
        documentContent: 'Test content',
        cursorPosition: 0,
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIPromptHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to generate content. Please try again.'
        }),
        500
      );
    });
  });

  describe('Response Format Validation', () => {
    it('should return properly formatted success response', async () => {
      // Ensure API key is available
      const { getGoogleGenerativeAIKey } = await import('../worker/lib/api-keys');
      (getGoogleGenerativeAIKey as any).mockReturnValue('mock-api-key');

      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'Generated content about data analysis',
        usage: { totalTokens: 125 }
      });

      const request: AIPromptRequest = {
        prompt: 'Write about data analysis',
        documentContent: '# Data Analysis',
        cursorPosition: 15,
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      let capturedResponse: any;
      mockContext.json.mockImplementation((data, status) => {
        capturedResponse = data;
        return { json: () => data, status: status || 200 };
      });

      const response = await builderAIPromptHandler(mockContext as any);
      
      // Validate response structure
      expect(capturedResponse).toHaveProperty('success');
      expect(capturedResponse.success).toBe(true);
      expect(capturedResponse).toHaveProperty('content');
      expect(capturedResponse).toHaveProperty('metadata');
      expect(capturedResponse.metadata).toHaveProperty('tokensUsed');
      expect(capturedResponse.metadata).toHaveProperty('processingTime');
      expect(typeof capturedResponse.metadata.tokensUsed).toBe('number');
      expect(typeof capturedResponse.metadata.processingTime).toBe('number');
    });

    it('should return properly formatted error response', async () => {
      const request = {
        // Missing required fields
        documentContent: 'Test content',
      };

      mockContext.req.json.mockResolvedValue(request);
      let capturedResponse: any;
      mockContext.json.mockImplementation((data, status) => {
        capturedResponse = data;
        return { json: () => data, status: status || 200 };
      });

      const response = await builderAIPromptHandler(mockContext as any);
      
      // Validate error response structure
      expect(capturedResponse).toHaveProperty('success');
      expect(capturedResponse.success).toBe(false);
      expect(capturedResponse).toHaveProperty('error');
      expect(typeof capturedResponse.error).toBe('string');
      expect(capturedResponse.error.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with Context Manager', () => {
    it('should call context manager with correct parameters', async () => {
      // Ensure API key is available
      const { getGoogleGenerativeAIKey } = await import('../worker/lib/api-keys');
      (getGoogleGenerativeAIKey as any).mockReturnValue('mock-api-key');

      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'Generated content',
        usage: { totalTokens: 100 }
      });

      const request: AIPromptRequest = {
        prompt: 'Test prompt',
        documentContent: 'Test document content',
        cursorPosition: 25,
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIPromptHandler(mockContext as any);

      expect(mockContextManager.buildContext).toHaveBeenCalledWith(
        'Test document content',
        'test-chat-id',
        25
      );
      expect(mockContextManager.formatContextForAI).toHaveBeenCalled();
    });

    it('should handle context manager returning minimal context', async () => {
      // Ensure API key is available
      const { getGoogleGenerativeAIKey } = await import('../worker/lib/api-keys');
      (getGoogleGenerativeAIKey as any).mockReturnValue('mock-api-key');

      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'Generated content with minimal context',
        usage: { totalTokens: 90 }
      });

      mockContextManager.buildContext.mockResolvedValue({
        content: '',
        ideaDefinitions: [],
        conversationTitle: 'Unknown',
        cursorPosition: 0,
        documentStructure: []
      });

      const request: AIPromptRequest = {
        prompt: 'Test prompt',
        documentContent: '',
        cursorPosition: 0,
        conversationId: 'test-chat-id',
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      const response = await builderAIPromptHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: 'Generated content with minimal context'
        })
      );
    });
  });
});