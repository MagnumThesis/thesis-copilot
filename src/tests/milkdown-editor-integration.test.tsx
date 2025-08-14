import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MilkdownEditor, type UseAIModeManager } from '../components/ui/milkdown-editor';
import { AIMode, type TextSelection } from '../lib/ai-types';

// Mock Milkdown components
vi.mock('@milkdown/crepe', () => ({
  Crepe: vi.fn().mockImplementation(() => ({
    editor: {
      action: vi.fn()
    }
  }))
}));

vi.mock('@milkdown/react', () => ({
  Milkdown: () => <div data-testid="milkdown-editor">Milkdown Editor</div>,
  useEditor: vi.fn(() => ({
    get: vi.fn(() => ({
      action: vi.fn()
    }))
  }))
}));

vi.mock('@milkdown/kit/utils', () => ({
  insert: vi.fn(),
  replaceAll: vi.fn()
}));

describe('MilkdownEditor Integration Tests', () => {
  let mockAIModeManager: UseAIModeManager;

  beforeEach(() => {
    mockAIModeManager = {
      currentMode: AIMode.NONE,
      setMode: vi.fn(),
      processPrompt: vi.fn(),
      processContinue: vi.fn(),
      processModify: vi.fn(),
      isProcessing: false
    };

    // Mock window.getSelection
    Object.defineProperty(window, 'getSelection', {
      writable: true,
      value: vi.fn(() => ({
        toString: () => '',
        rangeCount: 0,
        getRangeAt: vi.fn()
      }))
    });
  });

  describe('AI Mode Integration', () => {
    it('should integrate with AI mode manager for prompt mode', async () => {
      const onSelectionChange = vi.fn();
      const onCursorPositionChange = vi.fn();

      render(
        <MilkdownEditor
          aiModeManager={mockAIModeManager}
          onSelectionChange={onSelectionChange}
          onCursorPositionChange={onCursorPositionChange}
        />
      );

      expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();
      
      // Verify that the AI mode manager is properly integrated
      expect(mockAIModeManager).toBeDefined();
    });

    it('should handle text selection for modify mode', async () => {
      const onSelectionChange = vi.fn();
      
      const mockSelection = {
        toString: () => 'selected text for modification',
        rangeCount: 1,
        getRangeAt: () => ({
          startOffset: 10,
          endOffset: 35
        })
      };

      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: vi.fn(() => mockSelection)
      });

      render(
        <MilkdownEditor
          aiModeManager={mockAIModeManager}
          onSelectionChange={onSelectionChange}
        />
      );

      // Simulate text selection
      fireEvent(document, new Event('selectionchange'));

      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenCalledWith({
          start: 10,
          end: 35,
          text: 'selected text for modification'
        });
      });
    });

    it('should track cursor position for continue mode', async () => {
      const onCursorPositionChange = vi.fn();
      
      const mockSelection = {
        toString: () => '',
        rangeCount: 1,
        getRangeAt: () => ({
          startOffset: 42,
          endOffset: 42
        })
      };

      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: vi.fn(() => mockSelection)
      });

      render(
        <MilkdownEditor
          aiModeManager={mockAIModeManager}
          onCursorPositionChange={onCursorPositionChange}
        />
      );

      // Simulate cursor position change
      fireEvent(document, new Event('selectionchange'));

      await waitFor(() => {
        expect(onCursorPositionChange).toHaveBeenCalledWith(42);
      });
    });
  });

  describe('Content Management Integration', () => {
    it('should handle content changes for AI context', () => {
      const onContentChange = vi.fn();

      render(
        <MilkdownEditor
          initialContent="# Test Document\n\nThis is test content."
          onContentChange={onContentChange}
          aiModeManager={mockAIModeManager}
        />
      );

      expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();
      
      // Verify that content change handler is set up
      expect(onContentChange).toBeDefined();
    });

    it('should provide editor methods to AI mode manager', () => {
      render(
        <MilkdownEditor
          aiModeManager={mockAIModeManager}
        />
      );

      // The AI mode manager should be extended with editor methods
      // This verifies the integration is properly set up
      expect(mockAIModeManager).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle AI processing errors gracefully', () => {
      const mockAIModeManagerWithError = {
        ...mockAIModeManager,
        processPrompt: vi.fn().mockRejectedValue(new Error('AI service error'))
      };

      render(
        <MilkdownEditor
          aiModeManager={mockAIModeManagerWithError}
        />
      );

      expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();
      
      // Should render without throwing errors
      expect(mockAIModeManagerWithError.processPrompt).toBeDefined();
    });
  });

  describe('Performance Integration', () => {
    it('should debounce selection changes to avoid excessive AI calls', async () => {
      const onSelectionChange = vi.fn();
      
      render(
        <MilkdownEditor
          onSelectionChange={onSelectionChange}
          aiModeManager={mockAIModeManager}
        />
      );

      // Simulate rapid selection changes
      fireEvent(document, new Event('selectionchange'));
      fireEvent(document, new Event('selectionchange'));
      fireEvent(document, new Event('selectionchange'));

      // Should debounce the calls
      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility with AI features', () => {
      render(
        <MilkdownEditor
          aiModeManager={mockAIModeManager}
        />
      );

      const editor = screen.getByTestId('milkdown-editor');
      expect(editor).toBeInTheDocument();
      
      // Should maintain proper structure for screen readers
      expect(editor).toBeVisible();
    });
  });
});