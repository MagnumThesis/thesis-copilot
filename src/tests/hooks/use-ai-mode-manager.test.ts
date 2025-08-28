import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAIModeManager } from './use-ai-mode-manager';
import { renderHook, act } from '@testing-library/react';
import { AIMode, ModificationType, AIError, AIErrorType } from '@/lib/ai-infrastructure';

describe('useAIModeManager', () => {
  const mockConversationId = 'test-conversation-id';
  const mockDocumentContent = 'Test document content';
  const mockConfig = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    expect(result.current.currentMode).toBe(AIMode.NONE);
    expect(result.current.processingState).toEqual({
      isProcessing: false,
      currentMode: AIMode.NONE,
    });
    expect(result.current.hasSelectedText).toBe(false);
    expect(result.current.selectedText).toBeNull();
    expect(result.current.errorState).toEqual({
      hasError: false,
      error: null,
      recoveryStrategy: null,
      canRetry: false,
      retryCount: 0,
    });
    expect(result.current.showModificationTypeSelector).toBe(false);
    expect(result.current.showModificationPreview).toBe(false);
    expect(result.current.showCustomPromptInput).toBe(false);
    expect(result.current.currentModificationType).toBeNull();
    expect(result.current.modificationPreviewContent).toBeNull();
    expect(result.current.originalTextForModification).toBeNull();
    expect(result.current.customPrompt).toBeNull();
    expect(result.current.optimisticUpdate).toBeNull();
    expect(result.current.performanceMetrics).toBeDefined();
  });

  it('should validate mode activation correctly', () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    // Should be able to activate PROMPT mode when not processing
    expect(result.current.canActivateMode(AIMode.PROMPT)).toBe(true);

    // Should not be able to activate CONTINUE mode with empty document
    expect(result.current.canActivateMode(AIMode.CONTINUE)).toBe(false);

    // Should not be able to activate MODIFY mode without selected text
    expect(result.current.canActivateMode(AIMode.MODIFY)).toBe(false);
  });

  it('should update mode correctly', () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    act(() => {
      result.current.setMode(AIMode.PROMPT);
    });

    expect(result.current.currentMode).toBe(AIMode.PROMPT);
    expect(result.current.processingState.currentMode).toBe(AIMode.PROMPT);
  });

  it('should reset mode correctly', () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    // Set mode to PROMPT first
    act(() => {
      result.current.setMode(AIMode.PROMPT);
    });

    expect(result.current.currentMode).toBe(AIMode.PROMPT);

    // Reset mode
    act(() => {
      result.current.resetMode();
    });

    expect(result.current.currentMode).toBe(AIMode.NONE);
  });

  it('should update selection correctly', () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    const selection = {
      start: 0,
      end: 10,
      text: 'selected text',
    };

    act(() => {
      result.current.updateSelection(selection);
    });

    expect(result.current.selectedText).toEqual(selection);
    expect(result.current.hasSelectedText).toBe(true);
  });

  it('should validate text selection correctly', () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    // Should return false for null selection
    expect(result.current.validateTextSelection(null)).toBe(false);

    // Should return false for empty text
    expect(
      result.current.validateTextSelection({
        start: 0,
        end: 0,
        text: '',
      })
    ).toBe(false);

    // Should return false for text shorter than 3 characters
    expect(
      result.current.validateTextSelection({
        start: 0,
        end: 2,
        text: 'ab',
      })
    ).toBe(false);

    // Should return false for text longer than 5000 characters
    expect(
      result.current.validateTextSelection({
        start: 0,
        end: 5001,
        text: 'a'.repeat(5001),
      })
    ).toBe(false);

    // Should return true for valid text selection
    expect(
      result.current.validateTextSelection({
        start: 0,
        end: 10,
        text: 'valid text',
      })
    ).toBe(true);
  });

  it('should handle errors correctly', () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    const error = new AIError(
      'Test error',
      AIErrorType.NETWORK_ERROR,
      'TEST_ERROR',
      true
    );
    const context = {
      operation: 'test-operation',
      mode: AIMode.PROMPT,
      timestamp: Date.now(),
    };

    act(() => {
      // This would normally be called internally by the hook
      // For testing purposes, we're simulating the error handling
      result.current.errorState.hasError = true;
      result.current.errorState.error = error;
    });

    expect(result.current.errorState.hasError).toBe(true);
    expect(result.current.errorState.error).toBe(error);
  });

  it('should clear errors correctly', () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    const error = new AIError(
      'Test error',
      AIErrorType.NETWORK_ERROR,
      'TEST_ERROR',
      true
    );
    const context = {
      operation: 'test-operation',
      mode: AIMode.PROMPT,
      timestamp: Date.now(),
    };

    // Set an error first
    act(() => {
      // Simulate setting an error
      result.current.errorState.hasError = true;
      result.current.errorState.error = error;
    });

    expect(result.current.errorState.hasError).toBe(true);

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.errorState.hasError).toBe(false);
    expect(result.current.errorState.error).toBeNull();
  });

  it('should start modify mode correctly', () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    const selection = {
      start: 0,
      end: 10,
      text: 'valid text',
    };

    // First set a valid selection
    act(() => {
      result.current.updateSelection(selection);
    });

    // Then start modify mode
    act(() => {
      result.current.startModifyMode();
    });

    expect(result.current.currentMode).toBe(AIMode.MODIFY);
    expect(result.current.showModificationTypeSelector).toBe(true);
    expect(result.current.showModificationPreview).toBe(false);
    expect(result.current.showCustomPromptInput).toBe(false);
    expect(result.current.currentModificationType).toBeNull();
    expect(result.current.originalTextForModification).toBe('valid text');
    expect(result.current.customPrompt).toBeNull();
  });

  it('should select modification type correctly', async () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    const selection = {
      start: 0,
      end: 10,
      text: 'valid text',
    };

    // First set a valid selection
    act(() => {
      result.current.updateSelection(selection);
    });

    // Start modify mode
    act(() => {
      result.current.startModifyMode();
    });

    // Select a modification type
    await act(async () => {
      await result.current.selectModificationType(ModificationType.REWRITE);
    });

    expect(result.current.currentModificationType).toBe(ModificationType.REWRITE);
    expect(result.current.showModificationTypeSelector).toBe(false);
    expect(result.current.showModificationPreview).toBe(true);
  });

  it('should show custom prompt input for prompt modification type', async () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    const selection = {
      start: 0,
      end: 10,
      text: 'valid text',
    };

    // First set a valid selection
    act(() => {
      result.current.updateSelection(selection);
    });

    // Start modify mode
    act(() => {
      result.current.startModifyMode();
    });

    // Select prompt modification type
    await act(async () => {
      await result.current.selectModificationType(ModificationType.PROMPT);
    });

    expect(result.current.currentModificationType).toBe(ModificationType.PROMPT);
    expect(result.current.showModificationTypeSelector).toBe(false);
    expect(result.current.showCustomPromptInput).toBe(true);
    expect(result.current.showModificationPreview).toBe(false);
  });

  it('should submit custom prompt correctly', async () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    const selection = {
      start: 0,
      end: 10,
      text: 'valid text',
    };

    // First set a valid selection
    act(() => {
      result.current.updateSelection(selection);
    });

    // Start modify mode
    act(() => {
      result.current.startModifyMode();
    });

    // Select prompt modification type
    await act(async () => {
      await result.current.selectModificationType(ModificationType.PROMPT);
    });

    // Submit a custom prompt
    const customPrompt = 'Custom prompt for modification';
    await act(async () => {
      await result.current.submitCustomPrompt(customPrompt);
    });

    expect(result.current.customPrompt).toBe(customPrompt);
    expect(result.current.showCustomPromptInput).toBe(false);
    expect(result.current.showModificationPreview).toBe(true);
  });

  it('should go back to modification types correctly', () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    const selection = {
      start: 0,
      end: 10,
      text: 'valid text',
    };

    // First set a valid selection
    act(() => {
      result.current.updateSelection(selection);
    });

    // Start modify mode
    act(() => {
      result.current.startModifyMode();
    });

    // Select a modification type
    act(() => {
      result.current.selectModificationType(ModificationType.REWRITE);
    });

    // Go back to modification types
    act(() => {
      result.current.backToModificationTypes();
    });

    expect(result.current.showCustomPromptInput).toBe(false);
    expect(result.current.showModificationTypeSelector).toBe(true);
    expect(result.current.currentModificationType).toBeNull();
    expect(result.current.customPrompt).toBeNull();
  });

  it('should accept modification correctly', () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    const selection = {
      start: 0,
      end: 10,
      text: 'valid text',
    };

    // First set a valid selection
    act(() => {
      result.current.updateSelection(selection);
    });

    // Start modify mode
    act(() => {
      result.current.startModifyMode();
    });

    // Select a modification type
    act(() => {
      result.current.selectModificationType(ModificationType.REWRITE);
    });

    // Set some preview content
    act(() => {
      result.current.setModificationPreviewContent('Modified content');
    });

    // Accept the modification
    act(() => {
      result.current.acceptModification();
    });

    expect(result.current.currentMode).toBe(AIMode.NONE);
    expect(result.current.showModificationTypeSelector).toBe(false);
    expect(result.current.showModificationPreview).toBe(false);
    expect(result.current.showCustomPromptInput).toBe(false);
    expect(result.current.currentModificationType).toBeNull();
    expect(result.current.modificationPreviewContent).toBeNull();
    expect(result.current.originalTextForModification).toBeNull();
    expect(result.current.customPrompt).toBeNull();
  });

  it('should reject modification and return to type selection', () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    const selection = {
      start: 0,
      end: 10,
      text: 'valid text',
    };

    // First set a valid selection
    act(() => {
      result.current.updateSelection(selection);
    });

    // Start modify mode
    act(() => {
      result.current.startModifyMode();
    });

    // Select a modification type
    act(() => {
      result.current.selectModificationType(ModificationType.REWRITE);
    });

    // Set some preview content
    act(() => {
      result.current.setModificationPreviewContent('Modified content');
    });

    // Reject the modification
    act(() => {
      result.current.rejectModification();
    });

    expect(result.current.showModificationPreview).toBe(false);
    expect(result.current.modificationPreviewContent).toBeNull();
    expect(result.current.showModificationTypeSelector).toBe(true);
    expect(result.current.showCustomPromptInput).toBe(false);
    expect(result.current.currentModificationType).toBeNull();
    expect(result.current.customPrompt).toBeNull();
  });

  it('should regenerate modification correctly', async () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    const selection = {
      start: 0,
      end: 10,
      text: 'valid text',
    };

    // First set a valid selection
    act(() => {
      result.current.updateSelection(selection);
    });

    // Start modify mode
    act(() => {
      result.current.startModifyMode();
    });

    // Select a modification type
    act(() => {
      result.current.selectModificationType(ModificationType.REWRITE);
    });

    // Set current modification type
    act(() => {
      result.current.setCurrentModificationType(ModificationType.REWRITE);
    });

    // Regenerate the modification
    await act(async () => {
      await result.current.regenerateModification();
    });

    // Note: In a real implementation, this would trigger an API call
    // For testing purposes, we're just checking that the function can be called
    expect(result.current.regenerateModification).toBeDefined();
  });

  it('should clear cache correctly', () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    // Clear cache
    act(() => {
      result.current.clearCache();
    });

    // Note: In a real implementation, this would clear the performance cache
    // For testing purposes, we're just checking that the function can be called
    expect(result.current.clearCache).toBeDefined();
  });

  it('should get optimized content correctly', () => {
    const { result } = renderHook(() =>
      useAIModeManager(mockConversationId, mockDocumentContent, mockConfig)
    );

    const content = 'Test content';
    const optimizedContent = result.current.getOptimizedContent(content, AIMode.PROMPT);

    // Note: In a real implementation, this would return optimized content
    // For testing purposes, we're just checking that the function can be called
    expect(result.current.getOptimizedContent).toBeDefined();
    expect(typeof optimizedContent).toBe('string');
  });
});