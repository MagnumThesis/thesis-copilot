import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PrivacyManagement } from '../components/ui/ai-searcher/privacy-management';

// Mock child components to isolate testing of PrivacyManagement logic
vi.mock('../components/ui/consent-banner', () => ({
  ConsentBanner: ({ conversationId, onConsentChange }: any) => (
    <div data-testid="consent-banner">
      <span data-testid="cb-conv-id">{conversationId}</span>
      <button
        data-testid="cb-grant"
        onClick={() => onConsentChange(true)}
      >
        Grant
      </button>
      <button
        data-testid="cb-deny"
        onClick={() => onConsentChange(false)}
      >
        Deny
      </button>
    </div>
  )
}));

vi.mock('../components/ui/privacy-controls', () => ({
  PrivacyControls: ({ conversationId, onSettingsChange, onDataCleared, onDataExported }: any) => (
    <div data-testid="privacy-controls">
      <span data-testid="pc-conv-id">{conversationId}</span>
      <button
        data-testid="pc-settings-change"
        onClick={() => onSettingsChange({})}
      >
        Change Settings
      </button>
      <button
        data-testid="pc-data-cleared"
        onClick={() => onDataCleared()}
      >
        Clear Data
      </button>
      <button
        data-testid="pc-data-exported"
        onClick={() => onDataExported({ data: 'test' })}
      >
        Export Data
      </button>
    </div>
  )
}));

describe('PrivacyManagement', () => {
  const defaultProps = {
    conversationId: 'test-convo-id',
    showPrivacyControls: false,
    onConsentChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ConsentBanner unconditionally and passes correct props', () => {
    render(<PrivacyManagement {...defaultProps} />);

    expect(screen.getByTestId('consent-banner')).toBeInTheDocument();
    expect(screen.getByTestId('cb-conv-id')).toHaveTextContent('test-convo-id');
  });

  it('does not render PrivacyControls when showPrivacyControls is false', () => {
    render(<PrivacyManagement {...defaultProps} />);

    expect(screen.queryByTestId('privacy-controls')).not.toBeInTheDocument();
  });

  it('renders PrivacyControls when showPrivacyControls is true and passes correct props', () => {
    render(<PrivacyManagement {...defaultProps} showPrivacyControls={true} />);

    expect(screen.getByTestId('privacy-controls')).toBeInTheDocument();
    expect(screen.getByTestId('pc-conv-id')).toHaveTextContent('test-convo-id');
  });

  it('calls onConsentChange when ConsentBanner onConsentChange is called with true', () => {
    render(<PrivacyManagement {...defaultProps} />);

    fireEvent.click(screen.getByTestId('cb-grant'));

    expect(defaultProps.onConsentChange).toHaveBeenCalledTimes(1);
  });

  it('does not call onConsentChange when ConsentBanner onConsentChange is called with false', () => {
    render(<PrivacyManagement {...defaultProps} />);

    fireEvent.click(screen.getByTestId('cb-deny'));

    expect(defaultProps.onConsentChange).not.toHaveBeenCalled();
  });

  it('calls onConsentChange when PrivacyControls onSettingsChange is called', () => {
    render(<PrivacyManagement {...defaultProps} showPrivacyControls={true} />);

    fireEvent.click(screen.getByTestId('pc-settings-change'));

    expect(defaultProps.onConsentChange).toHaveBeenCalledTimes(1);
  });

  it('handles PrivacyControls onDataCleared without crashing', () => {
    render(<PrivacyManagement {...defaultProps} showPrivacyControls={true} />);

    // Clicking should not throw errors or trigger onConsentChange
    fireEvent.click(screen.getByTestId('pc-data-cleared'));
    expect(defaultProps.onConsentChange).not.toHaveBeenCalled();
  });

  it('handles PrivacyControls onDataExported and logs to console', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    render(<PrivacyManagement {...defaultProps} showPrivacyControls={true} />);

    fireEvent.click(screen.getByTestId('pc-data-exported'));

    expect(consoleSpy).toHaveBeenCalledWith('Data exported:', { data: 'test' });

    consoleSpy.mockRestore();
  });

  it('does not crash if onConsentChange is not provided', () => {
    render(
      <PrivacyManagement
        conversationId="test-convo-id"
        showPrivacyControls={true}
      />
    );

    // Interactions should not crash
    fireEvent.click(screen.getByTestId('cb-grant'));
    fireEvent.click(screen.getByTestId('pc-settings-change'));
  });
});
