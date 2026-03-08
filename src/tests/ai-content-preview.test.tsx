import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIContentPreview } from '@/components/ui/ai-content-preview';
import { ModificationType } from '@/lib/ai-types';

// Mock the tooltip provider to avoid portal issues in tests
vi.mock('@/components/ui/shadcn/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? children : <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Check: () => <div data-testid="icon-check">Check</div>,
  X: () => <div data-testid="icon-x">X</div>,
  RefreshCw: ({ className }: { className?: string }) => <div data-testid="icon-refresh" className={className}>RefreshCw</div>,
  Eye: () => <div data-testid="icon-eye">Eye</div>,
  EyeOff: () => <div data-testid="icon-eye-off">EyeOff</div>,
  Copy: () => <div data-testid="icon-copy">Copy</div>,
  Sparkles: () => <div data-testid="icon-sparkles">Sparkles</div>,
}));

// Mock clipboard API
const mockWriteText = vi.fn().mockImplementation(() => Promise.resolve());

// Mock clipboard API differently to avoid user-event conflicts
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
  configurable: true,
});

// Since userEvent interacts with the clipboard in complex ways in JSDOM,
// we will mock the copy functionality directly on the component or use fireEvent.

describe('AIContentPreview', () => {
  const defaultProps = {
    originalText: 'This is the original text.',
    modifiedText: 'This is the improved modified text.',
    modificationType: ModificationType.IMPROVE_CLARITY,
    onAccept: vi.fn(),
    onReject: vi.fn(),
    isVisible: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render anything when isVisible is false', () => {
      const { container } = render(<AIContentPreview {...defaultProps} isVisible={false} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('should render the modified text by default', () => {
      render(<AIContentPreview {...defaultProps} />);

      expect(screen.getByText('This is the improved modified text.')).toBeInTheDocument();
      // Original text should not be visible by default
      expect(screen.queryByText('This is the original text.')).not.toBeInTheDocument();
      expect(screen.getAllByText('Clarity Improved Content').length).toBeGreaterThan(0);
    });

    it('should render diff comparison when toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<AIContentPreview {...defaultProps} />);

      const toggleButton = screen.getByLabelText('Show comparison');
      await user.click(toggleButton);

      expect(screen.getByText('Original')).toBeInTheDocument();
      expect(screen.getByText('This is the original text.')).toBeInTheDocument();
      expect(screen.getByText('Clarity Improved')).toBeInTheDocument();
      expect(screen.getByText('This is the improved modified text.')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<AIContentPreview {...defaultProps} className="custom-test-class" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-test-class');
    });
  });

  describe('Interaction', () => {
    it('should call onAccept when apply changes is clicked', async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();
      render(<AIContentPreview {...defaultProps} onAccept={onAccept} />);

      const acceptButton = screen.getByTestId('accept-button');
      await user.click(acceptButton);

      expect(onAccept).toHaveBeenCalledTimes(1);
    });

    it('should call onReject when cancel is clicked', async () => {
      const user = userEvent.setup();
      const onReject = vi.fn();
      render(<AIContentPreview {...defaultProps} onReject={onReject} />);

      const rejectButton = screen.getByTestId('reject-button');
      await user.click(rejectButton);

      expect(onReject).toHaveBeenCalledTimes(1);
    });

    it('should call onReject when close (X) is clicked', async () => {
      const user = userEvent.setup();
      const onReject = vi.fn();
      render(<AIContentPreview {...defaultProps} onReject={onReject} />);

      const closeButton = screen.getByLabelText('Close preview');
      await user.click(closeButton);

      expect(onReject).toHaveBeenCalledTimes(1);
    });
  });

  describe('Regeneration', () => {
    it('should not render regenerate button if onRegenerate is not provided', () => {
      render(<AIContentPreview {...defaultProps} />);
      expect(screen.queryByTestId('regenerate-button')).not.toBeInTheDocument();
    });

    it('should render regenerate button if onRegenerate is provided', () => {
      render(<AIContentPreview {...defaultProps} onRegenerate={vi.fn()} />);
      expect(screen.getByTestId('regenerate-button')).toBeInTheDocument();
    });

    it('should call onRegenerate when clicked', async () => {
      const user = userEvent.setup();
      const onRegenerate = vi.fn();
      render(<AIContentPreview {...defaultProps} onRegenerate={onRegenerate} />);

      const regenerateButton = screen.getByTestId('regenerate-button');
      await user.click(regenerateButton);

      expect(onRegenerate).toHaveBeenCalledTimes(1);
    });

    it('should disable buttons and show processing state when isRegenerating is true', () => {
      render(<AIContentPreview {...defaultProps} onRegenerate={vi.fn()} isRegenerating={true} />);

      expect(screen.getByTestId('accept-button')).toBeDisabled();
      expect(screen.getByTestId('reject-button')).toBeDisabled();
      expect(screen.getByTestId('regenerate-button')).toBeDisabled();
      expect(screen.getByLabelText('Show comparison')).toBeDisabled();
      expect(screen.getByLabelText('Copy modified text')).toBeDisabled();
      expect(screen.getByLabelText('Close preview')).toBeDisabled();

      expect(screen.getByText('Regenerating...')).toBeInTheDocument();
      expect(screen.getByText('Regenerating content...')).toBeInTheDocument();

      const refreshIcon = screen.getByTestId('icon-refresh');
      expect(refreshIcon).toHaveClass('animate-spin');
    });

    it('should not call callbacks when regenerating', async () => {
      const user = userEvent.setup();
      const onAccept = vi.fn();
      const onReject = vi.fn();
      const onRegenerate = vi.fn();

      render(
        <AIContentPreview
          {...defaultProps}
          onAccept={onAccept}
          onReject={onReject}
          onRegenerate={onRegenerate}
          isRegenerating={true}
        />
      );

      const acceptButton = screen.getByTestId('accept-button');
      const rejectButton = screen.getByTestId('reject-button');
      const regenerateButton = screen.getByTestId('regenerate-button');

      await user.click(acceptButton);
      await user.click(rejectButton);
      await user.click(regenerateButton);

      expect(onAccept).not.toHaveBeenCalled();
      expect(onReject).not.toHaveBeenCalled();
      expect(onRegenerate).not.toHaveBeenCalled();
    });
  });

  describe('Copy to Clipboard', () => {
    let originalClipboard: any;

    beforeEach(() => {
      originalClipboard = { ...navigator.clipboard };
      Object.assign(navigator.clipboard, {
        writeText: vi.fn().mockResolvedValue(undefined),
      });
    });

    afterEach(() => {
      Object.assign(navigator.clipboard, originalClipboard);
    });

    it('should copy modified text to clipboard when copy button is clicked', async () => {
      render(<AIContentPreview {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: 'Copy modified text' });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('This is the improved modified text.');
      });
    });

    it('should show "Copied!" tooltip temporarily', async () => {
      render(<AIContentPreview {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: 'Copy modified text' });
      fireEvent.click(copyButton);

      expect(await screen.findByText('Copied!')).toBeInTheDocument();
    });

    it('should handle clipboard error gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockErrorText = vi.fn().mockRejectedValue(new Error('Clipboard error'));

      // The original setup works except when mocking fails inside jsdom
      Object.assign(navigator.clipboard, { writeText: mockErrorText });

      render(<AIContentPreview {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: 'Copy modified text' });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockErrorText).toHaveBeenCalledWith('This is the improved modified text.');
      });
      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to copy to clipboard:', expect.any(Error));
      });

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Modification Type Labels', () => {
    it('should display correct label for PROMPT type', () => {
      render(<AIContentPreview {...defaultProps} modificationType={ModificationType.PROMPT} />);
      expect(screen.getAllByText('Custom Modified Content').length).toBeGreaterThan(0);
    });

    it('should display correct label for SHORTEN type', () => {
      render(<AIContentPreview {...defaultProps} modificationType={ModificationType.SHORTEN} />);
      expect(screen.getAllByText('Shortened Content').length).toBeGreaterThan(0);
    });

    it('should display correct label for REWRITE type', () => {
      render(<AIContentPreview {...defaultProps} modificationType={ModificationType.REWRITE} />);
      expect(screen.getAllByText('Rewritten Content').length).toBeGreaterThan(0);
    });
  });
});
