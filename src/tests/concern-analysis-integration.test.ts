/**
 * Concern Analysis Integration Tests
 * Tests the integration between concern analysis engine and idea definitions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConcernAnalysisEngineImpl } from '@/worker/lib/concern-analysis-engine';
import { IdeaDefinition, ConcernCategory, ConcernSeverity } from '@/lib/ai-types';

// Mock the AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn()
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => () => 'mock-model')
}));

import { generateText } from 'ai';

describe('Concern Analysis Integration Tests', () => {
  let analysisEngine: ConcernAnalysisEngineImpl;
  const mockApiKey = 'test-api-key';
  const mockConversationId = 'test-conversation-123';

  const mockIdeaDefinitions: IdeaDefinition[] = [
    {
      id: 1,
      title: 'Machine Learning',
      description: 'A subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed.',
      conversationid: mockConversationId
    },
    {
      id: 2,
      title: 'Supervised Learning',
      description: 'A type of machine learning where the algorithm learns from labeled training data to make predictions on new, unseen data.',
      conversationid: mockConversationId
    },
    {
      id: 3,
      title: 'Neural Networks',
      description: 'Computing systems inspired by biological neural networks that constitute animal brains, used for pattern recognition and decision making.',
      conversationid: mockConversationId
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    analysisEngine = new ConcernAnalysisEngineImpl(mockApiKey);
  });

  describe('Content Analysis with Idea Context', () => {
    it('should analyze content using idea definitions for context', async () => {
      const testContent = `# Thesis Proposal

## Introduction
This research explores machine learning applications in healthcare. We will use supervised learning techniques to analyze medical data.

## Methodology
Our approach involves training neural networks on patient data to predict treatment outcomes.`;

      const mockAIResponse = JSON.stringify([
        {
          category: 'TERMINOLOGY',
          severity: 'low',
          title: 'Inconsistent terminology usage',
          description: 'The term "machine learning" is used without proper definition, but it is defined in your idea definitions.',
          suggestions: ['Reference your machine learning definition when first introducing the term'],
          location: {
            section: 'Introduction',
            context: 'machine learning applications'
          }
        },
        {
          category: 'CONSISTENCY',
          severity: 'medium',
          title: 'Missing connection to defined concepts',
          description: 'The methodology mentions neural networks but doesn\'t connect to your established definition.',
          suggestions: ['Explicitly reference your neural networks definition', 'Explain how your approach relates to the defined concept'],
          location: {
            section: 'Methodology',
            context: 'training neural networks'
          }
        }
      ]);

      vi.mocked(generateText).mockResolvedValue({
        text: mockAIResponse,
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 200 }
      });

      const concerns = await analysisEngine.analyzeContent(testContent, mockIdeaDefinitions, mockConversationId);

      expect(concerns).toHaveLength(2);
      expect(concerns[0].category).toBe(ConcernCategory.TERMINOLOGY);
      expect(concerns[0].title).toContain('terminology usage');
      expect(concerns[1].category).toBe(ConcernCategory.CONSISTENCY);
      expect(concerns[1].title).toContain('connection to defined concepts');

      // Verify that the AI was called with idea context
      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Machine Learning:')
        })
      );
    });

    it('should handle analysis without idea definitions', async () => {
      const testContent = `# Thesis Proposal

## Introduction
This research explores artificial intelligence applications.`;

      const mockAIResponse = JSON.stringify([
        {
          category: 'COMPLETENESS',
          severity: 'high',
          title: 'Insufficient detail',
          description: 'The introduction lacks sufficient detail about the research scope.',
          suggestions: ['Expand the introduction with more specific details'],
          location: {
            section: 'Introduction',
            context: 'artificial intelligence applications'
          }
        }
      ]);

      vi.mocked(generateText).mockResolvedValue({
        text: mockAIResponse,
        finishReason: 'stop',
        usage: { promptTokens: 50, completionTokens: 100 }
      });

      const concerns = await analysisEngine.analyzeContent(testContent, [], mockConversationId);

      expect(concerns).toHaveLength(1);
      expect(concerns[0].category).toBe(ConcernCategory.COMPLETENESS);

      // Verify that the AI was called with no idea context message
      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('No idea definitions are available for contextual analysis')
        })
      );
    });

    it('should generate concerns that reference specific idea definitions', async () => {
      const testContent = `# Thesis Proposal

## Introduction
We will use AI to solve problems. The system will learn from data automatically.`;

      const mockAIResponse = JSON.stringify([
        {
          category: 'CLARITY',
          severity: 'medium',
          title: 'Vague terminology needs clarification',
          description: 'The term "AI" is too vague. Based on your idea definitions, you should specify whether you mean machine learning or a broader AI approach.',
          suggestions: ['Replace "AI" with "machine learning" if that\'s what you mean', 'Reference your machine learning definition'],
          location: {
            section: 'Introduction',
            context: 'We will use AI to solve problems'
          }
        }
      ]);

      vi.mocked(generateText).mockResolvedValue({
        text: mockAIResponse,
        finishReason: 'stop',
        usage: { promptTokens: 80, completionTokens: 150 }
      });

      const concerns = await analysisEngine.analyzeContent(testContent, mockIdeaDefinitions, mockConversationId);

      expect(concerns).toHaveLength(1);
      expect(concerns[0].description).toContain('Based on your idea definitions');
      expect(concerns[0].suggestions[1]).toContain('machine learning definition');
    });
  });

  describe('Terminology Consistency with Ideas', () => {
    it('should identify terminology inconsistencies using idea definitions', async () => {
      const testContent = `# Thesis Proposal

## Introduction
This research uses machine learning and ML techniques. We also employ artificial intelligence and AI methods.

## Methodology
Our supervised learning approach uses labeled data. We also use supervised ML with training datasets.`;

      // The analysis should identify that ML and machine learning are used inconsistently
      const concerns = await analysisEngine.analyzeContent(testContent, mockIdeaDefinitions, mockConversationId);

      // Should generate concerns about terminology consistency
      const terminologyConcerns = concerns.filter(c => c.category === ConcernCategory.TERMINOLOGY);
      expect(terminologyConcerns.length).toBeGreaterThan(0);
    });

    it('should suggest using defined terminology consistently', async () => {
      const testContent = `# Thesis Proposal

## Introduction
We use deep learning networks for pattern recognition.`;

      const mockAIResponse = JSON.stringify([
        {
          category: 'TERMINOLOGY',
          severity: 'low',
          title: 'Consider using defined terminology',
          description: 'You mention "deep learning networks" but have "Neural Networks" defined in your ideas. Consider using consistent terminology.',
          suggestions: ['Use "neural networks" as defined in your idea definitions', 'Clarify if deep learning networks are a specific type of neural network'],
          location: {
            section: 'Introduction',
            context: 'deep learning networks'
          }
        }
      ]);

      vi.mocked(generateText).mockResolvedValue({
        text: mockAIResponse,
        finishReason: 'stop',
        usage: { promptTokens: 90, completionTokens: 120 }
      });

      const concerns = await analysisEngine.analyzeContent(testContent, mockIdeaDefinitions, mockConversationId);

      expect(concerns).toHaveLength(1);
      expect(concerns[0].suggestions[0]).toContain('neural networks');
      expect(concerns[0].description).toContain('defined in your ideas');
    });
  });

  describe('Context-Aware Analysis', () => {
    it('should provide more specific feedback when idea definitions are available', async () => {
      const testContent = `# Thesis Proposal

## Introduction
This research will improve healthcare outcomes using computational methods.`;

      const mockAIResponseWithIdeas = JSON.stringify([
        {
          category: 'CLARITY',
          severity: 'medium',
          title: 'Specify computational methods',
          description: 'Based on your idea definitions, you likely mean machine learning or supervised learning. Be more specific about which computational methods you will use.',
          suggestions: ['Specify whether you mean machine learning, supervised learning, or neural networks', 'Reference your defined concepts'],
          location: {
            section: 'Introduction',
            context: 'computational methods'
          }
        }
      ]);

      vi.mocked(generateText).mockResolvedValue({
        text: mockAIResponseWithIdeas,
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 150 }
      });

      const concernsWithIdeas = await analysisEngine.analyzeContent(testContent, mockIdeaDefinitions, mockConversationId);

      expect(concernsWithIdeas).toHaveLength(1);
      expect(concernsWithIdeas[0].description).toContain('Based on your idea definitions');
      expect(concernsWithIdeas[0].suggestions[0]).toContain('machine learning, supervised learning, or neural networks');
    });

    it('should check alignment between content and defined ideas', async () => {
      const testContent = `# Thesis Proposal

## Introduction
This research uses unsupervised learning to classify medical images.`;

      const mockAIResponse = JSON.stringify([
        {
          category: 'CONSISTENCY',
          severity: 'high',
          title: 'Contradiction with defined concepts',
          description: 'You mention "unsupervised learning to classify" but your supervised learning definition indicates classification typically uses labeled data (supervised learning).',
          suggestions: ['Clarify if you mean supervised learning for classification', 'Explain how unsupervised learning will be used for classification', 'Review your supervised learning definition'],
          location: {
            section: 'Introduction',
            context: 'unsupervised learning to classify'
          }
        }
      ]);

      vi.mocked(generateText).mockResolvedValue({
        text: mockAIResponse,
        finishReason: 'stop',
        usage: { promptTokens: 120, completionTokens: 180 }
      });

      const concerns = await analysisEngine.analyzeContent(testContent, mockIdeaDefinitions, mockConversationId);

      expect(concerns).toHaveLength(1);
      expect(concerns[0].category).toBe(ConcernCategory.CONSISTENCY);
      expect(concerns[0].severity).toBe(ConcernSeverity.HIGH);
      expect(concerns[0].description).toContain('supervised learning definition');
    });
  });

  describe('Error Handling in Integration', () => {
    it('should handle AI service errors gracefully', async () => {
      const testContent = `# Thesis Proposal\n\nTest content.`;

      vi.mocked(generateText).mockRejectedValue(new Error('AI service error'));

      const concerns = await analysisEngine.analyzeContent(testContent, mockIdeaDefinitions, mockConversationId);

      // Should return other types of concerns even if AI analysis fails
      expect(Array.isArray(concerns)).toBe(true);
      // May have structure, style, or other non-AI concerns
    });

    it('should handle malformed AI responses', async () => {
      const testContent = `# Thesis Proposal\n\nTest content.`;

      vi.mocked(generateText).mockResolvedValue({
        text: 'Invalid JSON response',
        finishReason: 'stop',
        usage: { promptTokens: 50, completionTokens: 10 }
      });

      const concerns = await analysisEngine.analyzeContent(testContent, mockIdeaDefinitions, mockConversationId);

      // Should still return other types of concerns
      expect(Array.isArray(concerns)).toBe(true);
    });

    it('should handle empty idea definitions gracefully', async () => {
      const testContent = `# Thesis Proposal\n\nTest content with sufficient length for analysis.`;

      const mockAIResponse = JSON.stringify([
        {
          category: 'COMPLETENESS',
          severity: 'medium',
          title: 'Basic completeness issue',
          description: 'The content needs more development.',
          suggestions: ['Add more detailed content'],
          location: {
            section: 'Introduction',
            context: 'Test content'
          }
        }
      ]);

      vi.mocked(generateText).mockResolvedValue({
        text: mockAIResponse,
        finishReason: 'stop',
        usage: { promptTokens: 60, completionTokens: 80 }
      });

      const concerns = await analysisEngine.analyzeContent(testContent, [], mockConversationId);

      expect(concerns).toHaveLength(1);
      expect(concerns[0].category).toBe(ConcernCategory.COMPLETENESS);
    });
  });

  describe('Idea Definition Context Building', () => {
    it('should build proper context string from idea definitions', async () => {
      const testContent = `# Test Content\n\nSufficient content for analysis.`;

      vi.mocked(generateText).mockResolvedValue({
        text: JSON.stringify([]),
        finishReason: 'stop',
        usage: { promptTokens: 100, completionTokens: 50 }
      });

      await analysisEngine.analyzeContent(testContent, mockIdeaDefinitions, mockConversationId);

      const callArgs = vi.mocked(generateText).mock.calls[0][0];
      const prompt = callArgs.prompt;

      // Should include all idea definitions
      expect(prompt).toContain('**Machine Learning:**');
      expect(prompt).toContain('**Supervised Learning:**');
      expect(prompt).toContain('**Neural Networks:**');

      // Should include instructions for using the definitions
      expect(prompt).toContain('Use these definitions to:');
      expect(prompt).toContain('Check if the thesis content aligns');
      expect(prompt).toContain('Identify inconsistent use of terminology');
    });

    it('should handle special characters in idea definitions', async () => {
      const specialIdeas: IdeaDefinition[] = [
        {
          id: 1,
          title: 'AI/ML Systems',
          description: 'Systems that use artificial intelligence & machine learning (AI/ML) techniques.',
          conversationid: mockConversationId
        }
      ];

      const testContent = `# Test Content\n\nSufficient content for analysis.`;

      vi.mocked(generateText).mockResolvedValue({
        text: JSON.stringify([]),
        finishReason: 'stop',
        usage: { promptTokens: 80, completionTokens: 40 }
      });

      await analysisEngine.analyzeContent(testContent, specialIdeas, mockConversationId);

      const callArgs = vi.mocked(generateText).mock.calls[0][0];
      const prompt = callArgs.prompt;

      expect(prompt).toContain('**AI/ML Systems:**');
      expect(prompt).toContain('artificial intelligence & machine learning');
    });
  });
});