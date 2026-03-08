import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIPromptInput } from '@/components/ui/ai-prompt-input';

// Mock the tooltip provider to avoid portal issues in tests
vi.mock('@/components/ui/shadcn/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? children : <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Send: () => <svg data-testid="icon-send" />,
  Loader2: () => <svg data-testid="icon-loader" className="animate-spin" />,
  X: () => <svg data-testid="icon-x" />,
  Lightbulb: () => <svg data-testid="icon-lightbulb" />,
}));

describe('AIPromptInput', () => {
  const defaultProps = {
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    isProcessing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the input component with all main elements', () => {
      render(<AIPromptInput {...defaultProps} />);

      expect(screen.getByLabelText('AI Prompt')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /AI Prompt/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel prompt/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Show prompt suggestions/i })).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <AIPromptInput {...defaultProps} className="custom-test-class" />
      );

      expect(container.firstChild).toHaveClass('custom-test-class');
    });

    it('should render with custom placeholder', () => {
      render(
        <AIPromptInput {...defaultProps} placeholder="Custom placeholder text" />
      );

      expect(screen.getByPlaceholderText('Custom placeholder text')).toBeInTheDocument();
    });

    it('should render character count based on default maxLength', () => {
      render(<AIPromptInput {...defaultProps} />);

      expect(screen.getByText('500 characters remaining')).toBeInTheDocument();
    });

    it('should render character count based on custom maxLength', () => {
      render(<AIPromptInput {...defaultProps} maxLength={100} />);

      expect(screen.getByText('100 characters remaining')).toBeInTheDocument();
    });
  });

  describe('User Interaction & Validation', () => {
    it('should keep Generate button disabled when prompt is empty', () => {
      render(<AIPromptInput {...defaultProps} />);

      const generateButton = screen.getByRole('button', { name: /Generate/i });
      expect(generateButton).toBeDisabled();
    });

    it('should keep Generate button disabled when prompt contains only whitespace', async () => {
      const user = userEvent.setup();
      render(<AIPromptInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      await user.type(textarea, '   \n  ');

      const generateButton = screen.getByRole('button', { name: /Generate/i });
      expect(generateButton).toBeDisabled();
      expect(screen.getByText('Prompt cannot be empty')).toBeInTheDocument();
    });

    it('should enable Generate button when valid prompt is entered', async () => {
      const user = userEvent.setup();
      render(<AIPromptInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      await user.type(textarea, 'Help me write an introduction');

      const generateButton = screen.getByRole('button', { name: /Generate/i });
      expect(generateButton).not.toBeDisabled();
    });

    it('should update character count as user types', async () => {
      const user = userEvent.setup();
      render(<AIPromptInput {...defaultProps} maxLength={50} />);

      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      await user.type(textarea, 'Hello world'); // 11 characters

      expect(screen.getByText('39 characters remaining')).toBeInTheDocument();
    });

    it('should show warning when near character limit', async () => {
      const user = userEvent.setup();
      render(<AIPromptInput {...defaultProps} maxLength={20} />);

      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      await user.type(textarea, 'Hello world'); // 11 chars, 9 remaining (< 50)

      const counter = screen.getByText('9 characters remaining');
      expect(counter).toHaveClass('text-warning');
    });

    it('should show error when character limit exceeded', async () => {
      render(<AIPromptInput {...defaultProps} maxLength={10} />);

      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      fireEvent.change(textarea, { target: { value: 'This is a long prompt that exceeds 10 chars' } });

      expect(screen.getByText('Prompt is too long')).toBeInTheDocument();

      const generateButton = screen.getByRole('button', { name: /Generate/i });
      expect(generateButton).toBeDisabled();

      // Textarea should have destructive border class
      expect(textarea).toHaveClass('border-destructive');
    });
  });

  describe('Submission & Cancellation', () => {
    it('should call onSubmit with trimmed prompt when Generate is clicked', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AIPromptInput {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      await user.type(textarea, '  My test prompt  ');

      const generateButton = screen.getByRole('button', { name: /Generate/i });
      await user.click(generateButton);

      expect(onSubmit).toHaveBeenCalledWith('My test prompt');
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should clear the input after successful submission', async () => {
      const user = userEvent.setup();
      render(<AIPromptInput {...defaultProps} />);

      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      await user.type(textarea, 'Test prompt');

      const generateButton = screen.getByRole('button', { name: /Generate/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    it('should not clear the input if submission fails', async () => {
      const user = userEvent.setup();

      // Prevent console.error from polluting test output
      const originalConsoleError = console.error;
      console.error = vi.fn();

      const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
      render(<AIPromptInput {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      await user.type(textarea, 'Test prompt');

      const generateButton = screen.getByRole('button', { name: /Generate/i });
      await user.click(generateButton);

      expect(textarea).toHaveValue('Test prompt');

      // Restore console.error
      console.error = originalConsoleError;
    });

    it('should call onCancel when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<AIPromptInput {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when header close (X) button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<AIPromptInput {...defaultProps} onCancel={onCancel} />);

      const closeButton = screen.getByRole('button', { name: /Cancel prompt/i });
      await user.click(closeButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should submit on Ctrl+Enter', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AIPromptInput {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      await user.type(textarea, 'Test prompt');

      await user.keyboard('{Control>}{Enter}{/Control}');

      expect(onSubmit).toHaveBeenCalledWith('Test prompt');
    });

    it('should submit on Meta+Enter (Mac Cmd+Enter)', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<AIPromptInput {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      await user.type(textarea, 'Test prompt');

      await user.keyboard('{Meta>}{Enter}{/Meta}');

      expect(onSubmit).toHaveBeenCalledWith('Test prompt');
    });

    it('should cancel on Escape', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(<AIPromptInput {...defaultProps} onCancel={onCancel} />);

      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      textarea.focus();
      await user.keyboard('{Escape}');

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should do nothing on regular Enter key (just adds newline)', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<AIPromptInput {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      await user.type(textarea, 'Test prompt');

      await user.keyboard('{Enter}');

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Prompt Suggestions', () => {
    it('should toggle suggestions list when lightbulb button is clicked', async () => {
      const user = userEvent.setup();
      render(<AIPromptInput {...defaultProps} />);

      // Suggestions should not be visible initially
      expect(screen.queryByText('Suggestions (click to use):')).not.toBeInTheDocument();

      const suggestionsButton = screen.getByRole('button', { name: /Show prompt suggestions/i });
      await user.click(suggestionsButton);

      // Suggestions should now be visible
      expect(screen.getByText('Suggestions (click to use):')).toBeInTheDocument();
      expect(screen.getByText('Write an introduction for my thesis proposal')).toBeInTheDocument();

      // Click again to hide
      await user.click(suggestionsButton);
      expect(screen.queryByText('Suggestions (click to use):')).not.toBeInTheDocument();
    });

    it('should populate textarea and hide suggestions when a suggestion is clicked', async () => {
      const user = userEvent.setup();
      render(<AIPromptInput {...defaultProps} />);

      // Open suggestions
      const suggestionsButton = screen.getByRole('button', { name: /Show prompt suggestions/i });
      await user.click(suggestionsButton);

      // Click a suggestion
      const suggestion = screen.getByText('Write a conclusion paragraph');
      await user.click(suggestion);

      // Textarea should have the suggestion text
      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      expect(textarea).toHaveValue('Write a conclusion paragraph');

      // Suggestions should be hidden
      expect(screen.queryByText('Suggestions (click to use):')).not.toBeInTheDocument();
    });
  });

  describe('Processing State', () => {
    it('should disable inputs and buttons when isProcessing is true', () => {
      render(<AIPromptInput {...defaultProps} isProcessing={true} />);

      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      expect(textarea).toBeDisabled();

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toBeDisabled();

      const generateButton = screen.getByRole('button', { name: /Generating/i });
      expect(generateButton).toBeDisabled();
    });

    it('should show loading state on Generate button when isProcessing is true', () => {
      render(<AIPromptInput {...defaultProps} isProcessing={true} />);

      const generateButton = screen.getByRole('button', { name: /Generating/i });
      expect(generateButton).toBeInTheDocument();
      expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
      expect(screen.queryByTestId('icon-send')).not.toBeInTheDocument();
    });

    it('should not call onSubmit if isProcessing is true even if valid', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      // First render without processing to set value
      const { rerender } = render(<AIPromptInput {...defaultProps} onSubmit={onSubmit} />);

      const textarea = screen.getByRole('textbox', { name: /AI Prompt/i });
      await user.type(textarea, 'Test prompt');

      // Re-render with processing state true
      rerender(<AIPromptInput {...defaultProps} onSubmit={onSubmit} isProcessing={true} />);

      // Button should be disabled, but we can also test the keyboard shortcut
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
