/**
 * Continue Mode Integration Tests
 * Comprehensive tests for continue mode functionality including
 * cursor position analysis, context-aware generation, style consistency,
 * and fallback prompting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { builderAIContinueHandler } from '../worker/handlers/builder-ai';
import { AIContinueRequest, AIResponse } from '../lib/ai-types';

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
        })),
        single: vi.fn(() => ({
          data: { name: 'Test Conversation' },
          error: null
        }))
      })),
      limit: vi.fn(() => ({
        data: [],
        error: null
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

describe('Continue Mode Integration Tests', () => {
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Cursor Position Analysis', () => {
    it('should analyze cursor position at beginning of document', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'This thesis explores the fundamental concepts of artificial intelligence and its applications in modern society.',
        usage: { totalTokens: 150 }
      });

      const request: AIContinueRequest = {
        documentContent: '',
        cursorPosition: 0,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      // Verify that the AI was called with appropriate fallback prompting
      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('insufficient context')
        })
      );
    });

    it('should analyze cursor position in middle of sentence', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'revolutionized various industries by providing intelligent automation and decision-making capabilities.',
        usage: { totalTokens: 120 }
      });

      const request: AIContinueRequest = {
        documentContent: '# Introduction\n\nArtificial intelligence has',
        cursorPosition: 42, // After "has"
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      // Verify that the AI was called with appropriate prompt (could be continuation or fallback)
      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringMatching(/Continue the content|insufficient context/i)
        })
      );
    });

    it('should analyze cursor position at end of paragraph', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: '\n\nFurthermore, machine learning algorithms have demonstrated remarkable capabilities in pattern recognition and predictive analytics.',
        usage: { totalTokens: 140 }
      });

      const request: AIContinueRequest = {
        documentContent: '# Research Overview\n\nThis research investigates the impact of AI on healthcare systems.',
        cursorPosition: 78, // At end of sentence
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: expect.stringContaining('Furthermore')
        })
      );
    });

    it('should handle cursor position beyond document length', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'Additional content to extend the document.',
        usage: { totalTokens: 80 }
      });

      const request: AIContinueRequest = {
        documentContent: 'Short document.',
        cursorPosition: 1000, // Beyond document length
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: 'Additional content to extend the document.'
        })
      );
    });
  });

  describe('Context-Aware Content Generation', () => {
    it('should generate content aware of document structure', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'involves the systematic collection and analysis of quantitative data to test specific hypotheses.',
        usage: { totalTokens: 130 }
      });

      mockContextManager.buildContext.mockResolvedValue({
        content: '# Research Methodology\n\n## Data Collection\n\nThis study',
        ideaDefinitions: [],
        conversationTitle: 'Research Methods Study',
        cursorPosition: 50,
        documentStructure: [
          { type: 'heading', level: 1, content: 'Research Methodology', position: { start: 0, end: 22 } },
          { type: 'heading', level: 2, content: 'Data Collection', position: { start: 24, end: 41 } }
        ]
      });

      const request: AIContinueRequest = {
        documentContent: '# Research Methodology\n\n## Data Collection\n\nThis study',
        cursorPosition: 50,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: expect.stringContaining('systematic collection')
        })
      );
    });

    it('should incorporate idea definitions from context', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'utilizes supervised learning algorithms to classify data patterns and make predictions based on training datasets.',
        usage: { totalTokens: 145 }
      });

      mockContextManager.buildContext.mockResolvedValue({
        content: 'Machine learning',
        ideaDefinitions: [
          { id: 1, title: 'Machine Learning', description: 'A subset of AI that enables computers to learn without explicit programming', conversationid: 'test-chat-id' },
          { id: 2, title: 'Supervised Learning', description: 'ML technique using labeled training data', conversationid: 'test-chat-id' }
        ],
        conversationTitle: 'AI Research',
        cursorPosition: 16,
        documentStructure: []
      });

      const request: AIContinueRequest = {
        documentContent: 'Machine learning',
        cursorPosition: 16,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      // Verify that idea definitions were included in context
      expect(mockContextManager.formatContextForAI).toHaveBeenCalledWith(
        expect.objectContaining({
          ideaDefinitions: expect.arrayContaining([
            expect.objectContaining({ title: 'Machine Learning' }),
            expect.objectContaining({ title: 'Supervised Learning' })
          ])
        })
      );
    });

    it('should use selected text as additional context', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'through iterative training processes that optimize model parameters to minimize prediction errors.',
        usage: { totalTokens: 125 }
      });

      const request: AIContinueRequest = {
        documentContent: '# Deep Learning\n\nNeural networks learn complex patterns',
        cursorPosition: 45,
        selectedText: 'Neural networks',
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      expect(mockContextManager.buildContext).toHaveBeenCalledWith(
        '# Deep Learning\n\nNeural networks learn complex patterns',
        'test-chat-id',
        45,
        'Neural networks'
      );
    });
  });

  describe('Style and Tone Consistency', () => {
    it('should maintain academic tone in formal documents', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'demonstrates significant potential for advancing our understanding of complex cognitive processes.',
        usage: { totalTokens: 135 }
      });

      const request: AIContinueRequest = {
        documentContent: '# Abstract\n\nThis research investigates the theoretical foundations of artificial intelligence and',
        cursorPosition: 90,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      // Verify that the prompt includes style analysis instructions
      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringMatching(/academic.*tone|tone.*academic/i)
        })
      );
    });

    it('should maintain consistent sentence structure', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'Second, the methodology incorporates mixed-methods approaches. Third, the analysis framework ensures comprehensive evaluation.',
        usage: { totalTokens: 160 }
      });

      const request: AIContinueRequest = {
        documentContent: '# Research Design\n\nFirst, the study employs quantitative analysis methods.',
        cursorPosition: 65,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: expect.stringContaining('Second')
        })
      );
    });

    it('should preserve markdown formatting style', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: '\n\n## Literature Review\n\nThe existing literature reveals several key themes:\n\n- **Theme 1**: Theoretical foundations\n- **Theme 2**: Practical applications',
        usage: { totalTokens: 170 }
      });

      const request: AIContinueRequest = {
        documentContent: '# Introduction\n\nThis thesis examines the role of AI in education.',
        cursorPosition: 55,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: expect.stringMatching(/##.*\n\n.*\n\n-.*\*\*.*\*\*/)
        })
      );
    });

    it('should detect and maintain complex vocabulary level', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'necessitates comprehensive epistemological examination of contemporary paradigmatic frameworks.',
        usage: { totalTokens: 140 }
      });

      const request: AIContinueRequest = {
        documentContent: '# Theoretical Framework\n\nThe phenomenological approach to understanding consciousness',
        cursorPosition: 75,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      // Verify that style analysis detected advanced vocabulary
      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringMatching(/advanced.*vocabulary|technical.*vocabulary/i)
        })
      );
    });
  });

  describe('Fallback Prompting for Insufficient Context', () => {
    it('should use fallback prompting for very short documents', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'This document will explore the fundamental concepts and applications of the chosen research topic.',
        usage: { totalTokens: 110 }
      });

      const request: AIContinueRequest = {
        documentContent: 'AI',
        cursorPosition: 2,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      // Verify fallback prompting was used
      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('insufficient context')
        })
      );

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          metadata: expect.objectContaining({
            contextSufficiency: false
          })
        })
      );
    });

    it('should provide guidance when context is insufficient', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'To develop this topic further, consider adding specific research questions, methodology details, or theoretical frameworks.',
        usage: { totalTokens: 95 }
      });

      const request: AIContinueRequest = {
        documentContent: 'Research',
        cursorPosition: 8,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringMatching(/insufficient.*context|limited.*context/i)
        })
      );
    });

    it('should handle empty document with meaningful suggestions', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: '# Thesis Title\n\n## Introduction\n\nThis thesis investigates...\n\n## Research Questions\n\n1. What are the key factors...',
        usage: { totalTokens: 120 }
      });

      const request: AIContinueRequest = {
        documentContent: '',
        cursorPosition: 0,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          content: expect.stringContaining('# Thesis Title')
        })
      );
    });

    it('should suggest using prompt mode for initial content', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'Consider using prompt mode to generate initial content with specific instructions about your research topic.',
        usage: { totalTokens: 85 }
      });

      const request: AIContinueRequest = {
        documentContent: 'The',
        cursorPosition: 3,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringMatching(/prompt mode|insufficient context|fallback/i)
        })
      );
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle AI service errors gracefully', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockRejectedValue(new Error('AI service unavailable'));

      const request: AIContinueRequest = {
        documentContent: 'Test content for continuation',
        cursorPosition: 15,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to continue content. Please try again.'
        }),
        500
      );
    });

    it('should handle context manager errors', async () => {
      mockContextManager.buildContext.mockRejectedValue(new Error('Context error'));

      const request: AIContinueRequest = {
        documentContent: 'Test content',
        cursorPosition: 5,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Failed to continue content. Please try again.'
        }),
        500
      );
    });

    it('should validate required fields', async () => {
      const request = {
        documentContent: 'Test content',
        cursorPosition: 5
        // Missing conversationId
      };

      mockContext.req.json.mockResolvedValue(request);
      mockContext.json.mockImplementation((data, status) => ({ 
        json: () => data, 
        status: status || 200 
      }));

      await builderAIContinueHandler(mockContext as any);

      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'ConversationId is required.'
        }),
        400
      );
    });
  });

  describe('Performance and Metadata', () => {
    it('should include processing time in response metadata', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'Generated continuation content',
        usage: { totalTokens: 100 }
      });

      const request: AIContinueRequest = {
        documentContent: 'Test document content',
        cursorPosition: 10,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      let capturedResponse: any;
      mockContext.json.mockImplementation((data, status) => {
        capturedResponse = data;
        return { json: () => data, status: status || 200 };
      });

      await builderAIContinueHandler(mockContext as any);

      expect(capturedResponse.metadata).toHaveProperty('processingTime');
      expect(typeof capturedResponse.metadata.processingTime).toBe('number');
      expect(capturedResponse.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should include context sufficiency information', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'Sufficient context continuation',
        usage: { totalTokens: 120 }
      });

      const request: AIContinueRequest = {
        documentContent: '# Research Methodology\n\nThis comprehensive study employs a mixed-methods approach to investigate the research questions.',
        cursorPosition: 95,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      let capturedResponse: any;
      mockContext.json.mockImplementation((data, status) => {
        capturedResponse = data;
        return { json: () => data, status: status || 200 };
      });

      await builderAIContinueHandler(mockContext as any);

      expect(capturedResponse.metadata).toHaveProperty('contextSufficiency');
      expect(capturedResponse.metadata).toHaveProperty('styleAnalysis');
    });

    it('should track token usage accurately', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'Token usage tracking test content',
        usage: { totalTokens: 156 }
      });

      const request: AIContinueRequest = {
        documentContent: 'Content for token tracking',
        cursorPosition: 15,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      let capturedResponse: any;
      mockContext.json.mockImplementation((data, status) => {
        capturedResponse = data;
        return { json: () => data, status: status || 200 };
      });

      await builderAIContinueHandler(mockContext as any);

      expect(capturedResponse.metadata.tokensUsed).toBe(156);
    });
  });

  describe('Integration Workflow', () => {
    it('should complete full continue mode workflow successfully', async () => {
      const { generateText } = await import('ai');
      (generateText as any).mockResolvedValue({
        text: 'demonstrates the effectiveness of machine learning algorithms in processing large-scale datasets and generating actionable insights for decision-making processes.',
        usage: { totalTokens: 180 }
      });

      // Setup comprehensive context
      mockContextManager.buildContext.mockResolvedValue({
        content: '# Data Analysis Framework\n\n## Machine Learning Applications\n\nThe proposed framework',
        ideaDefinitions: [
          { id: 1, title: 'Machine Learning', description: 'Algorithms that learn from data', conversationid: 'test-chat-id' }
        ],
        conversationTitle: 'AI Research Thesis',
        cursorPosition: 75,
        documentStructure: [
          { type: 'heading', level: 1, content: 'Data Analysis Framework', position: { start: 0, end: 26 } },
          { type: 'heading', level: 2, content: 'Machine Learning Applications', position: { start: 28, end: 58 } }
        ]
      });

      const request: AIContinueRequest = {
        documentContent: '# Data Analysis Framework\n\n## Machine Learning Applications\n\nThe proposed framework',
        cursorPosition: 75,
        conversationId: 'test-chat-id'
      };

      mockContext.req.json.mockResolvedValue(request);
      let capturedResponse: any;
      mockContext.json.mockImplementation((data, status) => {
        capturedResponse = data;
        return { json: () => data, status: status || 200 };
      });

      await builderAIContinueHandler(mockContext as any);

      // Verify complete workflow
      expect(mockContextManager.buildContext).toHaveBeenCalledWith(
        '# Data Analysis Framework\n\n## Machine Learning Applications\n\nThe proposed framework',
        'test-chat-id',
        75,
        undefined
      );
      
      expect(mockContextManager.formatContextForAI).toHaveBeenCalled();
      
      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Continue the content')
        })
      );

      expect(capturedResponse).toEqual({
        success: true,
        content: 'demonstrates the effectiveness of machine learning algorithms in processing large-scale datasets and generating actionable insights for decision-making processes.',
        metadata: {
          tokensUsed: 180,
          processingTime: expect.any(Number),
          contextSufficiency: true,
          styleAnalysis: expect.any(String)
        }
      });
    });
  });
}); 