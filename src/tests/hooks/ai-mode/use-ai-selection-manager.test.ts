import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAISelectionManager } from './use-ai-selection-manager';
import { renderHook, act } from '@testing-library/react';
import { TextSelection } from '@/lib/ai-infrastructure';

describe('useAISelectionManager', () => {
  const mockCurrentMode = 'MODIFY';
  const mockModeState = {};
  const mockSetMode = vi.fn();
  const mockResetMode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default selection state', () => {
    const { result } = renderHook(() =>
      useAISelectionManager(mockCurrentMode, mockModeState, mockSetMode, mockResetMode)
    );

    expect(result.current.selectedText).toBeNull();
    expect(result.current.hasSelectedText).toBe(false);
  });

  it('should update selection correctly', () => {
    const { result } = renderHook(() =>
      useAISelectionManager(mockCurrentMode, mockModeState, mockSetMode, mockResetMode)
    );

    const selection: TextSelection = {
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
      useAISelectionManager(mockCurrentMode, mockModeState, mockSetMode, mockResetMode)
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

  it('should reset mode when updating selection with invalid text in MODIFY mode', () => {
    const { result } = renderHook(() =>
      useAISelectionManager(mockCurrentMode, mockModeState, mockSetMode, mockResetMode)
    );

    const invalidSelection: TextSelection = {
      start: 0,
      end: 2,
      text: 'ab', // Too short
    };

    act(() => {
      result.current.updateSelection(invalidSelection);
    });

    expect(mockResetMode).toHaveBeenCalled();
  });

  it('should not reset mode when updating selection with valid text in MODIFY mode', () => {
    const { result } = renderHook(() =>
      useAISelectionManager(mockCurrentMode, mockModeState, mockSetMode, mockResetMode)
    );

    const validSelection: TextSelection = {
      start: 0,
      end: 10,
      text: 'valid text',
    };

    act(() => {
      result.current.updateSelection(validSelection);
    });

    expect(mockResetMode).not.toHaveBeenCalled();
  });

  it('should handle null selection correctly', () => {
    const { result } = renderHook(() =>
      useAISelectionManager(mockCurrentMode, mockModeState, mockSetMode, mockResetMode)
    );

    act(() => {
      result.current.updateSelection(null);
    });

    expect(result.current.selectedText).toBeNull();
    expect(result.current.hasSelectedText).toBe(false);
  });

  it('should handle empty text selection correctly', () => {
    const { result } = renderHook(() =>
      useAISelectionManager(mockCurrentMode, mockModeState, mockSetMode, mockResetMode)
    );

    const emptySelection: TextSelection = {
      start: 0,
      end: 0,
      text: '',
    };

    act(() => {
      result.current.updateSelection(emptySelection);
    });

    expect(result.current.selectedText).toEqual(emptySelection);
    expect(result.current.hasSelectedText).toBe(false);
  });

  it('should handle whitespace-only text selection correctly', () => {
    const { result } = renderHook(() =>
      useAISelectionManager(mockCurrentMode, mockModeState, mockSetMode, mockResetMode)
    );

    const whitespaceSelection: TextSelection = {
      start: 0,
      end: 3,
      text: '   ',
    };

    act(() => {
      result.current.updateSelection(whitespaceSelection);
    });

    expect(result.current.selectedText).toEqual(whitespaceSelection);
    expect(result.current.hasSelectedText).toBe(false);
  });
});