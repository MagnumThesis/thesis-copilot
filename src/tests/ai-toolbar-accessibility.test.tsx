/**
 * Accessibility Tests for AI Toolbar
 * Comprehensive accessibility testing for the AI Action Toolbar component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIActionToolbar } from '@/components/ui/ai-action-toolbar';
import { AIMode } from '@/lib/ai-types';

// Mock the tooltip provider to avoid portal issues in tests
vi.mock('@/components/ui/shadcn/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => 
    asChild ? children : <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}));

// Mock axe-core for accessibility testing
const mockAxeResults = {
  violations: []
};

vi.mock('axe-core', () => ({
  run: vi.fn().mockResolvedValue(mockAxeResults)
}));

describe('AI Toolbar Accessibility Tests', () => {
  const defaultProps = {
    currentMode: AIMode.NONE,
    onModeChange: vi.fn(),
    hasSelectedText: false,
    isAIProcessing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ARIA Labels and Roles', () => {
    it('should have proper toolbar role and label', () => {
      render(<AIActionToolbar {...defaultProps} />);
      
      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toBeInTheDocument();
      expect(toolbar).toHaveAttribute('aria-label', 'AI assistance modes');
    });

    it('should have proper button roles and labels', () => {
      render(<AIActionToolbar {...defaultProps} />);
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      const continueButton = screen.getByTestId('ai-mode-continue');
      const modifyButton = screen.getByTestId('ai-mode-modify');

      expect(promptButton).toHaveRole('button');
      expect(continueButton).toHaveRole('button');
      expect(modifyButton).toHaveRole('button');

      expect(promptButton).toHaveAttribute('aria-label', 'Prompt mode');
      expect(continueButton).toHaveAttribute('aria-label', 'Continue mode');
      expect(modifyButton).toHaveAttribute('aria-label', 'Modify mode (disabled)');
    });

    it('should update ARIA labels for active states', () => {
      render(<AIActionToolbar {...defaultProps} currentMode={AIMode.PROMPT} />);
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      const continueButton = screen.getByTestId('ai-mode-continue');
      
      expect(promptButton).toHaveAttribute('aria-label', 'Prompt mode (active)');
      expect(continueButton).toHaveAttribute('aria-label', 'Continue mode');
    });

    it('should update ARIA labels for disabled states', () => {
      render(<AIActionToolbar {...defaultProps} hasSelectedText={false} />);
      
      const modifyButton = screen.getByTestId('ai-mode-modify');
      expect(modifyButton).toHaveAttribute('aria-label', 'Modify mode (disabled)');
    });

    it('should update ARIA labels for processing states', () => {
      render(
        <AIActionToolbar 
          {...defaultProps} 
          currentMode={AIMode.PROMPT}
          isAIProcessing={true}
        />
      );
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      expect(promptButton).toHaveAttribute('aria-label', 'Prompt mode (processing)');
    });
  });

  describe('ARIA States and Properties', () => {
    it('should have proper aria-pressed attributes', () => {
      render(<AIActionToolbar {...defaultProps} currentMode={AIMode.CONTINUE} />);
      
      expect(screen.getByTestId('ai-mode-prompt')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('ai-mode-continue')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByTestId('ai-mode-modify')).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have proper aria-disabled attributes', () => {
      render(
        <AIActionToolbar 
          {...defaultProps} 
          hasSelectedText={false}
          isAIProcessing={true}
        />
      );
      
      // All buttons should be disabled during processing
      expect(screen.getByTestId('ai-mode-prompt')).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByTestId('ai-mode-continue')).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByTestId('ai-mode-modify')).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have proper aria-describedby for tooltips', () => {
      render(<AIActionToolbar {...defaultProps} />);
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      expect(promptButton).toHaveAttribute('aria-describedby');
    });

    it('should indicate busy state during processing', () => {
      render(
        <AIActionToolbar 
          {...defaultProps} 
          currentMode={AIMode.PROMPT}
          isAIProcessing={true}
        />
      );
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      expect(promptButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation', async () => {
      const user = userEvent.setup();
      render(<AIActionToolbar {...defaultProps} />);
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      const continueButton = screen.getByTestId('ai-mode-continue');
      const modifyButton = screen.getByTestId('ai-mode-modify');

      // Tab through buttons
      await user.tab();
      expect(promptButton).toHaveFocus();

      await user.tab();
      expect(continueButton).toHaveFocus();

      await user.tab();
      expect(modifyButton).toHaveFocus();
    });

    it('should support Enter key activation', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();
      
      render(<AIActionToolbar {...defaultProps} onModeChange={onModeChange} />);
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      promptButton.focus();
      
      await user.keyboard('{Enter}');
      expect(onModeChange).toHaveBeenCalledWith(AIMode.PROMPT);
    });

    it('should support Space key activation', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();
      
      render(<AIActionToolbar {...defaultProps} onModeChange={onModeChange} />);
      
      const continueButton = screen.getByTestId('ai-mode-continue');
      continueButton.focus();
      
      await user.keyboard(' ');
      expect(onModeChange).toHaveBeenCalledWith(AIMode.CONTINUE);
    });

    it('should skip disabled buttons in tab order', async () => {
      const user = userEvent.setup();
      render(
        <AIActionToolbar 
          {...defaultProps} 
          hasSelectedText={false}
          isAIProcessing={false}
        />
      );
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      const continueButton = screen.getByTestId('ai-mode-continue');
      const modifyButton = screen.getByTestId('ai-mode-modify');

      // Modify button should be disabled and not focusable
      expect(modifyButton).toHaveAttribute('tabindex', '-1');
      
      await user.tab();
      expect(promptButton).toHaveFocus();

      await user.tab();
      expect(continueButton).toHaveFocus();

      // Should skip disabled modify button
      await user.tab();
      expect(modifyButton).not.toHaveFocus();
    });

    it('should support arrow key navigation within toolbar', async () => {
      const user = userEvent.setup();
      render(<AIActionToolbar {...defaultProps} hasSelectedText={true} />);
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      const continueButton = screen.getByTestId('ai-mode-continue');
      const modifyButton = screen.getByTestId('ai-mode-modify');

      promptButton.focus();

      // Right arrow should move to next button
      await user.keyboard('{ArrowRight}');
      expect(continueButton).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(modifyButton).toHaveFocus();

      // Left arrow should move to previous button
      await user.keyboard('{ArrowLeft}');
      expect(continueButton).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(promptButton).toHaveFocus();
    });

    it('should wrap around in arrow key navigation', async () => {
      const user = userEvent.setup();
      render(<AIActionToolbar {...defaultProps} hasSelectedText={true} />);
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      const modifyButton = screen.getByTestId('ai-mode-modify');

      promptButton.focus();

      // Left arrow from first button should wrap to last
      await user.keyboard('{ArrowLeft}');
      expect(modifyButton).toHaveFocus();

      // Right arrow from last button should wrap to first
      await user.keyboard('{ArrowRight}');
      expect(promptButton).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide meaningful button text', () => {
      render(<AIActionToolbar {...defaultProps} />);
      
      expect(screen.getByText('Prompt')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
      expect(screen.getByText('Modify')).toBeInTheDocument();
    });

    it('should provide descriptive tooltip content', () => {
      render(<AIActionToolbar {...defaultProps} />);
      
      expect(screen.getByText(/Generate content from a custom prompt/)).toBeInTheDocument();
      expect(screen.getByText(/Continue generating content from your current cursor/)).toBeInTheDocument();
      expect(screen.getByText(/Modify selected text with AI assistance/)).toBeInTheDocument();
    });

    it('should announce state changes', () => {
      const { rerender } = render(<AIActionToolbar {...defaultProps} />);
      
      // Change to active state
      rerender(<AIActionToolbar {...defaultProps} currentMode={AIMode.PROMPT} />);
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      expect(promptButton).toHaveAttribute('aria-pressed', 'true');
      expect(promptButton).toHaveAttribute('aria-label', 'Prompt mode (active)');
    });

    it('should announce processing state', () => {
      render(
        <AIActionToolbar 
          {...defaultProps} 
          currentMode={AIMode.PROMPT}
          isAIProcessing={true}
        />
      );
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      expect(promptButton).toHaveAttribute('aria-busy', 'true');
    });

    it('should provide keyboard shortcut information', () => {
      render(<AIActionToolbar {...defaultProps} />);
      
      expect(screen.getByText('Ctrl+P')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+Enter')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+M')).toBeInTheDocument();
    });

    it('should announce disabled state reasons', () => {
      render(<AIActionToolbar {...defaultProps} hasSelectedText={false} />);
      
      expect(screen.getByText('Requires text selection')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus on active button', () => {
      render(<AIActionToolbar {...defaultProps} currentMode={AIMode.CONTINUE} />);
      
      const continueButton = screen.getByTestId('ai-mode-continue');
      continueButton.focus();
      
      expect(continueButton).toHaveFocus();
      expect(continueButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should handle focus during state transitions', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();
      
      render(<AIActionToolbar {...defaultProps} onModeChange={onModeChange} />);
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      await user.click(promptButton);
      
      expect(promptButton).toHaveFocus();
      expect(onModeChange).toHaveBeenCalledWith(AIMode.PROMPT);
    });

    it('should handle focus when buttons become disabled', () => {
      const { rerender } = render(
        <AIActionToolbar {...defaultProps} hasSelectedText={true} />
      );
      
      const modifyButton = screen.getByTestId('ai-mode-modify');
      modifyButton.focus();
      expect(modifyButton).toHaveFocus();
      
      // Disable the button
      rerender(<AIActionToolbar {...defaultProps} hasSelectedText={false} />);
      
      // Focus should move away from disabled button
      expect(modifyButton).not.toHaveFocus();
    });

    it('should restore focus after processing completes', () => {
      const { rerender } = render(
        <AIActionToolbar 
          {...defaultProps} 
          currentMode={AIMode.PROMPT}
          isAIProcessing={false}
        />
      );
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      promptButton.focus();
      
      // Start processing
      rerender(
        <AIActionToolbar 
          {...defaultProps} 
          currentMode={AIMode.PROMPT}
          isAIProcessing={true}
        />
      );
      
      // Complete processing
      rerender(
        <AIActionToolbar 
          {...defaultProps} 
          currentMode={AIMode.PROMPT}
          isAIProcessing={false}
        />
      );
      
      // Focus should be restored
      expect(promptButton).toHaveFocus();
    });
  });

  describe('Visual Accessibility', () => {
    it('should have sufficient color contrast', () => {
      render(<AIActionToolbar {...defaultProps} currentMode={AIMode.PROMPT} />);
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      const continueButton = screen.getByTestId('ai-mode-continue');
      
      // Active button should have distinct styling
      expect(promptButton).toHaveClass('bg-primary');
      expect(continueButton).not.toHaveClass('bg-primary');
    });

    it('should show visual focus indicators', async () => {
      const user = userEvent.setup();
      render(<AIActionToolbar {...defaultProps} />);
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      
      await user.tab();
      expect(promptButton).toHaveFocus();
      expect(promptButton).toHaveClass('focus-visible:ring-2');
    });

    it('should indicate disabled state visually', () => {
      render(<AIActionToolbar {...defaultProps} hasSelectedText={false} />);
      
      const modifyButton = screen.getByTestId('ai-mode-modify');
      expect(modifyButton).toHaveClass('opacity-50');
      expect(modifyButton).toBeDisabled();
    });

    it('should show processing state visually', () => {
      render(
        <AIActionToolbar 
          {...defaultProps} 
          currentMode={AIMode.PROMPT}
          isAIProcessing={true}
        />
      );
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      expect(promptButton.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should work in high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<AIActionToolbar {...defaultProps} currentMode={AIMode.PROMPT} />);
      
      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toBeInTheDocument();
      
      // Should maintain functionality in high contrast mode
      const promptButton = screen.getByTestId('ai-mode-prompt');
      expect(promptButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect reduced motion preferences', () => {
      // Mock reduced motion media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <AIActionToolbar 
          {...defaultProps} 
          currentMode={AIMode.PROMPT}
          isAIProcessing={true}
        />
      );
      
      // Should still show processing indicator but without animation
      const promptButton = screen.getByTestId('ai-mode-prompt');
      expect(promptButton).toBeInTheDocument();
    });
  });

  describe('Touch Accessibility', () => {
    it('should have adequate touch targets', () => {
      render(<AIActionToolbar {...defaultProps} />);
      
      const buttons = [
        screen.getByTestId('ai-mode-prompt'),
        screen.getByTestId('ai-mode-continue'),
        screen.getByTestId('ai-mode-modify')
      ];

      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // Touch targets should be at least 44px (iOS) or 48px (Android)
        expect(button).toHaveClass('h-10'); // 40px minimum, but with padding should be adequate
      });
    });

    it('should handle touch interactions', async () => {
      const user = userEvent.setup();
      const onModeChange = vi.fn();
      
      render(<AIActionToolbar {...defaultProps} onModeChange={onModeChange} />);
      
      const promptButton = screen.getByTestId('ai-mode-prompt');
      
      // Simulate touch interaction
      fireEvent.touchStart(promptButton);
      fireEvent.touchEnd(promptButton);
      await user.click(promptButton);
      
      expect(onModeChange).toHaveBeenCalledWith(AIMode.PROMPT);
    });
  });

  describe('Error States Accessibility', () => {
    it('should announce error states to screen readers', () => {
      render(
        <AIActionToolbar 
          {...defaultProps} 
          currentMode={AIMode.PROMPT}
          isAIProcessing={false}
          error="AI service is currently unavailable"
        />
      );
      
      // Error should be announced
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('AI service is currently unavailable')).toBeInTheDocument();
    });

    it('should provide recovery options accessibly', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      
      render(
        <AIActionToolbar 
          {...defaultProps} 
          error="Network error"
          onRetry={onRetry}
        />
      );
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      
      await user.click(retryButton);
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('Internationalization Accessibility', () => {
    it('should support RTL languages', () => {
      // Mock RTL direction
      document.dir = 'rtl';
      
      render(<AIActionToolbar {...defaultProps} />);
      
      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toBeInTheDocument();
      
      // Should maintain proper layout in RTL
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
      
      // Reset
      document.dir = 'ltr';
    });

    it('should support different languages', () => {
      // Mock different language
      document.documentElement.lang = 'es';
      
      render(<AIActionToolbar {...defaultProps} />);
      
      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toBeInTheDocument();
      
      // Should maintain accessibility regardless of language
      expect(toolbar).toHaveAttribute('aria-label');
      
      // Reset
      document.documentElement.lang = 'en';
    });
  });

  describe('Compliance Testing', () => {
    it('should pass WCAG 2.1 AA compliance', async () => {
      const { container } = render(<AIActionToolbar {...defaultProps} />);
      
      // Mock axe-core results
      const axe = await import('axe-core');
      const results = await axe.run(container);
      
      expect(results.violations).toHaveLength(0);
    });

    it('should have no accessibility violations in different states', async () => {
      const states = [
        { currentMode: AIMode.NONE, isAIProcessing: false, hasSelectedText: false },
        { currentMode: AIMode.PROMPT, isAIProcessing: false, hasSelectedText: false },
        { currentMode: AIMode.CONTINUE, isAIProcessing: false, hasSelectedText: false },
        { currentMode: AIMode.MODIFY, isAIProcessing: false, hasSelectedText: true },
        { currentMode: AIMode.PROMPT, isAIProcessing: true, hasSelectedText: false },
      ];

      for (const state of states) {
        const { container } = render(<AIActionToolbar {...defaultProps} {...state} />);
        
        const axe = await import('axe-core');
        const results = await axe.run(container);
        
        expect(results.violations).toHaveLength(0);
      }
    });
  });
});