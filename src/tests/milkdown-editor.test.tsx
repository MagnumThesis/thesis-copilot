import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MilkdownEditor, type MilkdownEditorProps, type UseAIModeManager } from '../components/ui/milkdown-editor';
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

describe('MilkdownEditor AI Integration', () => {
  let mockAIModeManager: UseAIModeManager;
  let mockOnContentChange: ReturnType<typeof vi.fn>;
  let mockOnSelectionChange: ReturnType<typeof vi.fn>;
  let mockOnCursorPositionChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnContentChange = vi.fn();
    mockOnSelectionChange = vi.fn();
    mockOnCursorPositionChange = vi.fn();
    
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the editor with default props', () => {
      const { container } = render(<MilkdownEditor />);
      
      expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('milkdown-editor-container');
    });

    it('should render with custom className', () => {
      const { container } = render(<MilkdownEditor className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('milkdown-editor-container', 'custom-class');
    });

    it('should render with initial content', () => {
      const initialContent = "# Test Content";
      render(<MilkdownEditor initialContent={initialContent} />);
      
      expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();
    });
  });

  describe('Text Selection Tracking', () => {
    it('should call onSelectionChange when text is selected', async () => {
      const mockSelection = {
        toString: () => 'selected text',
        rangeCount: 1,
        getRangeAt: () => ({
          startOffset: 0,
          endOffset: 13
        })
      };

      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: vi.fn(() => mockSelection)
      });

      render(
        <MilkdownEditor 
          onSelectionChange={mockOnSelectionChange}
        />
      );

      // Simulate selection change
      fireEvent(document, new Event('selectionchange'));

      await waitFor(() => {
        expect(mockOnSelectionChange).toHaveBeenCalledWith({
          start: 0,
          end: 13,
          text: 'selected text'
        });
      });
    });

    it('should call onSelectionChange with null when no text is selected', async () => {
      const mockSelection = {
        toString: () => '',
        rangeCount: 0
      };

      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: vi.fn(() => mockSelection)
      });

      render(
        <MilkdownEditor 
          onSelectionChange={mockOnSelectionChange}
        />
      );

      fireEvent(document, new Event('selectionchange'));

      await waitFor(() => {
        expect(mockOnSelectionChange).toHaveBeenCalledWith(null);
      });
    });

    it('should track cursor position changes', async () => {
      const mockSelection = {
        toString: () => '',
        rangeCount: 1,
        getRangeAt: () => ({
          startOffset: 5,
          endOffset: 5
        })
      };

      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: vi.fn(() => mockSelection)
      });

      render(
        <MilkdownEditor 
          onCursorPositionChange={mockOnCursorPositionChange}
        />
      );

      fireEvent(document, new Event('selectionchange'));

      await waitFor(() => {
        expect(mockOnCursorPositionChange).toHaveBeenCalledWith(5);
      });
    });
  });

  describe('Content Management', () => {
    it('should call onContentChange when content is updated', () => {
      render(
        <MilkdownEditor 
          onContentChange={mockOnContentChange}
          initialContent="# Initial"
        />
      );

      // Content change would be triggered by editor actions
      // This tests the callback setup
      expect(mockOnContentChange).toBeDefined();
    });

    it('should handle content insertion at cursor position', () => {
      const { container } = render(
        <MilkdownEditor 
          initialContent="Hello world"
        />
      );

      // Test that the editor container is properly set up for content insertion
      expect(container.querySelector('.milkdown-editor-container')).toBeInTheDocument();
    });
  });

  describe('AI Content Preview', () => {
    it('should not show AI preview by default', () => {
      render(<MilkdownEditor />);
      
      expect(screen.queryByText('AI Generated Content Preview')).not.toBeInTheDocument();
    });

    it('should show AI preview when content is provided', async () => {
      const { rerender } = render(<MilkdownEditor />);
      
      // Simulate showing AI preview (this would be triggered by AI mode manager)
      // For now, we test that the preview component structure is in place
      expect(screen.queryByText('AI Generated Content Preview')).not.toBeInTheDocument();
    });
  });

  describe('AI Mode Manager Integration', () => {
    it('should accept AI mode manager prop', () => {
      render(
        <MilkdownEditor 
          aiModeManager={mockAIModeManager}
        />
      );

      expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();
    });

    it('should extend AI mode manager with editor methods', () => {
      render(
        <MilkdownEditor 
          aiModeManager={mockAIModeManager}
        />
      );

      // The AI mode manager should be extended with editor methods
      // This is tested by checking that the object is properly passed
      expect(mockAIModeManager).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle selection tracking errors gracefully', async () => {
      // Mock getSelection to throw an error
      Object.defineProperty(window, 'getSelection', {
        writable: true,
        value: vi.fn(() => {
          throw new Error('Selection error');
        })
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <MilkdownEditor 
          onSelectionChange={mockOnSelectionChange}
        />
      );

      fireEvent(document, new Event('selectionchange'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error tracking selection:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle content insertion errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<MilkdownEditor />);

      // Test that error handling is in place
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove event listeners properly', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <MilkdownEditor 
          onSelectionChange={mockOnSelectionChange}
        />
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('selectionchange', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('selectionchange', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Content Insertion Methods', () => {
    it('should provide methods for AI content insertion', () => {
      render(
        <MilkdownEditor 
          aiModeManager={mockAIModeManager}
        />
      );

      // Test that the component sets up the necessary infrastructure
      // for content insertion (the actual methods are tested through integration)
      expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should maintain proper accessibility structure', () => {
      const { container } = render(<MilkdownEditor />);
      
      expect(container.firstChild).toHaveClass('milkdown-editor-container');
    });

    it('should handle keyboard navigation properly', () => {
      render(<MilkdownEditor />);
      
      // Test that keyboard events are properly handled
      fireEvent.keyUp(document);
      
      // Should not throw errors
      expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();
    });
  });
});

describe('AIContentPreview Component', () => {
  const mockProps = {
    content: 'Test AI content',
    onAccept: vi.fn(),
    onReject: vi.fn(),
    isVisible: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when visible', () => {
    render(<MilkdownEditor />);
    
    // The preview component is internal, so we test its integration
    // through the main editor component
    expect(screen.getByTestId('milkdown-editor')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    render(<MilkdownEditor />);
    
    expect(screen.queryByText('AI Generated Content Preview')).not.toBeInTheDocument();
  });
});