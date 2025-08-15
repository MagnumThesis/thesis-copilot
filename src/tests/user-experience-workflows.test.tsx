/**
 * User Experience Tests for Complete Workflows
 * Tests complete user workflows and experience scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
        placeholder="Start writing your thesis..."
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

// Mock toast notifications
const mockToast = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: mockToast,
    error: mockToast,
    info: mockToast,
    loading: mockToast
  }
}));

describe('User Experience Workflows Tests', () => {
  const mockConversation = { title: 'My Thesis Proposal', id: 'thesis-123' };
  
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        content: 'AI generated content for the user workflow'
      })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('First-Time User Experience', () => {
    it('should guide new users through AI features discovery', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // User sees the AI toolbar
      expect(screen.getByRole('toolbar', { name: /ai assistance modes/i })).toBeInTheDocument();
      
      // User hovers over buttons to see tooltips
      const promptButton = screen.getByTestId('ai-mode-prompt');
      await user.hover(promptButton);
      
      // Should see helpful tooltip
      await waitFor(() => {
        expect(screen.getByText(/generate content from a custom prompt/i)).toBeInTheDocument();
        expect(screen.getByText('Ctrl+P')).toBeInTheDocument();
      });

      // User tries each mode to understand functionality
      await user.click(promptButton);
      expect(screen.getByPlaceholderText(/enter your prompt/i)).toBeInTheDocument();

      await user.click(screen.getByTestId('ai-mode-continue'));
      expect(screen.queryByPlaceholderText(/enter your prompt/i)).not.toBeInTheDocument();

      // Modify mode should be disabled without selection
      const modifyButton = screen.getByTestId('ai-mode-modify');
      expect(modifyButton).toBeDisabled();
      
      await user.hover(modifyButton);
      await waitFor(() => {
        expect(screen.getByText(/requires text selection/i)).toBeInTheDocument();
      });
    });

    it('should provide clear onboarding for AI workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // User starts with empty document
      const editor = screen.getByTestId('editor-content');
      expect(editor).toHaveValue('');

      // User activates prompt mode
      await user.click(screen.getByTestId('ai-mode-prompt'));
      
      // Should see clear instructions
      expect(screen.getByPlaceholderText(/enter your prompt/i)).toBeInTheDocument();
      expect(screen.getByText(/describe what you want to generate/i)).toBeInTheDocument();

      // User enters their first prompt
      const promptInput = screen.getByPlaceholderText(/enter your prompt/i);
      await user.type(promptInput, 'Help me write an introduction for my machine learning thesis');

      // User submits
      await user.click(screen.getByText(/generate/i));

      // Should see processing feedback
      await waitFor(() => {
        expect(screen.getByText(/generating content/i)).toBeInTheDocument();
      });

      // Should see generated content with clear options
      await waitFor(() => {
        expect(screen.getByText(/ai generated content/i)).toBeInTheDocument();
        expect(screen.getByText(/insert/i)).toBeInTheDocument();
        expect(screen.getByText(/regenerate/i)).toBeInTheDocument();
        expect(screen.getByText(/discard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Thesis Writing Workflow', () => {
    it('should support complete thesis proposal creation workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      const editor = screen.getByTestId('editor-content');

      // Step 1: Generate title and abstract
      await user.click(screen.getByTestId('ai-mode-prompt'));
      await user.type(
        screen.getByPlaceholderText(/enter your prompt/i),
        'Create a title and abstract for a machine learning thesis about neural networks'
      );
      await user.click(screen.getByText(/generate/i));

      await waitFor(() => {
        expect(screen.getByText(/ai generated content/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/insert/i));

      // Verify content was inserted
      await waitFor(() => {
        expect(editor).toHaveValue(expect.stringContaining('AI generated content'));
      });

      // Step 2: Continue with introduction
      await user.click(editor);
      fireEvent.select(editor, { target: { selectionStart: editor.value.length, selectionEnd: editor.value.length } });

      await user.click(screen.getByTestId('ai-mode-continue'));

      await waitFor(() => {
        expect(screen.getByText(/continuing from cursor/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/ai generated content/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/insert/i));

      // Step 3: Add methodology section with prompt
      await user.click(screen.getByTestId('ai-mode-prompt'));
      await user.type(
        screen.getByPlaceholderText(/enter your prompt/i),
        'Add a methodology section explaining the research approach'
      );
      await user.click(screen.getByText(/generate/i));

      await waitFor(() => {
        expect(screen.getByText(/insert/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/insert/i));

      // Step 4: Improve a section with modify mode
      await user.type(editor, '\n\nThis section needs improvement for academic clarity.');
      
      // Select the text to modify
      fireEvent.select(editor, { 
        target: { 
          selectionStart: editor.value.length - 45,
          selectionEnd: editor.value.length,
          value: editor.value
        } 
      });

      await user.click(screen.getByTestId('ai-mode-modify'));
      await user.click(screen.getByText(/improve clarity/i));

      await waitFor(() => {
        expect(screen.getByText(/preview/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/apply/i));

      // Verify complete workflow
      expect(global.fetch).toHaveBeenCalledTimes(4); // 4 AI requests
      expect(editor.value.length).toBeGreaterThan(100); // Document has grown
    });

    it('should handle iterative refinement workflow', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      const editor = screen.getByTestId('editor-content');

      // Initial content generation
      await user.click(screen.getByTestId('ai-mode-prompt'));
      await user.type(
        screen.getByPlaceholderText(/enter your prompt/i),
        'Write a research question for my thesis'
      );
      await user.click(screen.getByText(/generate/i));

      await waitFor(() => {
        expect(screen.getByText(/regenerate/i)).toBeInTheDocument();
      });

      // User doesn't like first result, regenerates
      await user.click(screen.getByText(/regenerate/i));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      // User likes second result
      await user.click(screen.getByText(/insert/i));

      // User refines with modification
      fireEvent.select(editor, { 
        target: { 
          selectionStart: 0,
          selectionEnd: 50,
          value: editor.value
        } 
      });

      await user.click(screen.getByTestId('ai-mode-modify'));
      await user.click(screen.getByText(/rewrite/i));

      await waitFor(() => {
        expect(screen.getByText(/apply/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/apply/i));

      // User continues building on refined content
      await user.click(screen.getByTestId('ai-mode-continue'));

      await waitFor(() => {
        expect(screen.getByText(/insert/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/insert/i));

      // Verify iterative workflow
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Collaborative Writing Experience', () => {
    it('should support switching between manual and AI writing', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      const editor = screen.getByTestId('editor-content');

      // Manual writing
      await user.type(editor, '# My Thesis\n\nI am researching ');

      // AI continuation
      await user.click(screen.getByTestId('ai-mode-continue'));
      await waitFor(() => {
        expect(screen.getByText(/insert/i)).toBeInTheDocument();
      });
      await user.click(screen.getByText(/insert/i));

      // More manual writing
      await user.type(editor, '\n\nAdditionally, I want to explore ');

      // AI prompt for specific content
      await user.click(screen.getByTestId('ai-mode-prompt'));
      await user.type(
        screen.getByPlaceholderText(/enter your prompt/i),
        'Suggest three research objectives'
      );
      await user.click(screen.getByText(/generate/i));
      await waitFor(() => {
        expect(screen.getByText(/insert/i)).toBeInTheDocument();
      });
      await user.click(screen.getByText(/insert/i));

      // Manual editing of AI content
      const currentContent = editor.value;
      await user.clear(editor);
      await user.type(editor, currentContent + '\n\nMy own conclusions...');

      // Verify seamless integration
      expect(editor.value).toContain('My Thesis');
      expect(editor.value).toContain('AI generated content');
      expect(editor.value).toContain('My own conclusions');
    });

    it('should maintain document coherence across AI operations', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      const editor = screen.getByTestId('editor-content');

      // Start with structured content
      await user.type(editor, `# Thesis: Advanced Machine Learning
      
## Abstract
This thesis explores...

## Introduction
Machine learning has revolutionized...

## Literature Review
`);

      // Continue literature review
      fireEvent.select(editor, { target: { selectionStart: editor.value.length, selectionEnd: editor.value.length } });
      await user.click(screen.getByTestId('ai-mode-continue'));
      await waitFor(() => {
        expect(screen.getByText(/insert/i)).toBeInTheDocument();
      });
      await user.click(screen.getByText(/insert/i));

      // Add methodology with prompt
      await user.click(screen.getByTestId('ai-mode-prompt'));
      await user.type(
        screen.getByPlaceholderText(/enter your prompt/i),
        'Add a methodology section that follows from the literature review'
      );
      await user.click(screen.getByText(/generate/i));
      await waitFor(() => {
        expect(screen.getByText(/insert/i)).toBeInTheDocument();
      });
      await user.click(screen.getByText(/insert/i));

      // Verify document structure is maintained
      expect(editor.value).toContain('# Thesis: Advanced Machine Learning');
      expect(editor.value).toContain('## Abstract');
      expect(editor.value).toContain('## Introduction');
      expect(editor.value).toContain('## Literature Review');
      
      // AI should have maintained academic tone and structure
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/builder/ai/continue'),
        expect.objectContaining({
          body: expect.stringContaining('Machine learning has revolutionized')
        })
      );
    });
  });

  describe('Error Recovery Experience', () => {
    it('should provide graceful error recovery for users', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // User tries to generate content
      await user.click(screen.getByTestId('ai-mode-prompt'));
      await user.type(
        screen.getByPlaceholderText(/enter your prompt/i),
        'Generate introduction'
      );
      await user.click(screen.getByText(/generate/i));

      // User sees error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });

      // Mock successful retry
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          content: 'Retry successful content'
        })
      });

      // User retries
      await user.click(screen.getByText(/retry/i));

      // User sees success
      await waitFor(() => {
        expect(screen.getByText(/retry successful content/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/insert/i));

      // Verify recovery
      const editor = screen.getByTestId('editor-content');
      await waitFor(() => {
        expect(editor).toHaveValue(expect.stringContaining('Retry successful content'));
      });
    });

    it('should handle partial failures gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      const editor = screen.getByTestId('editor-content');

      // Successful operation
      await user.click(screen.getByTestId('ai-mode-prompt'));
      await user.type(
        screen.getByPlaceholderText(/enter your prompt/i),
        'Generate title'
      );
      await user.click(screen.getByText(/generate/i));
      await waitFor(() => {
        expect(screen.getByText(/insert/i)).toBeInTheDocument();
      });
      await user.click(screen.getByText(/insert/i));

      // Failed operation
      (global.fetch as any).mockRejectedValueOnce(new Error('Service temporarily unavailable'));

      await user.click(screen.getByTestId('ai-mode-continue'));
      
      await waitFor(() => {
        expect(screen.getByText(/service temporarily unavailable/i)).toBeInTheDocument();
      });

      // User can continue working manually
      await user.type(editor, '\n\nI can continue writing manually while the service recovers.');

      // Service recovers
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          content: 'Service recovered content'
        })
      });

      // User tries AI again
      await user.click(screen.getByTestId('ai-mode-prompt'));
      await user.type(
        screen.getByPlaceholderText(/enter your prompt/i),
        'Add conclusion'
      );
      await user.click(screen.getByText(/generate/i));

      await waitFor(() => {
        expect(screen.getByText(/service recovered content/i)).toBeInTheDocument();
      });

      // Verify partial failure didn't break workflow
      expect(editor.value).toContain('AI generated content');
      expect(editor.value).toContain('continue writing manually');
    });
  });

  describe('Performance and Responsiveness Experience', () => {
    it('should provide responsive feedback during AI operations', async () => {
      const user = userEvent.setup();
      
      // Mock slow API response
      (global.fetch as any).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              content: 'Slow response content'
            })
          }), 1000)
        )
      );

      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // User starts AI operation
      await user.click(screen.getByTestId('ai-mode-prompt'));
      await user.type(
        screen.getByPlaceholderText(/enter your prompt/i),
        'Generate content'
      );
      await user.click(screen.getByText(/generate/i));

      // Should see immediate feedback
      expect(screen.getByText(/generating/i)).toBeInTheDocument();
      
      // Buttons should be disabled during processing
      expect(screen.getByTestId('ai-mode-prompt')).toBeDisabled();
      expect(screen.getByTestId('ai-mode-continue')).toBeDisabled();
      expect(screen.getByTestId('ai-mode-modify')).toBeDisabled();

      // Should see processing indicator
      expect(screen.getByText(/processing/i)).toBeInTheDocument();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/slow response content/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Buttons should be re-enabled
      expect(screen.getByTestId('ai-mode-prompt')).not.toBeDisabled();
    });

    it('should handle large documents efficiently', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      const editor = screen.getByTestId('editor-content');

      // Create large document
      const largeContent = `# Large Thesis Document

## Introduction
${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100)}

## Literature Review
${'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. '.repeat(100)}

## Methodology
${'Ut enim ad minim veniam, quis nostrud exercitation ullamco. '.repeat(100)}

## Results
${'Duis aute irure dolor in reprehenderit in voluptate velit esse. '.repeat(100)}
`;

      await user.type(editor, largeContent);

      // AI operations should still work efficiently
      const startTime = performance.now();
      
      await user.click(screen.getByTestId('ai-mode-continue'));
      
      await waitFor(() => {
        expect(screen.getByText(/insert/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      // Should complete within reasonable time
      expect(operationTime).toBeLessThan(5000); // 5 seconds

      await user.click(screen.getByText(/insert/i));

      // Document should still be responsive
      expect(editor.value.length).toBeGreaterThan(largeContent.length);
    });
  });

  describe('Accessibility Experience', () => {
    it('should provide accessible AI workflow for keyboard users', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Navigate with keyboard
      await user.tab(); // Focus first element
      await user.tab(); // Focus AI toolbar
      
      // Should be able to navigate toolbar with arrows
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowRight}');
      
      // Activate with Enter
      await user.keyboard('{Enter}');
      
      // Should be able to use prompt mode with keyboard
      const promptInput = screen.getByPlaceholderText(/enter your prompt/i);
      expect(promptInput).toHaveFocus();
      
      await user.type(promptInput, 'Keyboard accessible prompt');
      await user.keyboard('{Tab}'); // Navigate to generate button
      await user.keyboard('{Enter}'); // Activate generate
      
      await waitFor(() => {
        expect(screen.getByText(/ai generated content/i)).toBeInTheDocument();
      });
      
      // Should be able to navigate and activate insert
      await user.keyboard('{Tab}');
      await user.keyboard('{Enter}');
      
      // Verify content was inserted
      const editor = screen.getByTestId('editor-content');
      await waitFor(() => {
        expect(editor).toHaveValue(expect.stringContaining('AI generated content'));
      });
    });

    it('should provide screen reader friendly experience', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Screen reader should understand toolbar
      const toolbar = screen.getByRole('toolbar', { name: /ai assistance modes/i });
      expect(toolbar).toBeInTheDocument();

      // Buttons should have proper labels
      expect(screen.getByRole('button', { name: /prompt mode/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue mode/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /modify mode.*disabled/i })).toBeInTheDocument();

      // Activate prompt mode
      await user.click(screen.getByRole('button', { name: /prompt mode/i }));

      // Should announce state change
      expect(screen.getByRole('button', { name: /prompt mode.*active/i })).toBeInTheDocument();

      // Input should be properly labeled
      const promptInput = screen.getByLabelText(/enter your prompt/i);
      expect(promptInput).toBeInTheDocument();

      await user.type(promptInput, 'Screen reader test');
      await user.click(screen.getByRole('button', { name: /generate/i }));

      // Processing state should be announced
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /prompt mode.*processing/i })).toBeInTheDocument();
      });

      // Results should be accessible
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /insert/i })).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Experience', () => {
    it('should work well on mobile devices', async () => {
      const user = userEvent.setup();
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });

      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Touch targets should be adequate
      const buttons = [
        screen.getByTestId('ai-mode-prompt'),
        screen.getByTestId('ai-mode-continue'),
        screen.getByTestId('ai-mode-modify')
      ];

      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        // Should have adequate touch target size
        expect(button).toHaveClass('h-10'); // Minimum touch target
      });

      // Should work with touch interactions
      await user.click(screen.getByTestId('ai-mode-prompt'));
      
      const promptInput = screen.getByPlaceholderText(/enter your prompt/i);
      await user.type(promptInput, 'Mobile test prompt');
      
      await user.click(screen.getByText(/generate/i));
      
      await waitFor(() => {
        expect(screen.getByText(/ai generated content/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/insert/i));

      // Should work smoothly on mobile
      const editor = screen.getByTestId('editor-content');
      await waitFor(() => {
        expect(editor).toHaveValue(expect.stringContaining('AI generated content'));
      });
    });
  });

  describe('User Satisfaction Metrics', () => {
    it('should complete typical workflows within acceptable time', async () => {
      const user = userEvent.setup();
      
      const startTime = performance.now();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Complete typical workflow
      await user.click(screen.getByTestId('ai-mode-prompt'));
      await user.type(
        screen.getByPlaceholderText(/enter your prompt/i),
        'Generate thesis introduction'
      );
      await user.click(screen.getByText(/generate/i));
      
      await waitFor(() => {
        expect(screen.getByText(/insert/i)).toBeInTheDocument();
      });
      
      await user.click(screen.getByText(/insert/i));
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete within user expectation (< 10 seconds)
      expect(totalTime).toBeLessThan(10000);
      
      console.log(`Typical workflow completed in ${totalTime.toFixed(2)}ms`);
    });

    it('should minimize user friction in common tasks', async () => {
      const user = userEvent.setup();
      
      render(
        <Builder
          isOpen={true}
          onClose={vi.fn()}
          currentConversation={mockConversation}
        />
      );

      // Count user interactions needed for common task
      let interactionCount = 0;
      
      const countedClick = async (element: HTMLElement) => {
        interactionCount++;
        await user.click(element);
      };

      const countedType = async (element: HTMLElement, text: string) => {
        interactionCount++;
        await user.type(element, text);
      };

      // Generate content task
      await countedClick(screen.getByTestId('ai-mode-prompt'));
      await countedType(screen.getByPlaceholderText(/enter your prompt/i), 'Generate content');
      await countedClick(screen.getByText(/generate/i));
      
      await waitFor(() => {
        expect(screen.getByText(/insert/i)).toBeInTheDocument();
      });
      
      await countedClick(screen.getByText(/insert/i));

      // Should require minimal interactions (≤ 4 for basic task)
      expect(interactionCount).toBeLessThanOrEqual(4);
      
      console.log(`Content generation required ${interactionCount} user interactions`);
    });
  });
});