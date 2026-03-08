import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIContentConfirmation } from '@/components/ui/ai-content-confirmation';

// Mock the tooltip provider to avoid portal issues in tests
vi.mock('@/components/ui/shadcn/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? children : <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}));

// Mock clipboard API
const mockWriteText = vi.fn().mockImplementation(() => Promise.resolve());
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('AIContentConfirmation', () => {
  const defaultProps = {
    content: 'Generated AI content',
    onAccept: vi.fn(),
    onReject: vi.fn(),
    onRegenerate: vi.fn(),
    isVisible: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null when isVisible is false', () => {
    const { container } = render(<AIContentConfirmation {...defaultProps} isVisible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render basic content and title', () => {
    render(<AIContentConfirmation {...defaultProps} />);

    expect(screen.getByText('AI Generated Content')).toBeInTheDocument();
    expect(screen.getByText('Generated AI content')).toBeInTheDocument();
    expect(screen.getByText(/Review the generated content below/)).toBeInTheDocument();
  });

  it('should render metadata when provided', () => {
    const metadata = {
      processingTime: 500,
      tokensUsed: 100,
    };
    render(<AIContentConfirmation {...defaultProps} metadata={metadata} />);

    expect(screen.getByText('500ms')).toBeInTheDocument();
    expect(screen.getByText(/100 tokens/)).toBeInTheDocument();
  });

  it('should render in modification mode when originalText is provided', () => {
    const props = {
      ...defaultProps,
      originalText: 'Original text content',
      modificationType: 'Summary',
    };
    render(<AIContentConfirmation {...props} />);

    expect(screen.getByText('AI Modified Content (Summary)')).toBeInTheDocument();
    expect(screen.getByText('Original text content')).toBeInTheDocument();
    expect(screen.getByText('Generated AI content')).toBeInTheDocument();
    expect(screen.getByText('Original Text')).toBeInTheDocument();
    expect(screen.getByText('Modified Text')).toBeInTheDocument();
    expect(screen.getByText(/Review the modified content below/)).toBeInTheDocument();
  });

  it('should call onAccept when Accept & Insert button is clicked', () => {
    render(<AIContentConfirmation {...defaultProps} />);

    const acceptButton = screen.getByRole('button', { name: /accept & insert/i });
    fireEvent.click(acceptButton);

    expect(defaultProps.onAccept).toHaveBeenCalledTimes(1);
  });

  it('should call onReject when Reject button is clicked', () => {
    render(<AIContentConfirmation {...defaultProps} />);

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);

    expect(defaultProps.onReject).toHaveBeenCalledTimes(1);
  });

  it('should call onRegenerate when Regenerate button is clicked', () => {
    render(<AIContentConfirmation {...defaultProps} />);

    const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
    fireEvent.click(regenerateButton);

    expect(defaultProps.onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('should not show Regenerate button if onRegenerate is not provided', () => {
    const { onRegenerate, ...propsWithoutRegenerate } = defaultProps;
    render(<AIContentConfirmation {...propsWithoutRegenerate} />);

    expect(screen.queryByRole('button', { name: /regenerate/i })).not.toBeInTheDocument();
  });

  it('should toggle preview when preview button is clicked', () => {
    render(<AIContentConfirmation {...defaultProps} />);

    expect(screen.getByText('Generated AI content')).toBeInTheDocument();

    const toggleButton = screen.getByLabelText('Hide preview');
    fireEvent.click(toggleButton);

    expect(screen.queryByText('Generated AI content')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Show preview')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Show preview'));
    expect(screen.getByText('Generated AI content')).toBeInTheDocument();
  });

  it('should copy content to clipboard and show success state', async () => {
    vi.useFakeTimers();
    render(<AIContentConfirmation {...defaultProps} />);

    const copyButton = screen.getByLabelText('Copy content');
    fireEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith('Generated AI content');

    // Check if tooltip content changes to "Copied!"
    // Note: TooltipContent is mocked to always show, but we check text
    expect(screen.getByText('Copied!')).toBeInTheDocument();

    // Fast-forward time
    vi.advanceTimersByTime(2500);

    // Wait for it to revert
    await waitFor(() => {
      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('should handle isRegenerating state', () => {
    render(<AIContentConfirmation {...defaultProps} isRegenerating={true} />);

    const regenerateButton = screen.getByRole('button', { name: /regenerating\.\.\./i });
    const rejectButton = screen.getByRole('button', { name: /reject/i });
    const acceptButton = screen.getByRole('button', { name: /accept & insert/i });

    expect(regenerateButton).toBeDisabled();
    expect(rejectButton).toBeDisabled();
    expect(acceptButton).toBeDisabled();

    // Check for spinner icon - Lucide icons often use SVG with specific classes
    expect(regenerateButton.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <AIContentConfirmation {...defaultProps} className="custom-test-class" />
    );

    expect(container.firstChild).toHaveClass('custom-test-class');
  });

  it('should display keyboard shortcuts help', () => {
    render(<AIContentConfirmation {...defaultProps} />);

    expect(screen.getByText(/Shortcuts:/)).toBeInTheDocument();
    expect(screen.getByText(/Enter to accept/)).toBeInTheDocument();
    expect(screen.getByText(/Escape to reject/)).toBeInTheDocument();
    expect(screen.getByText(/R to regenerate/)).toBeInTheDocument();
  });
});
