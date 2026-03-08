import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIModifyInterface } from '@/components/ui/ai-modify-interface';
import { ModificationType } from '@/lib/ai-types';

describe('AIModifyInterface', () => {
  const defaultProps = {
    selectedText: 'Test selected text',
    onModify: vi.fn(),
    onCancel: vi.fn(),
    isProcessing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<AIModifyInterface {...defaultProps} />);

    expect(screen.getByText('Modify Selected Text')).toBeInTheDocument();
    expect(screen.getByText(/Test selected text/)).toBeInTheDocument();
    expect(screen.getByText('Rewrite')).toBeInTheDocument();
    expect(screen.getByText('Expand')).toBeInTheDocument();
    expect(screen.getByText('Summarize')).toBeInTheDocument();
    expect(screen.getByText('Improve Clarity')).toBeInTheDocument();

    const modifyBtn = screen.getByRole('button', { name: /Modify Text/i });
    expect(modifyBtn).toBeDisabled();
  });

  it('enables the modify button when an option is selected', async () => {
    const user = userEvent.setup();
    render(<AIModifyInterface {...defaultProps} />);

    const modifyBtn = screen.getByRole('button', { name: /Modify Text/i });
    expect(modifyBtn).toBeDisabled();

    const rewriteOption = screen.getByRole('button', { name: /Rewrite/i });
    await user.click(rewriteOption);

    expect(modifyBtn).toBeEnabled();
  });

  it('calls onModify with the selected modification type when modify button is clicked', async () => {
    const user = userEvent.setup();
    render(<AIModifyInterface {...defaultProps} />);

    const rewriteOption = screen.getByRole('button', { name: /Rewrite/i });
    await user.click(rewriteOption);

    const modifyBtn = screen.getByRole('button', { name: /Modify Text/i });
    await user.click(modifyBtn);

    expect(defaultProps.onModify).toHaveBeenCalledTimes(1);
    expect(defaultProps.onModify).toHaveBeenCalledWith(ModificationType.REWRITE);
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<AIModifyInterface {...defaultProps} />);

    const cancelBtns = screen.getAllByRole('button', { name: /Cancel/i });
    await user.click(cancelBtns[0]);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables buttons when isProcessing is true', () => {
    render(<AIModifyInterface {...defaultProps} isProcessing={true} />);

    const options = screen.getAllByRole('button');
    // Ensure the options are visually disabled
    const rewriteOption = screen.getByRole('button', { name: /Rewrite/i });
    expect(rewriteOption).toBeDisabled();

    const modifyBtn = screen.getByRole('button', { name: /Modifying/i });
    expect(modifyBtn).toBeDisabled();

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelBtn).toBeDisabled();
  });

  it('handles keyboard shortcuts (Enter to submit, Escape to cancel)', async () => {
    const user = userEvent.setup();
    const { container } = render(<AIModifyInterface {...defaultProps} />);

    const mainContainer = container.firstChild as HTMLElement;

    // Focus the container to receive keyboard events
    mainContainer.focus();

    // Test Escape to cancel
    await user.keyboard('{Escape}');
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);

    // Select an option first
    const rewriteOption = screen.getByRole('button', { name: /Rewrite/i });
    await user.click(rewriteOption);

    mainContainer.focus();
    // Test Enter to submit
    await user.keyboard('{Enter}');
    expect(defaultProps.onModify).toHaveBeenCalledTimes(1);
    expect(defaultProps.onModify).toHaveBeenCalledWith(ModificationType.REWRITE);
  });

  it('truncates very long selected text', () => {
    const longText = 'a'.repeat(300);
    render(<AIModifyInterface {...defaultProps} selectedText={longText} />);

    // It should truncate at 200 characters and add '...'
    const expectedTruncated = 'a'.repeat(200) + '...';
    expect(screen.getByText(expectedTruncated)).toBeInTheDocument();
  });

  it('does not submit on Enter if no modification is selected', async () => {
    const user = userEvent.setup();
    const { container } = render(<AIModifyInterface {...defaultProps} />);

    const mainContainer = container.firstChild as HTMLElement;
    mainContainer.focus();

    await user.keyboard('{Enter}');
    expect(defaultProps.onModify).not.toHaveBeenCalled();
  });

  it('handles errors from onModify gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onModifyError = vi.fn().mockRejectedValue(new Error('Test error'));

    const user = userEvent.setup();
    render(<AIModifyInterface {...defaultProps} onModify={onModifyError} />);

    const rewriteOption = screen.getByRole('button', { name: /Rewrite/i });
    await user.click(rewriteOption);

    const modifyBtn = screen.getByRole('button', { name: /Modify Text/i });
    await user.click(modifyBtn);

    expect(onModifyError).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalledWith('Error processing modification:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});
