import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAIErrorState } from '@/hooks/ai-mode/use-ai-error-state';
import { renderHook, act } from '@testing-library/react';
import { AIError, AIErrorType, AIErrorHandler } from '@/lib/ai-infrastructure';

describe('useAIErrorState', () => {
  const mockCurrentMode = 'PROMPT';
  const mockModeState = {};
  const mockSetMode = vi.fn();
  const mockResetMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default error state', () => {
    const { result } = renderHook(() =>
      useAIErrorState(mockCurrentMode, mockModeState, mockSetMode, mockResetMode)
    );

    expect(result.current.errorState).toEqual({
      hasError: false,
      error: null,
      recoveryStrategy: null,
      canRetry: false,
      retryCount: 0,
    });
  });

  it('should clear error state correctly', () => {
    const { result } = renderHook(() =>
      useAIErrorState(mockCurrentMode, mockModeState, mockSetMode, mockResetMode)
    );

    // Set an error first
    const error = new AIError(
      'Test error',
      AIErrorType.NETWORK_ERROR,
      'TEST_ERROR',
      true
    );
    const context = {
      operation: 'test-operation',
      mode: 'PROMPT' as any,
      timestamp: Date.now(),
    };

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

  it('should handle errors correctly', () => {
    const { result } = renderHook(() =>
      useAIErrorState(mockCurrentMode, mockModeState, mockSetMode, mockResetMode)
    );

    const error = new AIError(
      'Test error',
      AIErrorType.NETWORK_ERROR,
      'TEST_ERROR',
      true
    );
    const context = {
      operation: 'test-operation',
      mode: 'PROMPT' as any,
      timestamp: Date.now(),
    };

    act(() => {
      result.current.handleError(error, context);
    });

    expect(result.current.errorState.hasError).toBe(true);
    expect(result.current.errorState.error).toBe(error);
    expect(result.current.errorState.recoveryStrategy).not.toBeNull();
  });

  it('should retry last operation when possible', async () => {
    const { result } = renderHook(() =>
      useAIErrorState(mockCurrentMode, mockModeState, mockSetMode, mockResetMode)
    );

    // Set up error state that allows retry
    const error = new AIError(
      'Test error',
      AIErrorType.NETWORK_ERROR,
      'TEST_ERROR',
      true
    );
    const context = {
      operation: 'test-operation',
      mode: 'PROMPT' as any,
      timestamp: Date.now(),
      retryCount: 0,
    };

    act(() => {
      result.current.handleError(error, context);
    });

    // Update error state to allow retry
    act(() => {
      result.current.errorState.canRetry = true;
    });

    await act(async () => {
      await result.current.retryLastOperation();
    });

    expect(result.current.errorState.hasError).toBe(false);
  });

  it('should handle graceful degradation', () => {
    const { result } = renderHook(() =>
      useAIErrorState(mockCurrentMode, mockModeState, mockSetMode, mockResetMode)
    );

    const error = new AIError(
      'Test error',
      AIErrorType.NETWORK_ERROR,
      'TEST_ERROR',
      true
    );
    const context = {
      operation: 'test-operation',
      mode: 'PROMPT' as any,
      timestamp: Date.now(),
    };

    // Set up error state
    act(() => {
      result.current.handleError(error, context);
    });

    // Mock the AIErrorHandler methods
    vi.spyOn(AIErrorHandler, 'getFallbackMode').mockReturnValue('NONE' as any);
    vi.spyOn(AIErrorHandler, 'shouldGracefullyDegrade').mockReturnValue(true);

    act(() => {
      result.current.handleGracefulDegradation();
    });

    expect(mockSetMode).toHaveBeenCalledWith('NONE');
    expect(result.current.errorState.hasError).toBe(false);
  });
});