import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIErrorNotification } from '../components/ui/ai-error-notification';
import { AIError, AIErrorType } from '../lib/ai-infrastructure';

describe('AIErrorNotification', () => {
  const mockOnRetry = vi.fn();
  const mockOnDismiss = vi.fn();
  const mockOnGracefulDegradation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render network error correctly', () => {
    const networkError = new AIError(
      'Network connection failed',
      AIErrorType.NETWORK_ERROR,
      'NET_001',
      true
    );

    render(
      <AIErrorNotification
        error={networkError}
        onDismiss={mockOnDismiss}
        canRetry={true}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('Connection Issue')).toBeInTheDocument();
    expect(screen.getByText(/internet connection/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should render timeout error correctly', () => {
    const timeoutError = new AIError(
      'Request timed out',
      AIErrorType.TIMEOUT_ERROR,
      'TIMEOUT_001',
      true
    );

    render(
      <AIErrorNotification
        error={timeoutError}
        onDismiss={mockOnDismiss}
        canRetry={true}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText('Request Timeout')).toBeInTheDocument();
    expect(screen.getByText(/took too long/)).toBeInTheDocument();
  });

  it('should render service unavailable error correctly', () => {
    const serviceError = new AIError(
      'Service unavailable',
      AIErrorType.SERVICE_UNAVAILABLE,
      'SVC_001',
      true
    );

    render(
      <AIErrorNotification
        error={serviceError}
        onDismiss={mockOnDismiss}
        canRetry={true}
        onRetry={mockOnRetry}
        onGracefulDegradation={mockOnGracefulDegradation}
      />
    );

    expect(screen.getByText('Service Unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue manually/i })).toBeInTheDocument();
  });

  it('should render validation error correctly', () => {
    const validationError = new AIError(
      'Invalid input',
      AIErrorType.VALIDATION_ERROR,
      'VAL_001',
      false
    );

    render(
      <AIErrorNotification
        error={validationError}
        onDismiss={mockOnDismiss}
        canRetry={false}
      />
    );

    expect(screen.getByText('Input Error')).toBeInTheDocument();
    expect(screen.getByText(/check your input/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('should handle retry button click', () => {
    const networkError = new AIError(
      'Network connection failed',
      AIErrorType.NETWORK_ERROR,
      'NET_001',
      true
    );

    render(
      <AIErrorNotification
        error={networkError}
        onDismiss={mockOnDismiss}
        canRetry={true}
        onRetry={mockOnRetry}
      />
    );

    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('should handle dismiss button click', () => {
    const networkError = new AIError(
      'Network connection failed',
      AIErrorType.NETWORK_ERROR,
      'NET_001',
      true
    );

    render(
      <AIErrorNotification
        error={networkError}
        onDismiss={mockOnDismiss}
      />
    );

    const dismissButton = screen.getByRole('button', { name: '' }); // X button
    fireEvent.click(dismissButton);

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should handle graceful degradation button click', () => {
    const serviceError = new AIError(
      'Service unavailable',
      AIErrorType.SERVICE_UNAVAILABLE,
      'SVC_001',
      true
    );

    render(
      <AIErrorNotification
        error={serviceError}
        onDismiss={mockOnDismiss}
        onGracefulDegradation={mockOnGracefulDegradation}
      />
    );

    const degradationButton = screen.getByRole('button', { name: /continue manually/i });
    fireEvent.click(degradationButton);

    expect(mockOnGracefulDegradation).toHaveBeenCalledTimes(1);
  });

  it('should show retry count when provided', () => {
    const networkError = new AIError(
      'Network connection failed',
      AIErrorType.NETWORK_ERROR,
      'NET_001',
      true
    );

    render(
      <AIErrorNotification
        error={networkError}
        onDismiss={mockOnDismiss}
        canRetry={true}
        retryCount={2}
        onRetry={mockOnRetry}
      />
    );

    expect(screen.getByText(/retry attempt 2/i)).toBeInTheDocument();
  });

  it('should show error details when expanded', () => {
    const networkError = new AIError(
      'Network connection failed',
      AIErrorType.NETWORK_ERROR,
      'NET_001',
      true
    );

    render(
      <AIErrorNotification
        error={networkError}
        onDismiss={mockOnDismiss}
      />
    );

    const showDetailsButton = screen.getByRole('button', { name: /show details/i });
    fireEvent.click(showDetailsButton);

    expect(screen.getByText('NET_001')).toBeInTheDocument();
    expect(screen.getByText('NETWORK_ERROR')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument(); // Retryable: Yes
  });

  it('should hide error details when collapsed', () => {
    const networkError = new AIError(
      'Network connection failed',
      AIErrorType.NETWORK_ERROR,
      'NET_001',
      true
    );

    render(
      <AIErrorNotification
        error={networkError}
        onDismiss={mockOnDismiss}
      />
    );

    const showDetailsButton = screen.getByRole('button', { name: /show details/i });
    fireEvent.click(showDetailsButton);

    expect(screen.getByText('NET_001')).toBeInTheDocument();

    const hideDetailsButton = screen.getByRole('button', { name: /hide details/i });
    fireEvent.click(hideDetailsButton);

    expect(screen.queryByText('NET_001')).not.toBeInTheDocument();
  });

  it('should disable retry button when max retries reached', () => {
    const networkError = new AIError(
      'Network connection failed',
      AIErrorType.NETWORK_ERROR,
      'NET_001',
      true
    );

    render(
      <AIErrorNotification
        error={networkError}
        onDismiss={mockOnDismiss}
        canRetry={true}
        retryCount={3}
        onRetry={mockOnRetry}
      />
    );

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeDisabled();
  });

  it('should use correct variant for different error types', () => {
    const { rerender } = render(
      <AIErrorNotification
        error={new AIError('Network error', AIErrorType.NETWORK_ERROR, 'NET_001', true)}
        onDismiss={mockOnDismiss}
      />
    );

    // Network error should use default variant
    expect(screen.getByRole('alert')).toHaveClass('border-border');

    rerender(
      <AIErrorNotification
        error={new AIError('Service error', AIErrorType.SERVICE_UNAVAILABLE, 'SVC_001', true)}
        onDismiss={mockOnDismiss}
      />
    );

    // Service error should use destructive variant
    expect(screen.getByRole('alert')).toHaveClass('border-destructive');
  });

  it('should show appropriate icons for different error types', () => {
    const { rerender } = render(
      <AIErrorNotification
        error={new AIError('Network error', AIErrorType.NETWORK_ERROR, 'NET_001', true)}
        onDismiss={mockOnDismiss}
      />
    );

    // Should show wifi icon for network errors
    expect(document.querySelector('[data-lucide="wifi"]')).toBeInTheDocument();

    rerender(
      <AIErrorNotification
        error={new AIError('Timeout error', AIErrorType.TIMEOUT_ERROR, 'TO_001', true)}
        onDismiss={mockOnDismiss}
      />
    );

    // Should show clock icon for timeout errors
    expect(document.querySelector('[data-lucide="clock"]')).toBeInTheDocument();
  });
});