import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIActionToolbar } from '@/components/ui/ai-action-toolbar';
import { AIMode } from '@/lib/ai-types';

// Mock the tooltip provider to avoid portal issues in tests
vi.mock('@/components/ui/shadcn/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => 
    asChild ? children : <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}));

describe('AIActionToolbar', () => {
  const defaultProps = {
    currentMode: AIMode.NONE,
    onModeChange: vi.fn(),
    hasSelectedText: false,
    isAIProcessing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the toolbar with AI indicator', () => {
      render(<AIActionToolbar {...defaultProps} />);
      
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
      expect(screen.getByLabelText('AI assistance modes')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('should render all mode buttons', () => {
      render(<AIActionToolbar {...defaultProps} />);
      
      expect(screen.getByTestId('ai-mode-prompt')).toBeInTheDocument();
      expect(screen.getByTestId('ai-mode-continue')).toBeInTheDocument();
      expect(screen.getByTestId('ai-mode-modify')).toBeInTheDocument();
      
      // Check button labels using getAllByText since text appears in both button and tooltip
      expect(screen.getAllByText('Prompt')).toHaveLength(2); // Button + tooltip
      expect(screen.getAllByText('Continue')).toHaveLength(2); // Button + tooltip
      expect(screen.getAllByText('Modify')).toHaveLength(2); // Button + tooltip
    });

    it('should apply custom className', () => {
      const { container } = render(
        <AIActionToolbar {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Mode Selection', () => {
    it('should call onModeChange when clicking a mode button', () => {
      const onModeChange = vi.fn();
      render(<AIActionToolbar {...defaultProps} onModeChange={onModeChange} />);
      
      fireEvent.click(screen.getByTestId('ai-mode-prompt'));
      expect(onModeChange).toHaveBeenCalledWith(AIMode.PROMPT);
    });

    it('should toggle mode when clicking the same active mode', () => {
      const onModeChange = vi.fn();
      render(
        <AIActionToolbar 
          {...defaultProps} 
          currentMode={AIMode.PROMPT}
          onModeChange={onModeChange} 
        />
      );
      
      fireEvent.click(screen.getByTestId('ai-mode-prompt'));
      expect(onModeChange).toHaveBeenCalledWith(AIMode.NONE);
    });

    it('should switch to different mode when clicking another mode', () => {
      const onModeChange = vi.fn();
      render(
        <AIActionToolbar 
          {...defaultProps} 
          currentMode={AIMode.PROMPT}
          onModeChange={onModeChange} 
        />
      );
      
      fireEvent.click(screen.getByTestId('ai-mode-continue'));
      expect(onModeChange).toHaveBeenCalledWith(AIMode.CONTINUE);
    });
  });

  describe('Visual Indicators', () => {
    it('should show active state for current mode', () => {
      render(
        <AIActionToolbar {...defaultProps} currentMode={AIMode.PROMPT} />
      );
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      expect(promptButton).toHaveAttribute('aria-pressed', 'true');
      expect(promptButton).toHaveClass('bg-primary');
    });

    it('should show inactive state for non-current modes', () => {
      render(
        <AIActionToolbar {...defaultProps} currentMode={AIMode.PROMPT} />
      );
      
      const continueButton = screen.getByTestId('ai-mode-continue');
      expect(continueButton).toHaveAttribute('aria-pressed', 'false');
      expect(continueButton).not.toHaveClass('bg-primary');
    });

    it('should show processing indicator when AI is processing', () => {
      render(
        <AIActionToolbar 
          {...defaultProps} 
          isAIProcessing={true}
          currentMode={AIMode.PROMPT}
        />
      );
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      // Should show spinner instead of regular icon for active mode
      expect(screen.getByTestId('ai-mode-prompt').querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Disabled States', () => {
    

    it('should enable modify mode when text is selected', () => {
      render(
        <AIActionToolbar {...defaultProps} hasSelectedText={true} />
      );
      
      const modifyButton = screen.getByTestId('ai-mode-modify');
      expect(modifyButton).not.toBeDisabled();
      expect(modifyButton).not.toHaveClass('opacity-50');
    });

    it('should disable all buttons when AI is processing', () => {
      render(
        <AIActionToolbar {...defaultProps} isAIProcessing={true} />
      );
      
      expect(screen.getByTestId('ai-mode-prompt')).toBeDisabled();
      expect(screen.getByTestId('ai-mode-continue')).toBeDisabled();
      expect(screen.getByTestId('ai-mode-modify')).toBeDisabled();
    });

    it('should not call onModeChange when clicking disabled buttons', () => {
      const onModeChange = vi.fn();
      render(
        <AIActionToolbar 
          {...defaultProps} 
          onModeChange={onModeChange}
          isAIProcessing={true}
        />
      );
      
      fireEvent.click(screen.getByTestId('ai-mode-prompt'));
      expect(onModeChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AIActionToolbar {...defaultProps} />);
      
      expect(screen.getByRole('toolbar')).toHaveAttribute('aria-label', 'AI assistance modes');
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      expect(promptButton).toHaveAttribute('aria-label', 'Prompt mode');
    });

    it('should update ARIA labels for active state', () => {
      render(
        <AIActionToolbar {...defaultProps} currentMode={AIMode.PROMPT} />
      );
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      expect(promptButton).toHaveAttribute('aria-label', 'Prompt mode (active)');
    });

    it('should update ARIA labels for disabled state', () => {
      render(
        <AIActionToolbar {...defaultProps} hasSelectedText={false} />
      );
      
      const modifyButton = screen.getByTestId('ai-mode-modify');
      expect(modifyButton).toHaveAttribute('aria-label', 'Modify mode (disabled)');
    });

    it('should have proper aria-pressed attributes', () => {
      render(
        <AIActionToolbar {...defaultProps} currentMode={AIMode.CONTINUE} />
      );
      
      expect(screen.getByTestId('ai-mode-prompt')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('ai-mode-continue')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('ai-mode-modify')).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Tooltips', () => {
    it('should render tooltip content for each mode', () => {
      render(<AIActionToolbar {...defaultProps} />);
      
      // Check that tooltip content is rendered (mocked)
      const tooltips = screen.getAllByTestId('tooltip-content');
      expect(tooltips).toHaveLength(3); // One for each mode
    });

    it('should show mode descriptions in tooltips', () => {
      render(<AIActionToolbar {...defaultProps} />);
      
      expect(screen.getByText(/Generate content from a custom prompt/)).toBeInTheDocument();
      expect(screen.getByText(/Continue generating content from your current cursor/)).toBeInTheDocument();
      expect(screen.getByText(/Modify selected text with AI assistance/)).toBeInTheDocument();
    });

    it('should show keyboard shortcuts in tooltips', () => {
      render(<AIActionToolbar {...defaultProps} />);
      
      expect(screen.getByText('Ctrl+P')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+Enter')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+M')).toBeInTheDocument();
    });

    it('should show selection requirement warning for modify mode when no text selected', () => {
      render(<AIActionToolbar {...defaultProps} hasSelectedText={false} />);
      
      expect(screen.getByText('Requires text selection')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined className gracefully', () => {
      const { container } = render(
        <AIActionToolbar {...defaultProps} className={undefined} />
      );
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle rapid mode changes', async () => {
      const onModeChange = vi.fn();
      render(<AIActionToolbar {...defaultProps} onModeChange={onModeChange} />);
      
      // Rapidly click different modes
      fireEvent.click(screen.getByTestId('ai-mode-prompt'));
      fireEvent.click(screen.getByTestId('ai-mode-continue'));
      fireEvent.click(screen.getByTestId('ai-mode-prompt'));
      
      await waitFor(() => {
        expect(onModeChange).toHaveBeenCalledTimes(3);
      });
      
      expect(onModeChange).toHaveBeenNthCalledWith(1, AIMode.PROMPT);
      expect(onModeChange).toHaveBeenNthCalledWith(2, AIMode.CONTINUE);
      expect(onModeChange).toHaveBeenNthCalledWith(3, AIMode.PROMPT);
    });

    it('should maintain state consistency during processing', () => {
      const { rerender } = render(
        <AIActionToolbar 
          {...defaultProps} 
          currentMode={AIMode.PROMPT}
          isAIProcessing={false}
        />
      );
      
      // Start processing
      rerender(
        <AIActionToolbar 
          {...defaultProps} 
          currentMode={AIMode.PROMPT}
          isAIProcessing={true}
        />
      );
      
      // Mode should still be active but buttons should be disabled
      expect(screen.getByTestId('ai-mode-prompt')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('ai-mode-prompt')).toBeDisabled();
    });
  });
});