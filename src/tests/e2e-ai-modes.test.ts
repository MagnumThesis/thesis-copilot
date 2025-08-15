/**
 * End-to-End Tests for All AI Modes
 * Comprehensive testing of prompt, continue, and modify modes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Builder } from '@/components/ui/builder';
import { AIMode, ModificationType } from '@/lib/ai-types';

// Mock dependencies
vi.mock('@/hooks/use-ai-mode-manager', () => ({
  useAIModeManager: () => ({
    currentMode: AIMode.NONE,
    setMode: vi.fn(),
    processPrompt: vi.fn(),
    processContinue: vi.fn(),
    processModify: vi.fn(),
    isProcessing: false,
    hasSelectedText: false,
    selectedText: '',
    cursorPosition: 0
  })
}));

vi.mock('@/components/ui/milkdown-editor', () => ({
  MilkdownEditor: ({ onContentChange, onSelectionChange, onCursorPositionChange }: any) => (
    <div data-testid="milkdown-editor">
      <textarea
        data-testid="editor-content"
        onChange={(e) => onContentChange?.(e.target.value)}
        onSelect={(e) => {
          const target = e.target as HTMLTextAreaElement;
          onSelectionChange?.({
            start: target.selectionStart,
            end: target.selectionEnd,
            text: target.value.substring(target.selectionStart, target.selectionEnd)
          });
          onCursorPositionChange?.(target.selectionStart);
        }}
      />
    </div>
  )
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('End-to-End AI Modes Tests', () => {
  const mockConversation = { title: 'Test Conversation', id: 'test-id' };
  
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        content: 'AI generated content'
      })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Prompt Mode E2E Workflow', () => {
    it('should complete full prompt mode workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Step 1: Activate prompt mode
      const promptButton = screen.getByTestId('ai-mode-prompt');
      await user.click(promptButton);

      // Step 2: Enter prompt
      const promptInput = screen.getByPlaceholderText(/enter your prompt/i);
      await user.type(promptInput, 'Write an introduction for my thesis');

      // Step 3: Submit prompt
      const submitButton = screen.getByText(/generate/i);
      await user.click(submitButton);

      // Step 4: Wait for AI response
      await waitFor(() => {
        expect(screen.getByText(/processing/i)).toBeInTheDocument();
      });

      // Step 5: Verify content preview
      await waitFor(() => {
        expect(screen.getByText(/ai generated content/i)).toBeInTheDocument();
      });

      // Step 6: Accept generated content
      const acceptButton = screen.getByText(/insert/i);
      await user.click(acceptButton);

      // Step 7: Verify content inserted into editor
      await waitFor(() => {
        const editor = screen.getByTestId('editor-content');
        expect(editor).toHaveValue(expect.stringContaining('AI generated content'));
      });

      // Verify API was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/builder/ai/prompt'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Write an introduction for my thesis')
        })
      );
    });

    it('should handle prompt mode errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: 'AI service unavailable'
        })
      });

      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Activate prompt mode and submit
      await user.click(screen.getByTestId('ai-mode-prompt'));
      await user.type(screen.getByPlaceholderText(/enter your prompt/i), 'Test prompt');
      await user.click(screen.getByText(/generate/i));

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/ai service unavailable/i)).toBeInTheDocument();
      });

      // Verify retry option is available
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });

    it('should validate prompt input', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Activate prompt mode
      await user.click(screen.getByTestId('ai-mode-prompt'));

      // Try to submit empty prompt
      const submitButton = screen.getByText(/generate/i);
      await user.click(submitButton);

      // Verify validation message
      expect(screen.getByText(/please enter a prompt/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Continue Mode E2E Workflow', () => {
    it('should complete full continue mode workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Step 1: Add some content to editor
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, 'This is the beginning of my thesis introduction.');

      // Step 2: Position cursor at end
      await user.click(editor);
      fireEvent.select(editor, { target: { selectionStart: 45, selectionEnd: 45 } });

      // Step 3: Activate continue mode
      await user.click(screen.getByTestId('ai-mode-continue'));

      // Step 4: AI should automatically start generating
      await waitFor(() => {
        expect(screen.getByText(/continuing from cursor/i)).toBeInTheDocument();
      });

      // Step 5: Wait for AI response
      await waitFor(() => {
        expect(screen.getByText(/ai generated content/i)).toBeInTheDocument();
      });

      // Step 6: Accept continuation
      await user.click(screen.getByText(/insert/i));

      // Step 7: Verify content appended
      await waitFor(() => {
        expect(editor).toHaveValue(expect.stringContaining('This is the beginning of my thesis introduction.AI generated content'));
      });

      // Verify API was called with context
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/builder/ai/continue'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('This is the beginning of my thesis introduction.')
        })
      );
    });

    it('should handle insufficient context gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API response for insufficient context
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: false,
          error: 'Insufficient context for continuation',
          requiresPrompt: true
        })
      });

      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Try continue mode with minimal content
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, 'Hi');
      await user.click(screen.getByTestId('ai-mode-continue'));

      // Verify fallback to prompt mode
      await waitFor(() => {
        expect(screen.getByText(/please provide more context/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/enter additional context/i)).toBeInTheDocument();
      });
    });
  });

  describe('Modify Mode E2E Workflow', () => {
    it('should complete full modify mode workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Step 1: Add content to editor
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, 'This sentence needs improvement for clarity and academic tone.');

      // Step 2: Select text to modify
      fireEvent.select(editor, { 
        target: { 
          selectionStart: 0, 
          selectionEnd: 30,
          value: 'This sentence needs improvement for clarity and academic tone.'
        } 
      });

      // Step 3: Activate modify mode
      await user.click(screen.getByTestId('ai-mode-modify'));

      // Step 4: Choose modification type
      await user.click(screen.getByText(/improve clarity/i));

      // Step 5: Wait for AI response
      await waitFor(() => {
        expect(screen.getByText(/ai generated content/i)).toBeInTheDocument();
      });

      // Step 6: Preview changes
      expect(screen.getByText(/preview/i)).toBeInTheDocument();
      expect(screen.getByText(/original/i)).toBeInTheDocument();

      // Step 7: Apply modification
      await user.click(screen.getByText(/apply/i));

      // Step 8: Verify text replaced
      await waitFor(() => {
        expect(editor).toHaveValue(expect.stringContaining('AI generated content'));
      });

      // Verify API was called with selected text
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/builder/ai/modify'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('This sentence needs improvement')
        })
      );
    });

    it('should handle all modification types', async () => {
      const user = userEvent.setup();
      const modificationTypes = [
        { label: 'Rewrite', type: ModificationType.REWRITE },
        { label: 'Expand', type: ModificationType.EXPAND },
        { label: 'Summarize', type: ModificationType.SUMMARIZE },
        { label: 'Improve Clarity', type: ModificationType.IMPROVE_CLARITY }
      ];

      for (const { label, type } of modificationTypes) {
        render(
          <Builder
            isOpen={true}
            onClose={vi.fn()}
            currentConversation={mockConversation}
          />
        );

        // Add and select content
        const editor = screen.getByTestId('editor-content');
        await user.type(editor, 'Test content for modification');
        fireEvent.select(editor, { 
          target: { selectionStart: 0, selectionEnd: 26 } 
        });

        // Activate modify mode and select type
        await user.click(screen.getByTestId('ai-mode-modify'));
        await user.click(screen.getByText(label));

        // Verify API called with correct type
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/builder/ai/modify'),
            expect.objectContaining({
              body: expect.stringContaining(`"modificationType":"${type}"`)
            })
          );
        });

        // Clean up for next iteration
        vi.clearAllMocks();
      }
    });

    it('should disable modify mode when no text selected', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Verify modify button is disabled initially
      const modifyButton = screen.getByTestId('ai-mode-modify');
      expect(modifyButton).toBeDisabled();

      // Add content but don't select
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, 'Some content');

      // Modify button should still be disabled
      expect(modifyButton).toBeDisabled();

      // Select text
      fireEvent.select(editor, { 
        target: { selectionStart: 0, selectionEnd: 12 } 
      });

      // Now modify button should be enabled
      await waitFor(() => {
        expect(modifyButton).not.toBeDisabled();
      });
    });
  });

  describe('Mode Transitions E2E', () => {
    it('should handle smooth transitions between modes', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Start with prompt mode
      await user.click(screen.getByTestId('ai-mode-prompt'));
      expect(screen.getByPlaceholderText(/enter your prompt/i)).toBeInTheDocument();

      // Switch to continue mode
      await user.click(screen.getByTestId('ai-mode-continue'));
      expect(screen.queryByPlaceholderText(/enter your prompt/i)).not.toBeInTheDocument();

      // Add content and select for modify mode
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, 'Test content');
      fireEvent.select(editor, { target: { selectionStart: 0, selectionEnd: 12 } });

      // Switch to modify mode
      await user.click(screen.getByTestId('ai-mode-modify'));
      expect(screen.getByText(/choose modification type/i)).toBeInTheDocument();

      // Exit all modes
      await user.click(screen.getByTestId('ai-mode-modify')); // Toggle off
      expect(screen.queryByText(/choose modification type/i)).not.toBeInTheDocument();
    });

    it('should preserve document state during mode transitions', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Add content
      const editor = screen.getByTestId('editor-content');
      const testContent = 'This content should be preserved during mode transitions.';
      await user.type(editor, testContent);

      // Switch between modes
      await user.click(screen.getByTestId('ai-mode-prompt'));
      await user.click(screen.getByTestId('ai-mode-continue'));
      await user.click(screen.getByTestId('ai-mode-prompt'));

      // Verify content is preserved
      expect(editor).toHaveValue(testContent);
    });
  });

  describe('Error Recovery E2E', () => {
    it('should recover from network errors', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Try prompt mode
      await user.click(screen.getByTestId('ai-mode-prompt'));
      await user.type(screen.getByPlaceholderText(/enter your prompt/i), 'Test prompt');
      await user.click(screen.getByText(/generate/i));

      // Verify error message and retry option
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });

      // Mock successful retry
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          content: 'Retry successful'
        })
      });

      // Retry
      await user.click(screen.getByText(/retry/i));

      // Verify success
      await waitFor(() => {
        expect(screen.getByText(/retry successful/i)).toBeInTheDocument();
      });
    });

    it('should handle AI service rate limiting', async () => {
      const user = userEvent.setup();
      
      // Mock rate limit error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          success: false,
          error: 'Rate limit exceeded. Please try again in 60 seconds.'
        })
      });

      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Trigger rate limit
      await user.click(screen.getByTestId('ai-mode-prompt'));
      await user.type(screen.getByPlaceholderText(/enter your prompt/i), 'Test prompt');
      await user.click(screen.getByText(/generate/i));

      // Verify rate limit message
      await waitFor(() => {
        expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
        expect(screen.getByText(/try again in 60 seconds/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance E2E', () => {
    it('should handle large documents efficiently', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Create large document content
      const largeContent = 'Lorem ipsum dolor sit amet. '.repeat(1000); // ~27KB
      const editor = screen.getByTestId('editor-content');
      
      // Measure performance
      const startTime = performance.now();
      await user.type(editor, largeContent);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Test AI operations with large content
      await user.click(screen.getByTestId('ai-mode-continue'));

      // Should handle large context efficiently
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      }, { timeout: 10000 });
    });

    it('should debounce rapid mode changes', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Rapidly switch modes
      const promptButton = screen.getByTestId('ai-mode-prompt');
      const continueButton = screen.getByTestId('ai-mode-continue');

      await user.click(promptButton);
      await user.click(continueButton);
      await user.click(promptButton);
      await user.click(continueButton);

      // Should handle rapid changes without issues
      expect(screen.getByTestId('ai-action-toolbar')).toBeInTheDocument();
    });
  });
});