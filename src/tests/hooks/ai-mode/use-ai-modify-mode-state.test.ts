import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAIModifyModeState } from './use-ai-modify-mode-state';
import { renderHook, act } from '@testing-library/react';
import { ModificationType, AIError, AIErrorType } from '@/lib/ai-infrastructure';

describe('useAIModifyModeState', () => {
  const mockCurrentMode = 'MODIFY';
  const mockSelectedText = {
    start: 0,
    end: 10,
    text: 'selected text',
  };
  const mockModeState = {};
  const mockErrorState = {};
  const mockSetMode = vi.fn();
  const mockResetMode = vi.fn();
  const mockHandleError = vi.fn();
  const mockValidateTextSelection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default modify mode state', () => {
    const { result } = renderHook(() =>
      useAIModifyModeState(
        mockCurrentMode,
        mockSelectedText,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockResetMode,
        mockHandleError,
        mockValidateTextSelection
      )
    );

    expect(result.current.showModificationTypeSelector).toBe(false);
    expect(result.current.showModificationPreview).toBe(false);
    expect(result.current.showCustomPromptInput).toBe(false);
    expect(result.current.currentModificationType).toBeNull();
    expect(result.current.modificationPreviewContent).toBeNull();
    expect(result.current.originalTextForModification).toBeNull();
    expect(result.current.customPrompt).toBeNull();
  });

  it('should start modify mode correctly with valid selection', () => {
    mockValidateTextSelection.mockReturnValue(true);

    const { result } = renderHook(() =>
      useAIModifyModeState(
        mockCurrentMode,
        mockSelectedText,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockResetMode,
        mockHandleError,
        mockValidateTextSelection
      )
    );

    act(() => {
      result.current.startModifyMode();
    });

    expect(mockSetMode).toHaveBeenCalledWith('MODIFY');
    expect(result.current.showModificationTypeSelector).toBe(true);
    expect(result.current.showModificationPreview).toBe(false);
    expect(result.current.showCustomPromptInput).toBe(false);
    expect(result.current.currentModificationType).toBeNull();
    expect(result.current.originalTextForModification).toBe('selected text');
    expect(result.current.customPrompt).toBeNull();
  });

  it('should not start modify mode with invalid selection', () => {
    mockValidateTextSelection.mockReturnValue(false);

    const { result } = renderHook(() =>
      useAIModifyModeState(
        mockCurrentMode,
        mockSelectedText,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockResetMode,
        mockHandleError,
        mockValidateTextSelection
      )
    );

    act(() => {
      result.current.startModifyMode();
    });

    expect(mockSetMode).not.toHaveBeenCalled();
    expect(result.current.showModificationTypeSelector).toBe(false);
  });

  it('should select modification type correctly', async () => {
    mockValidateTextSelection.mockReturnValue(true);

    const { result } = renderHook(() =>
      useAIModifyModeState(
        mockCurrentMode,
        mockSelectedText,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockResetMode,
        mockHandleError,
        mockValidateTextSelection
      )
    );

    await act(async () => {
      await result.current.selectModificationType(ModificationType.REWRITE);
    });

    expect(result.current.currentModificationType).toBe(ModificationType.REWRITE);
    expect(result.current.showModificationTypeSelector).toBe(false);
    expect(result.current.showModificationPreview).toBe(true);
    expect(result.current.modificationPreviewContent).not.toBeNull();
  });

  it('should show custom prompt input for prompt modification type', async () => {
    mockValidateTextSelection.mockReturnValue(true);

    const { result } = renderHook(() =>
      useAIModifyModeState(
        mockCurrentMode,
        mockSelectedText,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockResetMode,
        mockHandleError,
        mockValidateTextSelection
      )
    );

    await act(async () => {
      await result.current.selectModificationType(ModificationType.PROMPT);
    });

    expect(result.current.currentModificationType).toBe(ModificationType.PROMPT);
    expect(result.current.showModificationTypeSelector).toBe(false);
    expect(result.current.showCustomPromptInput).toBe(true);
    expect(result.current.showModificationPreview).toBe(false);
  });

  it('should throw error when selecting modification type with invalid selection', async () => {
    mockValidateTextSelection.mockReturnValue(false);

    const { result } = renderHook(() =>
      useAIModifyModeState(
        mockCurrentMode,
        mockSelectedText,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockResetMode,
        mockHandleError,
        mockValidateTextSelection
      )
    );

    await expect(
      act(async () => {
        await result.current.selectModificationType(ModificationType.REWRITE);
      })
    ).rejects.toThrow(AIError);

    expect(result.current.showModificationTypeSelector).toBe(true);
  });

  it('should submit custom prompt correctly', async () => {
    mockValidateTextSelection.mockReturnValue(true);

    const { result } = renderHook(() =>
      useAIModifyModeState(
        mockCurrentMode,
        mockSelectedText,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockResetMode,
        mockHandleError,
        mockValidateTextSelection
      )
    );

    const customPrompt = 'Custom prompt for modification';

    await act(async () => {
      await result.current.submitCustomPrompt(customPrompt);
    });

    expect(result.current.customPrompt).toBe(customPrompt);
    expect(result.current.showCustomPromptInput).toBe(false);
    expect(result.current.showModificationPreview).toBe(true);
    expect(result.current.modificationPreviewContent).not.toBeNull();
  });

  it('should throw error when submitting empty custom prompt', async () => {
    mockValidateTextSelection.mockReturnValue(true);

    const { result } = renderHook(() =>
      useAIModifyModeState(
        mockCurrentMode,
        mockSelectedText,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockResetMode,
        mockHandleError,
        mockValidateTextSelection
      )
    );

    await expect(
      act(async () => {
        await result.current.submitCustomPrompt('');
      })
    ).rejects.toThrow(AIError);

    expect(result.current.showCustomPromptInput).toBe(true);
  });

  it('should go back to modification types correctly', () => {
    const { result } = renderHook(() =>
      useAIModifyModeState(
        mockCurrentMode,
        mockSelectedText,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockResetMode,
        mockHandleError,
        mockValidateTextSelection
      )
    );

    // Set some state first
    act(() => {
      result.current.setShowCustomPromptInput(true);
      result.current.setCurrentModificationType(ModificationType.EXPAND);
      result.current.setCustomPrompt('test prompt');
    });

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
      useAIModifyModeState(
        mockCurrentMode,
        mockSelectedText,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockResetMode,
        mockHandleError,
        mockValidateTextSelection
      )
    );

    // Set some state first
    act(() => {
      result.current.setModificationPreviewContent('Modified content');
    });

    act(() => {
      result.current.acceptModification();
    });

    expect(mockSetMode).toHaveBeenCalledWith('NONE');
    expect(result.current.showModificationTypeSelector).toBe(false);
    expect(result.current.showModificationPreview).toBe(false);
    expect(result.current.showCustomPromptInput).toBe(false);
    expect(result.current.currentModificationType).toBeNull();
    expect(result.current.modificationPreviewContent).toBeNull();
    expect(result.current.originalTextForModification).toBeNull();
    expect(result.current.customPrompt).toBeNull();
  });

  it('should reject modification and return to type selection with valid text', () => {
    mockValidateTextSelection.mockReturnValue(true);

    const { result } = renderHook(() =>
      useAIModifyModeState(
        mockCurrentMode,
        mockSelectedText,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockResetMode,
        mockHandleError,
        mockValidateTextSelection
      )
    );

    // Set some state first
    act(() => {
      result.current.setShowModificationPreview(true);
      result.current.setModificationPreviewContent('Modified content');
    });

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

  it('should reject modification and exit modify mode with invalid text', () => {
    mockValidateTextSelection.mockReturnValue(false);

    const { result } = renderHook(() =>
      useAIModifyModeState(
        mockCurrentMode,
        mockSelectedText,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockResetMode,
        mockHandleError,
        mockValidateTextSelection
      )
    );

    // Set some state first
    act(() => {
      result.current.setShowModificationPreview(true);
      result.current.setModificationPreviewContent('Modified content');
    });

    act(() => {
      result.current.rejectModification();
    });

    expect(mockResetMode).toHaveBeenCalled();
    expect(result.current.showModificationTypeSelector).toBe(false);
    expect(result.current.showCustomPromptInput).toBe(false);
    expect(result.current.currentModificationType).toBeNull();
    expect(result.current.originalTextForModification).toBeNull();
    expect(result.current.customPrompt).toBeNull();
  });

  it('should regenerate modification correctly', async () => {
    mockValidateTextSelection.mockReturnValue(true);

    const { result } = renderHook(() =>
      useAIModifyModeState(
        mockCurrentMode,
        mockSelectedText,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockResetMode,
        mockHandleError,
        mockValidateTextSelection
      )
    );

    // Set up state for regeneration
    act(() => {
      result.current.setCurrentModificationType(ModificationType.REWRITE);
    });

    await act(async () => {
      await result.current.regenerateModification();
    });

    expect(result.current.modificationPreviewContent).not.toBeNull();
  });

  it('should throw error when regenerating with invalid state', async () => {
    mockValidateTextSelection.mockReturnValue(false);

    const { result } = renderHook(() =>
      useAIModifyModeState(
        mockCurrentMode,
        mockSelectedText,
        mockModeState,
        mockErrorState,
        mockSetMode,
        mockResetMode,
        mockHandleError,
        mockValidateTextSelection
      )
    );

    await expect(
      act(async () => {
        await result.current.regenerateModification();
      })
    ).rejects.toThrow(AIError);
  });
});