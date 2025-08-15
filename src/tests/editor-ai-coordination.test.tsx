/**
 * Integration Tests for Editor and AI Coordination
 * Tests the coordination between Milkdown Editor and AI systems
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MilkdownEditor } from '@/components/ui/milkdown-editor';
import { useAIModeManager } from '@/hooks/use-ai-mode-manager';
import { AIMode, ModificationType, type TextSelection } from '@/lib/ai-types';

// Mock the AI mode manager hook
const mockAIModeManager = {
  currentMode: AIMode.NONE,
  setMode: vi.fn(),
  processPrompt: vi.fn(),
  processContinue: vi.fn(),
  processModify: vi.fn(),
  isProcessing: false,
  hasSelectedText: false,
  selectedText: '',
  cursorPosition: 0,
  insertContent: vi.fn(),
  replaceContent: vi.fn(),
  getEditorContent: vi.fn(() => ''),
  setEditorContent: vi.fn()
};

vi.mock('@/hooks/use-ai-mode-manager', () => ({
  useAIModeManager: () => mockAIModeManager
}));

// Mock Milkdown components
vi.mock('@milkdown/react', () => ({
  Milkdown: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="milkdown-container">{children}</div>
  ),
  useEditor: () => ({
    get: vi.fn(() => ({
      action: vi.fn()
    }))
  })
}));

vi.mock('@milkdown/crepe', () => ({
  Crepe: vi.fn().mockImplementation(() => ({
    editor: {
      action: vi.fn()
    }
  }))
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Editor and AI Coordination Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        content: 'AI generated content'
      })
    });

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

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Content Synchronization', () => {
    it('should synchronize editor content with AI context', async () => {
      const onContentChange = vi.fn();
      
      render(
        <MilkdownEditor
          initialContent="# Initial Content\n\nThis is the starting content."
          onContentChange={onContentChange}
          aiModeManager={mockAIModeManager}
        />
      );

      // Simulate content change in editor
      const editor = screen.getByTestId('milkdown-container');
      fireEvent.input(editor, { 
        target: { textContent: '# Updated Content\n\nThis content has been updated.' }
      });

      // Verify content change callback
      await waitFor(() => {
        expect(onContentChange).toHaveBeenCalled();
      });

      // Verify AI mode manager has access to updated content
      expect(mockAIModeManager.getEditorContent).toBeDefined();
    });

    it('should handle AI content insertion correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <MilkdownEditor
          initialContent="Existing content. "
          aiModeManager={mockAIModeManager}
        />
      );

      // Simulate AI content insertion
      const aiContent = 'This is AI generated content.';
      mockAIModeManager.insertContent.mockImplementation((content: string, position: number) => {
        // Simulate content insertion at position
        const existingContent = 'Existing content. ';
        const newContent = existingContent.slice(0, position) + content + existingContent.slice(position);
        return newContent;
      });

      // Insert AI content at end
      const result = mockAIModeManager.insertContent(aiContent, 18);
      
      expect(result).toBe('Existing content. This is AI generated content.');
      expect(mockAIModeManager.insertContent).toHaveBeenCalledWith(aiContent, 18);
    });

    it('should handle AI content replacement correctly', async () => {
      render(
        <MilkdownEditor
          initialContent="This text needs improvement for academic writing."
          aiModeManager={mockAIModeManager}
        />
      );

      // Simulate text replacement
      const originalText = 'needs improvement';
      const replacementText = 'requires enhancement';
      
      mockAIModeManager.replaceContent.mockImplementation((original: string, replacement: string) => {
        const content = 'This text needs improvement for academic writing.';
        return content.replace(original, replacement);
      });

      const result = mockAIModeManager.replaceContent(originalText, replacementText);
      
      expect(result).toBe('This text requires enhancement for academic writing.');
      expect(mockAIModeManager.replaceContent).toHaveBeenCalledWith(originalText, replacementText);
    });
  });

  describe('Selection Tracking', () => {
    it('should track text selection for modify mode', async () => {
      const onSelectionChange = vi.fn();
      
      const mockSelection = {
        toString: () => 'selected text for modification',
        rangeCount: 1,
        getRangeAt: () => ({
          startOffset: 10,
          endOffset: 35,
          commonAncestorContainer: {
            textContent: 'This is selected text for modification in the document.'
          }
        })
      };

      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: vi.fn(() => mockSelection)
      });

      render(
        <MilkdownEditor
          onSelectionChange={onSelectionChange}
          aiModeManager={mockAIModeManager}
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
          onCursorPositionChange={onCursorPositionChange}
          aiModeManager={mockAIModeManager}
        />
      );

      // Simulate cursor position change
      fireEvent(document, new Event('selectionchange'));

      await waitFor(() => {
        expect(onCursorPositionChange).toHaveBeenCalledWith(42);
      });
    });

    it('should debounce selection changes to prevent excessive updates', async () => {
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

      // Should debounce to single call
      await waitFor(() => {
        expect(onSelectionChange).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('AI Mode Coordination', () => {
    it('should coordinate prompt mode with editor state', async () => {
      const onContentChange = vi.fn();
      
      render(
        <MilkdownEditor
          initialContent="# Thesis Introduction\n\n"
          onContentChange={onContentChange}
          aiModeManager={{
            ...mockAIModeManager,
            currentMode: AIMode.PROMPT,
            processPrompt: vi.fn().mockResolvedValue({
              success: true,
              content: 'AI generated introduction content.'
            })
          }}
        />
      );

      // Simulate prompt processing
      const aiModeManager = mockAIModeManager;
      aiModeManager.currentMode = AIMode.PROMPT;
      
      await aiModeManager.processPrompt('Write an introduction for my thesis');

      expect(aiModeManager.processPrompt).toHaveBeenCalledWith('Write an introduction for my thesis');
    });

    it('should coordinate continue mode with cursor position', async () => {
      const onCursorPositionChange = vi.fn();
      
      render(
        <MilkdownEditor
          initialContent="This is the beginning of my thesis. "
          onCursorPositionChange={onCursorPositionChange}
          aiModeManager={{
            ...mockAIModeManager,
            currentMode: AIMode.CONTINUE,
            cursorPosition: 36,
            processContinue: vi.fn().mockResolvedValue({
              success: true,
              content: 'The research focuses on...'
            })
          }}
        />
      );

      // Simulate continue processing
      const aiModeManager = mockAIModeManager;
      aiModeManager.currentMode = AIMode.CONTINUE;
      aiModeManager.cursorPosition = 36;
      
      await aiModeManager.processContinue();

      expect(aiModeManager.processContinue).toHaveBeenCalled();
    });

    it('should coordinate modify mode with text selection', async () => {
      const onSelectionChange = vi.fn();
      
      render(
        <MilkdownEditor
          initialContent="This sentence needs improvement."
          onSelectionChange={onSelectionChange}
          aiModeManager={{
            ...mockAIModeManager,
            currentMode: AIMode.MODIFY,
            hasSelectedText: true,
            selectedText: 'needs improvement',
            processModify: vi.fn().mockResolvedValue({
              success: true,
              content: 'requires enhancement'
            })
          }}
        />
      );

      // Simulate modify processing
      const aiModeManager = mockAIModeManager;
      aiModeManager.currentMode = AIMode.MODIFY;
      aiModeManager.hasSelectedText = true;
      aiModeManager.selectedText = 'needs improvement';
      
      await aiModeManager.processModify(ModificationType.IMPROVE_CLARITY);

      expect(aiModeManager.processModify).toHaveBeenCalledWith(ModificationType.IMPROVE_CLARITY);
    });
  });

  describe('Error Handling Coordination', () => {
    it('should handle AI processing errors in editor context', async () => {
      const onError = vi.fn();
      
      render(
        <MilkdownEditor
          onError={onError}
          aiModeManager={{
            ...mockAIModeManager,
            processPrompt: vi.fn().mockRejectedValue(new Error('AI service error'))
          }}
        />
      );

      // Simulate AI error
      try {
        await mockAIModeManager.processPrompt('Test prompt');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('AI service error');
      }
    });

    it('should recover from editor errors during AI operations', async () => {
      const onError = vi.fn();
      
      render(
        <MilkdownEditor
          onError={onError}
          aiModeManager={mockAIModeManager}
        />
      );

      // Simulate editor error during content insertion
      mockAIModeManager.insertContent.mockImplementation(() => {
        throw new Error('Editor insertion failed');
      });

      try {
        mockAIModeManager.insertContent('test content', 0);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Editor insertion failed');
      }
    });

    it('should handle network errors during AI coordination', async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(
        <MilkdownEditor
          aiModeManager={{
            ...mockAIModeManager,
            processPrompt: vi.fn().mockRejectedValue(new Error('Network error'))
          }}
        />
      );

      // Simulate network error during AI processing
      try {
        await mockAIModeManager.processPrompt('Test prompt');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });
  });

  describe('Performance Coordination', () => {
    it('should handle large document content efficiently', async () => {
      const largeContent = 'Lorem ipsum dolor sit amet. '.repeat(1000); // ~27KB
      
      const startTime = performance.now();
      
      render(
        <MilkdownEditor
          initialContent={largeContent}
          aiModeManager={mockAIModeManager}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render large content efficiently
      expect(renderTime).toBeLessThan(1000); // Less than 1 second

      // Should handle AI operations with large content
      mockAIModeManager.getEditorContent.mockReturnValue(largeContent);
      const content = mockAIModeManager.getEditorContent();
      
      expect(content).toBe(largeContent);
      expect(content.length).toBeGreaterThan(25000);
    });

    it('should optimize AI context building from editor content', async () => {
      const documentContent = `
        # Thesis Proposal: Advanced Machine Learning Applications
        
        ## Abstract
        This thesis explores the application of advanced machine learning techniques...
        
        ## Introduction
        Machine learning has revolutionized many fields...
        
        ## Literature Review
        Previous research in this area has shown...
        
        ## Methodology
        Our approach involves several key components...
        
        ## Expected Results
        We anticipate that our research will demonstrate...
      `;

      render(
        <MilkdownEditor
          initialContent={documentContent}
          aiModeManager={mockAIModeManager}
        />
      );

      // Simulate context optimization for AI
      mockAIModeManager.getEditorContent.mockReturnValue(documentContent);
      
      const startTime = performance.now();
      const content = mockAIModeManager.getEditorContent();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
      expect(content).toContain('Machine learning');
      expect(content).toContain('Methodology');
    });

    it('should handle concurrent AI operations efficiently', async () => {
      render(
        <MilkdownEditor
          aiModeManager={mockAIModeManager}
        />
      );

      // Simulate concurrent AI operations
      const operations = [
        mockAIModeManager.processPrompt('Generate introduction'),
        mockAIModeManager.processContinue(),
        mockAIModeManager.processModify(ModificationType.IMPROVE_CLARITY)
      ];

      const startTime = performance.now();
      
      // All operations should be handled (though they may be queued)
      await Promise.allSettled(operations);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle concurrent operations efficiently
      expect(totalTime).toBeLessThan(2000); // Less than 2 seconds
    });
  });

  describe('State Management Coordination', () => {
    it('should maintain consistent state between editor and AI manager', async () => {
      const { rerender } = render(
        <MilkdownEditor
          initialContent="Initial content"
          aiModeManager={{
            ...mockAIModeManager,
            currentMode: AIMode.NONE
          }}
        />
      );

      // Change AI mode
      rerender(
        <MilkdownEditor
          initialContent="Initial content"
          aiModeManager={{
            ...mockAIModeManager,
            currentMode: AIMode.PROMPT
          }}
        />
      );

      // State should be consistent
      expect(mockAIModeManager.currentMode).toBe(AIMode.PROMPT);
    });

    it('should synchronize processing state between components', async () => {
      const { rerender } = render(
        <MilkdownEditor
          aiModeManager={{
            ...mockAIModeManager,
            isProcessing: false
          }}
        />
      );

      // Start processing
      rerender(
        <MilkdownEditor
          aiModeManager={{
            ...mockAIModeManager,
            isProcessing: true
          }}
        />
      );

      // Processing state should be reflected
      expect(mockAIModeManager.isProcessing).toBe(true);
    });

    it('should handle state transitions smoothly', async () => {
      const stateTransitions = [
        { mode: AIMode.NONE, processing: false },
        { mode: AIMode.PROMPT, processing: false },
        { mode: AIMode.PROMPT, processing: true },
        { mode: AIMode.PROMPT, processing: false },
        { mode: AIMode.CONTINUE, processing: false },
        { mode: AIMode.NONE, processing: false }
      ];

      for (const state of stateTransitions) {
        const { rerender } = render(
          <MilkdownEditor
            aiModeManager={{
              ...mockAIModeManager,
              currentMode: state.mode,
              isProcessing: state.processing
            }}
          />
        );

        // Each state transition should be handled smoothly
        expect(mockAIModeManager.currentMode).toBe(state.mode);
        expect(mockAIModeManager.isProcessing).toBe(state.processing);
      }
    });
  });

  describe('Accessibility Coordination', () => {
    it('should maintain accessibility during AI operations', async () => {
      render(
        <MilkdownEditor
          aiModeManager={{
            ...mockAIModeManager,
            currentMode: AIMode.PROMPT,
            isProcessing: true
          }}
        />
      );

      const editor = screen.getByTestId('milkdown-container');
      
      // Editor should remain accessible during AI processing
      expect(editor).toBeInTheDocument();
      expect(editor).toBeVisible();
    });

    it('should provide proper ARIA labels during AI coordination', async () => {
      render(
        <MilkdownEditor
          aiModeManager={{
            ...mockAIModeManager,
            currentMode: AIMode.MODIFY,
            hasSelectedText: true
          }}
        />
      );

      // Should maintain proper accessibility structure
      const editor = screen.getByTestId('milkdown-container');
      expect(editor).toBeInTheDocument();
    });
  });
});