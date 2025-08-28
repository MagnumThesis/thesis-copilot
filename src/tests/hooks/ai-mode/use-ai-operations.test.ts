import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAIOperations } from './use-ai-operations';
import { renderHook, act } from '@testing-library/react';
import { AIMode, ModificationType, AIError, AIErrorType } from '@/lib/ai-infrastructure';

describe('useAIOperations', () => {
  const mockConversationId = 'test-conversation-id';
  const mockDocumentContent = 'Test document content';
  const mockModeState = {};
  const mockErrorState = {};
  const mockSetMode = vi.fn();
  const mockHandleError = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() =>
      useAIOperations(
        mockConversationId,
        mockDocumentContent,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockHandleError,
        mockClearError
      )
    );

    expect(result.current.optimisticUpdate).toBeNull();
    expect(result.current.performanceMetrics).toBeDefined();
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.processingState).toEqual({
      isProcessing: false,
      currentMode: AIMode.NONE,
      progress: undefined,
      statusMessage: undefined,
    });
  });

  it('should process prompt correctly', async () => {
    const { result } = renderHook(() =>
      useAIOperations(
        mockConversationId,
        mockDocumentContent,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockHandleError,
        mockClearError
      )
    );

    const prompt = 'Test prompt';
    const cursorPosition = 10;

    // Mock fetch to return a successful response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, content: 'Generated content' }),
    });

    await act(async () => {
      const response = await result.current.processPrompt(prompt, cursorPosition);
      expect(response).toEqual({ success: true, content: 'Generated content' });
    });

    expect(fetch).toHaveBeenCalledWith('/api/builder/ai/prompt', expect.any(Object));
  });

  it('should throw error when processing empty prompt', async () => {
    const { result } = renderHook(() =>
      useAIOperations(
        mockConversationId,
        mockDocumentContent,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockHandleError,
        mockClearError
      )
    );

    const prompt = '';
    const cursorPosition = 10;

    await expect(
      act(async () => {
        await result.current.processPrompt(prompt, cursorPosition);
      })
    ).rejects.toThrow(AIError);

    expect(mockHandleError).toHaveBeenCalled();
  });

  it('should process continue correctly', async () => {
    const { result } = renderHook(() =>
      useAIOperations(
        mockConversationId,
        mockDocumentContent,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockHandleError,
        mockClearError
      )
    );

    const cursorPosition = 10;
    const selectedText = 'selected text';

    // Mock fetch to return a successful response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, content: 'Continued content' }),
    });

    await act(async () => {
      const response = await result.current.processContinue(cursorPosition, selectedText);
      expect(response).toEqual({ success: true, content: 'Continued content' });
    });

    expect(fetch).toHaveBeenCalledWith('/api/builder/ai/continue', expect.any(Object));
  });

  it('should process modify correctly', async () => {
    const { result } = renderHook(() =>
      useAIOperations(
        mockConversationId,
        mockDocumentContent,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockHandleError,
        mockClearError
      )
    );

    const selectedText = 'selected text';
    const modificationType = ModificationType.REWRITE;

    // Mock fetch to return a successful response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, content: 'Modified content' }),
    });

    await act(async () => {
      const response = await result.current.processModify(selectedText, modificationType);
      expect(response).toEqual({ success: true, content: 'Modified content' });
    });

    expect(fetch).toHaveBeenCalledWith('/api/builder/ai/modify', expect.any(Object));
  });

  it('should throw error when processing modify with empty text', async () => {
    const { result } = renderHook(() =>
      useAIOperations(
        mockConversationId,
        mockDocumentContent,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockHandleError,
        mockClearError
      )
    );

    const selectedText = '';
    const modificationType = ModificationType.REWRITE;

    await expect(
      act(async () => {
        await result.current.processModify(selectedText, modificationType);
      })
    ).rejects.toThrow(AIError);

    expect(mockHandleError).toHaveBeenCalled();
  });

  it('should handle network errors correctly', async () => {
    const { result } = renderHook(() =>
      useAIOperations(
        mockConversationId,
        mockDocumentContent,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockHandleError,
        mockClearError
      )
    );

    const prompt = 'Test prompt';
    const cursorPosition = 10;

    // Mock fetch to return a network error
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    });

    await expect(
      act(async () => {
        await result.current.processPrompt(prompt, cursorPosition);
      })
    ).rejects.toThrow(AIError);

    expect(mockHandleError).toHaveBeenCalled();
  });

  it('should handle timeout errors correctly', async () => {
    const { result } = renderHook(() =>
      useAIOperations(
        mockConversationId,
        mockDocumentContent,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockHandleError,
        mockClearError
      )
    );

    const prompt = 'Test prompt';
    const cursorPosition = 10;

    // Mock fetch to timeout
    global.fetch = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout'));
        }, 35000); // Longer than the default timeout
      });
    });

    await expect(
      act(async () => {
        await result.current.processPrompt(prompt, cursorPosition);
      })
    ).rejects.toThrow(AIError);

    expect(mockHandleError).toHaveBeenCalled();
  });

  it('should handle cancellation correctly', async () => {
    const { result } = renderHook(() =>
      useAIOperations(
        mockConversationId,
        mockDocumentContent,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockHandleError,
        mockClearError
      )
    );

    const prompt = 'Test prompt';
    const cursorPosition = 10;

    // Mock fetch to be cancellable
    global.fetch = vi.fn().mockImplementation((_, options) => {
      return new Promise((_, reject) => {
        options.signal.addEventListener('abort', () => {
          reject(new Error('Operation was cancelled'));
        });
        
        // Simulate a long-running request
        setTimeout(() => {
          reject(new Error('Timeout'));
        }, 35000);
      });
    });

    // Start the operation
    const operationPromise = result.current.processPrompt(prompt, cursorPosition);

    // Cancel the operation
    act(() => {
      result.current.processingState.currentMode = AIMode.PROMPT; // Set the mode to enable cancellation
    });

    await expect(
      act(async () => {
        await operationPromise;
      })
    ).rejects.toThrow(AIError);

    expect(mockHandleError).toHaveBeenCalled();
  });
});