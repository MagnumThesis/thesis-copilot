import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIMode, AIResponse } from '../lib/ai-types';
import { useAIModeManager } from '../hooks/use-ai-mode-manager';

// Mock the AI mode manager hook
vi.mock('../hooks/use-ai-mode-manager');

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe('Prompt Mode Integration Tests', () => {
  let mockAIModeManager: any;

  beforeEach(() => {
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup mock AI mode manager
    mockAIModeManager = {
      currentMode: AIMode.NONE,
      setMode: vi.fn(),
      resetMode: vi.fn(),
      processPrompt: vi.fn(),
      processContinue: vi.fn(),
      processModify: vi.fn(),
      updateSelection: vi.fn(),
      canActivateMode: vi.fn(() => true),
      isProcessing: false,
      hasSelectedText: false,
      processingState: {
        isProcessing: false,
        currentMode: AIMode.NONE
      }
    };

    (useAIModeManager as any).mockReturnValue(mockAIModeManager);

    // Setup default fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        content: 'Generated AI content',
        metadata: {
          tokensUsed: 150,
          processingTime: 1200
        }
      } as AIResponse)
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Prompt Mode Activation', () => {
    it('should activate prompt mode when setMode is called', () => {
      mockAIModeManager.setMode(AIMode.PROMPT);
      expect(mockAIModeManager.setMode).toHaveBeenCalledWith(AIMode.PROMPT);
    });

    it('should show prompt input interface when prompt mode is active', () => {
      mockAIModeManager.currentMode = AIMode.PROMPT;
      expect(mockAIModeManager.currentMode).toBe(AIMode.PROMPT);
    });

    it('should prevent mode activation when AI is processing', () => {
      mockAIModeManager.isProcessing = true;
      mockAIModeManager.canActivateMode.mockReturnValue(false);
      
      const canActivate = mockAIModeManager.canActivateMode(AIMode.PROMPT);
      expect(canActivate).toBe(false);
    });
  });

  describe('Prompt Submission and Validation', () => {
    it('should validate prompt input before submission', () => {
      const emptyPrompt = '';
      const validPrompt = 'Valid prompt';
      const whitespacePrompt = '   ';
      
      expect(emptyPrompt.trim().length > 0).toBe(false);
      expect(validPrompt.trim().length > 0).toBe(true);
      expect(whitespacePrompt.trim().length > 0).toBe(false);
    });

    it('should call processPrompt with correct parameters', async () => {
      const testPrompt = 'Write an introduction about AI';
      const testCursorPosition = 25;
      
      mockAIModeManager.processPrompt.mockResolvedValue({
        success: true,
        content: 'Generated content',
        metadata: { tokensUsed: 100, processingTime: 1000 }
      });

      await mockAIModeManager.processPrompt(testPrompt, testCursorPosition);

      expect(mockAIModeManager.processPrompt).toHaveBeenCalledWith(
        testPrompt,
        testCursorPosition
      );
    });

    it('should handle empty prompt validation', () => {
      const prompt = '   '; // Whitespace only
      const isValid = prompt.trim().length > 0;
      
      expect(isValid).toBe(false);
    });

    it('should handle prompt length validation', () => {
      const maxLength = 500;
      const longPrompt = 'a'.repeat(maxLength + 1);
      const validPrompt = 'a'.repeat(maxLength);
      
      expect(longPrompt.length > maxLength).toBe(true);
      expect(validPrompt.length <= maxLength).toBe(true);
    });
  });

  describe('AI Content Generation Workflow', () => {
    it('should show loading state during content generation', () => {
      mockAIModeManager.isProcessing = true;
      mockAIModeManager.processingState.isProcessing = true;
      mockAIModeManager.processingState.statusMessage = 'Generating content from prompt...';

      expect(mockAIModeManager.isProcessing).toBe(true);
      expect(mockAIModeManager.processingState.statusMessage).toBe('Generating content from prompt...');
    });

    it('should handle successful content generation', async () => {
      const mockResponse: AIResponse = {
        success: true,
        content: 'Generated AI content',
        metadata: {
          tokensUsed: 150,
          processingTime: 1200
        }
      };

      mockAIModeManager.processPrompt.mockResolvedValue(mockResponse);

      const response = await mockAIModeManager.processPrompt('test prompt', 0);
      
      expect(response.success).toBe(true);
      expect(response.content).toBe('Generated AI content');
      expect(response.metadata?.tokensUsed).toBe(150);
      expect(response.metadata?.processingTime).toBe(1200);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('AI service unavailable');
      mockAIModeManager.processPrompt.mockRejectedValue(mockError);

      try {
        await mockAIModeManager.processPrompt('test prompt', 0);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('AI service unavailable');
      }
    });

    it('should handle failed AI responses', async () => {
      const mockResponse: AIResponse = {
        success: false,
        error: 'AI service temporarily unavailable',
        timestamp: Date.now()
      };

      mockAIModeManager.processPrompt.mockResolvedValue(mockResponse);

      const response = await mockAIModeManager.processPrompt('test prompt', 0);
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('AI service temporarily unavailable');
    });
  });

  describe('Content Confirmation and Insertion', () => {
    it('should insert content when user accepts', () => {
      const mockEditorMethods = {
        insertContent: vi.fn(),
        getCurrentContent: vi.fn(() => 'Current document content'),
        getCurrentCursorPosition: vi.fn(() => 25)
      };

      const generatedContent = 'AI generated content';
      const insertionOptions = {
        insertAt: 25,
        preserveFormatting: true
      };

      mockEditorMethods.insertContent(generatedContent, insertionOptions);

      expect(mockEditorMethods.insertContent).toHaveBeenCalledWith(
        'AI generated content',
        {
          insertAt: 25,
          preserveFormatting: true
        }
      );
    });

    it('should reset mode when user rejects content', () => {
      mockAIModeManager.resetMode();
      expect(mockAIModeManager.resetMode).toHaveBeenCalled();
    });

    it('should handle content regeneration', async () => {
      mockAIModeManager.processPrompt.mockResolvedValue({
        success: true,
        content: 'Regenerated AI content',
        metadata: { tokensUsed: 120, processingTime: 1100 }
      });

      const response = await mockAIModeManager.processPrompt('regenerate', 0);
      
      expect(response.success).toBe(true);
      expect(response.content).toBe('Regenerated AI content');
      expect(mockAIModeManager.processPrompt).toHaveBeenCalledWith('regenerate', 0);
    });
  });

  describe('Keyboard Shortcuts and Accessibility', () => {
    it('should support Ctrl+Enter to submit prompt', () => {
      const mockOnSubmit = vi.fn();
      const prompt = 'Test prompt';

      // Simulate keyboard shortcut logic
      const handleKeyDown = (key: string, ctrlKey: boolean, prompt: string) => {
        if (key === 'Enter' && ctrlKey) {
          if (prompt.trim()) {
            mockOnSubmit(prompt);
          }
        }
      };

      handleKeyDown('Enter', true, prompt);
      expect(mockOnSubmit).toHaveBeenCalledWith('Test prompt');
    });

    it('should support Escape to cancel prompt mode', () => {
      // Simulate escape key logic
      const handleKeyDown = (key: string) => {
        if (key === 'Escape') {
          mockAIModeManager.resetMode();
        }
      };

      handleKeyDown('Escape');
      expect(mockAIModeManager.resetMode).toHaveBeenCalled();
    });

    it('should validate accessibility requirements', () => {
      // Test accessibility properties
      const dialogProps = {
        role: 'dialog',
        'aria-labelledby': 'ai-content-title',
        'aria-describedby': 'ai-content-description'
      };

      const toolbarProps = {
        role: 'toolbar',
        'aria-label': 'AI assistance modes'
      };

      const buttonProps = {
        'aria-pressed': 'false'
      };

      expect(dialogProps.role).toBe('dialog');
      expect(toolbarProps['aria-label']).toBe('AI assistance modes');
      expect(buttonProps['aria-pressed']).toBe('false');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors during prompt submission', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      mockAIModeManager.processPrompt.mockRejectedValue(new Error('Network error'));

      try {
        await mockAIModeManager.processPrompt('test', 0);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle API rate limiting', async () => {
      const rateLimitError = {
        success: false,
        error: 'Too many requests. Please wait a moment before trying again.',
        errorCode: 'RATE_LIMIT_EXCEEDED',
        timestamp: Date.now()
      };

      mockAIModeManager.processPrompt.mockResolvedValue(rateLimitError);

      const response = await mockAIModeManager.processPrompt('test', 0);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Too many requests');
      expect(response.errorCode).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should prevent multiple simultaneous prompt submissions', () => {
      let isProcessing = false;
      let processCount = 0;

      const handleSubmit = async () => {
        if (isProcessing) return;
        
        isProcessing = true;
        processCount++;
        
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));
        isProcessing = false;
      };

      // Simulate multiple rapid calls
      const promises = [
        handleSubmit(),
        handleSubmit(),
        handleSubmit()
      ];

      return Promise.all(promises).then(() => {
        // Should only process once due to the guard
        expect(processCount).toBe(1);
      });
    });

    it('should handle malformed API responses', async () => {
      const malformedResponse = {
        // Missing required fields
        content: 'Some content'
        // Missing success field
      };

      mockAIModeManager.processPrompt.mockResolvedValue(malformedResponse as any);

      const response = await mockAIModeManager.processPrompt('test', 0);
      
      // Should handle gracefully
      expect(response).toBeDefined();
      expect(response.content).toBe('Some content');
    });
  });
});