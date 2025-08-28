import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAIModeState } from '@/hooks/ai-mode/use-ai-mode-state';
import { renderHook, act } from '@testing-library/react';
import { AIMode, AIError, AIErrorType } from '@/lib/ai-infrastructure';

describe('useAIModeState', () => {
  const mockConversationId = 'test-conversation-id';
  const mockDocumentContent = 'Test document content';
  const mockConfig = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() =>
      useAIModeState(mockConversationId, mockDocumentContent, mockConfig)
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
  });

  it('should validate mode activation correctly', () => {
    const { result } = renderHook(() =>
      useAIModeState(mockConversationId, mockDocumentContent, mockConfig)
    );

    // Should be able to activate PROMPT mode when not processing
    expect(result.current.canActivateMode(AIMode.PROMPT)).toBe(true);

    // Should not be able to activate CONTINUE mode with empty document
    expect(result.current.canActivateMode(AIMode.CONTINUE)).toBe(false);

    // Should not be able to activate MODIFY mode without selected text
    expect(result.current.canActivateMode(AIMode.MODIFY)).toBe(false);
  });

  it('should set mode correctly', () => {
    const { result } = renderHook(() =>
      useAIModeState(mockConversationId, mockDocumentContent, mockConfig)
    );

    act(() => {
      result.current.setMode(AIMode.PROMPT);
    });

    expect(result.current.currentMode).toBe(AIMode.PROMPT);
    expect(result.current.processingState.currentMode).toBe(AIMode.PROMPT);
  });

  it('should reset mode correctly', () => {
    const { result } = renderHook(() =>
      useAIModeState(mockConversationId, mockDocumentContent, mockConfig)
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

  it('should handle errors correctly', () => {
    const { result } = renderHook(() =>
      useAIModeState(mockConversationId, mockDocumentContent, mockConfig)
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
      result.current.handleError(error, context);
    });

    expect(result.current.errorState.hasError).toBe(true);
    expect(result.current.errorState.error).toBe(error);
  });

  it('should clear errors correctly', () => {
    const { result } = renderHook(() =>
      useAIModeState(mockConversationId, mockDocumentContent, mockConfig)
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
      result.current.handleError(error, context);
    });

    expect(result.current.errorState.hasError).toBe(true);

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.errorState.hasError).toBe(false);
    expect(result.current.errorState.error).toBeNull();
  });

  it('should update selection correctly', () => {
    const { result } = renderHook(() =>
      useAIModeState(mockConversationId, mockDocumentContent, mockConfig)
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
      useAIModeState(mockConversationId, mockDocumentContent, mockConfig)
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
});