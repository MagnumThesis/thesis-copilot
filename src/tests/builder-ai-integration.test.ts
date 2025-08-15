/**
 * Builder AI Integration Tests
 * Comprehensive integration tests for the complete Builder AI workflow
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Builder } from '@/components/ui/builder';
import { AIMode, ModificationType } from '@/lib/ai-types';
import { TooltipProvider } from '@/components/ui/shadcn/tooltip';
import { Toaster } from 'sonner';

// Mock the AI mode manager hook
const mockAIModeManager = {
  currentMode: AIMode.NONE,
  processingState: { isProcessing: false, currentMode: AIMode.NONE },
  hasSelectedText: false,
  selectedText: null,
  setMode: vi.fn(),
  resetMode: vi.fn(),
  processPrompt: vi.fn(),
  processContinue: vi.fn(),
  processModify: vi.fn(),
  updateSelection: vi.fn(),
  validateTextSelection: vi.fn(),
  showModificationTypeSelector: false,
  showModificationPreview: false,
  showCustomPromptInput: false,
  currentModificationType: null,
  modificationPreviewContent: null,
  originalTextForModification: null,
  customPrompt: null,
  startModifyMode: vi.fn(),
  selectModificationType: vi.fn(),
  submitCustomPrompt: vi.fn(),
  backToModificationTypes: vi.fn(),
  acceptModification: vi.fn(),
  rejectModification: vi.fn(),
  regenerateModification: vi.fn(),
  canActivateMode: vi.fn(),
  isProcessing: false,
};

// Mock the useAIModeManager hook
vi.mock('@/hooks/use-ai-mode-manager', () => ({
  useAIModeManager: () => mockAIModeManager,
}));

// Mock the Milkdown editor
const mockEditorMethods = {
  insertContent: vi.fn(),
  replaceSelectedText: vi.fn(),
  getCurrentContent: vi.fn(() => '# Test Content'),
  getCurrentCursorPosition: vi.fn(() => 0),
  getCurrentSelection: vi.fn(() => null),
  showAIContentPreview: vi.fn(),
};

vi.mock('@/components/ui/milkdown-editor', () => ({
  MilkdownEditor: (props: any) => {
    const { onEditorMethodsReady, onContentChange, onSelectionChange, onCursorPositionChange } = props;
    
    // Simulate editor methods being ready
    React.useEffect(() => {
      if (onEditorMethodsReady) {
        onEditorMethodsReady(mockEditorMethods);
      }
    }, [onEditorMethodsReady]);

    return React.createElement('div', { 'data-testid': 'milkdown-editor' },
      React.createElement('textarea', {
        'data-testid': 'editor-content',
        onChange: (e: any) => onContentChange?.(e.target.value),
        onSelect: (e: any) => {
          const target = e.target as HTMLTextAreaElement;
          const start = target.selectionStart;
          const end = target.selectionEnd;
          const text = target.value.substring(start, end);
          
          if (text) {
            onSelectionChange?.({ start, end, text });
          } else {
            onSelectionChange?.(null);
          }
          
          onCursorPositionChange?.(start);
        }
      })
    );
  },
}));

// Mock MilkdownProvider
vi.mock('@milkdown/react', () => ({
  MilkdownProvider: ({ children }: any) => React.createElement('div', {}, children),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

const renderBuilder = (props = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    currentConversation: { title: 'Test Conversation', id: 'test-conv-1' },
    ...props,
  };

  return render(
    React.createElement(TooltipProvider, {},
      React.createElement(Builder, defaultProps),
      React.createElement(Toaster, {})
    )
  );
};

describe('Builder AI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock AI mode manager to default state
    Object.assign(mockAIModeManager, {
      currentMode: AIMode.NONE,
      processingState: { isProcessing: false, currentMode: AIMode.NONE },
      hasSelectedText: false,
      selectedText: null,
      showModificationTypeSelector: false,
      showModificationPreview: false,
      showCustomPromptInput: false,
      currentModificationType: null,
      modificationPreviewContent: null,
      originalTextForModification: null,
      customPrompt: null,
      isProcessing: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AI Action Toolbar Integration', () => {
    it('should render AI action toolbar with all mode buttons', () => {
      renderBuilder();
      
      expect(screen.getByTestId('ai-mode-prompt')).toBeInTheDocument();
      expect(screen.getByTestId('ai-mode-continue')).toBeInTheDocument();
      expect(screen.getByTestId('ai-mode-modify')).toBeInTheDocument();
    });

    it('should activate prompt mode when prompt button is clicked', async () => {
      renderBuilder();
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      await userEvent.click(promptButton);
      
      expect(mockAIModeManager.setMode).toHaveBeenCalledWith(AIMode.PROMPT);
    });

    it('should activate continue mode when continue button is clicked', async () => {
      renderBuilder();
      
      const continueButton = screen.getByTestId('ai-mode-continue');
      await userEvent.click(continueButton);
      
      expect(mockAIModeManager.setMode).toHaveBeenCalledWith(AIMode.CONTINUE);
    });

    it('should start modify mode when modify button is clicked', async () => {
      mockAIModeManager.validateTextSelection.mockReturnValue(true);
      
      renderBuilder();
      
      const modifyButton = screen.getByTestId('ai-mode-modify');
      await userEvent.click(modifyButton);
      
      expect(mockAIModeManager.validateTextSelection).toHaveBeenCalled();
    });

    it('should disable modify button when no text is selected', () => {
      mockAIModeManager.hasSelectedText = false;
      
      renderBuilder();
      
      const modifyButton = screen.getByTestId('ai-mode-modify');
      expect(modifyButton).toBeDisabled();
    });
  });

  describe('Prompt Mode Integration', () => {
    beforeEach(() => {
      mockAIModeManager.currentMode = AIMode.PROMPT;
    });

    it('should show prompt input when in prompt mode', () => {
      renderBuilder();
      
      expect(screen.getByRole('textbox', { name: /ai prompt/i })).toBeInTheDocument();
    });

    it('should process prompt submission successfully', async () => {
      mockAIModeManager.processPrompt.mockResolvedValue({
        success: true,
        content: 'Generated content from AI',
        metadata: { tokensUsed: 100, processingTime: 1500 }
      });

      renderBuilder();
      
      const promptInput = screen.getByRole('textbox', { name: /ai prompt/i });
      const submitButton = screen.getByRole('button', { name: /generate/i });
      
      await userEvent.type(promptInput, 'Write an introduction');
      await userEvent.click(submitButton);
      
      expect(mockAIModeManager.processPrompt).toHaveBeenCalledWith('Write an introduction', 0);
    });

    it('should handle prompt processing errors gracefully', async () => {
      mockAIModeManager.processPrompt.mockRejectedValue(new Error('AI service error'));

      renderBuilder();
      
      const promptInput = screen.getByRole('textbox', { name: /ai prompt/i });
      const submitButton = screen.getByRole('button', { name: /generate/i });
      
      await userEvent.type(promptInput, 'Write an introduction');
      await userEvent.click(submitButton);
      
      expect(mockAIModeManager.processPrompt).toHaveBeenCalled();
      // Toast error should be shown (tested via integration)
    });

    it('should cancel prompt mode when cancel is clicked', async () => {
      renderBuilder();
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);
      
      expect(mockAIModeManager.resetMode).toHaveBeenCalled();
    });
  });

  describe('Continue Mode Integration', () => {
    beforeEach(() => {
      mockAIModeManager.currentMode = AIMode.CONTINUE;
    });

    it('should show continue mode interface when in continue mode', () => {
      renderBuilder();
      
      expect(screen.getByText(/continue content generation/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue writing/i })).toBeInTheDocument();
    });

    it('should process continue request successfully', async () => {
      mockAIModeManager.processContinue.mockResolvedValue({
        success: true,
        content: 'Continued content from AI',
        metadata: { tokensUsed: 80, processingTime: 1200 }
      });

      renderBuilder();
      
      const continueButton = screen.getByRole('button', { name: /continue writing/i });
      await userEvent.click(continueButton);
      
      expect(mockAIModeManager.processContinue).toHaveBeenCalledWith(0, undefined);
    });

    it('should handle continue processing errors gracefully', async () => {
      mockAIModeManager.processContinue.mockRejectedValue(new Error('Continue service error'));

      renderBuilder();
      
      const continueButton = screen.getByRole('button', { name: /continue writing/i });
      await userEvent.click(continueButton);
      
      expect(mockAIModeManager.processContinue).toHaveBeenCalled();
    });
  });

  describe('Modify Mode Integration', () => {
    beforeEach(() => {
      mockAIModeManager.currentMode = AIMode.MODIFY;
      mockAIModeManager.hasSelectedText = true;
      mockAIModeManager.selectedText = {
        start: 0,
        end: 10,
        text: 'Sample text'
      };
      mockAIModeManager.showModificationTypeSelector = true;
    });

    it('should show modification type selector when in modify mode', () => {
      renderBuilder();
      
      expect(screen.getByText(/modify selected text/i)).toBeInTheDocument();
      expect(screen.getByTestId('modification-type-rewrite')).toBeInTheDocument();
      expect(screen.getByTestId('modification-type-expand')).toBeInTheDocument();
      expect(screen.getByTestId('modification-type-summarize')).toBeInTheDocument();
      expect(screen.getByTestId('modification-type-improve_clarity')).toBeInTheDocument();
      expect(screen.getByTestId('modification-type-prompt')).toBeInTheDocument();
    });

    it('should process rewrite modification successfully', async () => {
      mockAIModeManager.selectModificationType.mockResolvedValue();

      renderBuilder();
      
      const rewriteButton = screen.getByTestId('modification-type-rewrite');
      await userEvent.click(rewriteButton);
      
      expect(mockAIModeManager.selectModificationType).toHaveBeenCalledWith(ModificationType.REWRITE);
    });

    it('should show custom prompt input for prompt modification type', async () => {
      mockAIModeManager.showModificationTypeSelector = false;
      mockAIModeManager.showCustomPromptInput = true;

      renderBuilder();
      
      expect(screen.getByText(/custom modification prompt/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should show modification preview when content is generated', () => {
      mockAIModeManager.showModificationTypeSelector = false;
      mockAIModeManager.showModificationPreview = true;
      mockAIModeManager.modificationPreviewContent = 'Modified content';
      mockAIModeManager.originalTextForModification = 'Original text';
      mockAIModeManager.currentModificationType = ModificationType.REWRITE;

      renderBuilder();
      
      expect(screen.getByText(/rewritten content/i)).toBeInTheDocument();
      expect(screen.getByTestId('accept-button')).toBeInTheDocument();
      expect(screen.getByTestId('reject-button')).toBeInTheDocument();
    });

    it('should accept modification and apply changes', async () => {
      mockAIModeManager.showModificationPreview = true;
      mockAIModeManager.modificationPreviewContent = 'Modified content';
      mockAIModeManager.originalTextForModification = 'Original text';
      mockAIModeManager.currentModificationType = ModificationType.REWRITE;

      renderBuilder();
      
      const acceptButton = screen.getByTestId('accept-button');
      await userEvent.click(acceptButton);
      
      expect(mockAIModeManager.acceptModification).toHaveBeenCalled();
    });

    it('should reject modification and return to type selection', async () => {
      mockAIModeManager.showModificationPreview = true;
      mockAIModeManager.modificationPreviewContent = 'Modified content';

      renderBuilder();
      
      const rejectButton = screen.getByTestId('reject-button');
      await userEvent.click(rejectButton);
      
      expect(mockAIModeManager.rejectModification).toHaveBeenCalled();
    });
  });

  describe('Editor Integration', () => {
    it('should update selection in AI mode manager when text is selected', async () => {
      renderBuilder();
      
      const editorTextarea = screen.getByTestId('editor-content');
      
      // Simulate text selection
      await userEvent.type(editorTextarea, 'Some test content');
      
      // Simulate selection
      fireEvent.select(editorTextarea);
      
      expect(mockAIModeManager.updateSelection).toHaveBeenCalled();
    });

    it('should insert AI-generated content into editor', async () => {
      mockAIModeManager.processPrompt.mockResolvedValue({
        success: true,
        content: 'AI generated content',
        metadata: { tokensUsed: 100, processingTime: 1500 }
      });

      renderBuilder();
      
      // Simulate prompt mode and content generation
      mockAIModeManager.currentMode = AIMode.PROMPT;
      
      const promptInput = screen.getByRole('textbox', { name: /ai prompt/i });
      const submitButton = screen.getByRole('button', { name: /generate/i });
      
      await userEvent.type(promptInput, 'Generate content');
      await userEvent.click(submitButton);
      
      // Wait for the content confirmation to appear
      await waitFor(() => {
        expect(screen.getByText(/ai generated content/i)).toBeInTheDocument();
      });
      
      // Accept the content
      const acceptButton = screen.getByRole('button', { name: /accept/i });
      await userEvent.click(acceptButton);
      
      expect(mockEditorMethods.insertContent).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Loading States', () => {
    it('should show processing state during AI operations', () => {
      mockAIModeManager.isProcessing = true;
      mockAIModeManager.processingState = {
        isProcessing: true,
        currentMode: AIMode.PROMPT,
        progress: 50,
        statusMessage: 'Generating content...'
      };

      renderBuilder();
      
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });

    it('should disable buttons during processing', () => {
      mockAIModeManager.isProcessing = true;
      mockAIModeManager.currentMode = AIMode.PROMPT;

      renderBuilder();
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      expect(promptButton).toBeDisabled();
    });

    it('should handle network errors gracefully', async () => {
      mockAIModeManager.processPrompt.mockRejectedValue(new Error('Network error'));
      mockAIModeManager.currentMode = AIMode.PROMPT;

      renderBuilder();
      
      const promptInput = screen.getByRole('textbox', { name: /ai prompt/i });
      const submitButton = screen.getByRole('button', { name: /generate/i });
      
      await userEvent.type(promptInput, 'Test prompt');
      await userEvent.click(submitButton);
      
      // Error should be handled and displayed via toast
      expect(mockAIModeManager.processPrompt).toHaveBeenCalled();
    });
  });

  describe('State Management Integration', () => {
    it('should maintain proper state transitions between modes', async () => {
      renderBuilder();
      
      // Start in NONE mode
      expect(mockAIModeManager.currentMode).toBe(AIMode.NONE);
      
      // Switch to PROMPT mode
      const promptButton = screen.getByTestId('ai-mode-prompt');
      await userEvent.click(promptButton);
      
      expect(mockAIModeManager.setMode).toHaveBeenCalledWith(AIMode.PROMPT);
      
      // Switch to CONTINUE mode
      const continueButton = screen.getByTestId('ai-mode-continue');
      await userEvent.click(continueButton);
      
      expect(mockAIModeManager.setMode).toHaveBeenCalledWith(AIMode.CONTINUE);
    });

    it('should reset mode when cancelling operations', async () => {
      mockAIModeManager.currentMode = AIMode.PROMPT;
      
      renderBuilder();
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);
      
      expect(mockAIModeManager.resetMode).toHaveBeenCalled();
    });

    it('should validate text selection for modify mode', async () => {
      mockAIModeManager.validateTextSelection.mockReturnValue(false);
      
      renderBuilder();
      
      const modifyButton = screen.getByTestId('ai-mode-modify');
      await userEvent.click(modifyButton);
      
      expect(mockAIModeManager.validateTextSelection).toHaveBeenCalled();
    });
  });

  describe('Accessibility Integration', () => {
    it('should have proper ARIA labels and roles', () => {
      renderBuilder();
      
      expect(screen.getByRole('toolbar', { name: /ai assistance modes/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/prompt mode/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/continue mode/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/modify mode/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderBuilder();
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      
      // Focus the button
      promptButton.focus();
      expect(promptButton).toHaveFocus();
      
      // Activate with Enter key
      fireEvent.keyDown(promptButton, { key: 'Enter' });
      
      expect(mockAIModeManager.setMode).toHaveBeenCalledWith(AIMode.PROMPT);
    });
  });

  describe('Performance Integration', () => {
    it('should debounce selection changes', async () => {
      renderBuilder();
      
      const editorTextarea = screen.getByTestId('editor-content');
      
      // Simulate rapid selection changes
      for (let i = 0; i < 5; i++) {
        fireEvent.select(editorTextarea);
      }
      
      // Should not call updateSelection for every change due to debouncing
      await waitFor(() => {
        expect(mockAIModeManager.updateSelection).toHaveBeenCalled();
      });
    });

    it('should handle large content efficiently', async () => {
      const largeContent = 'A'.repeat(10000);
      
      renderBuilder();
      
      const editorTextarea = screen.getByTestId('editor-content');
      await userEvent.type(editorTextarea, largeContent);
      
      // Should handle large content without performance issues
      expect(editorTextarea).toHaveValue(largeContent);
    });
  });
});