import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchHeader } from '../components/ui/ai-searcher/search-header';

describe('SearchHeader Component', () => {
  it('renders the default title and description', () => {
    const mockOnTogglePrivacyControls = vi.fn();
    render(
      <SearchHeader
        onTogglePrivacyControls={mockOnTogglePrivacyControls}
        showPrivacyControls={false}
      />
    );

    expect(screen.getByText('AI Search')).toBeInTheDocument();
    expect(screen.getByText('Search across your library, notes, and external sources.')).toBeInTheDocument();
  });

  it('renders a custom title and description when provided', () => {
    const mockOnTogglePrivacyControls = vi.fn();
    const customTitle = 'Custom Search Title';
    const customDescription = 'Custom search description.';

    render(
      <SearchHeader
        onTogglePrivacyControls={mockOnTogglePrivacyControls}
        showPrivacyControls={false}
        title={customTitle}
        description={customDescription}
      />
    );

    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customDescription)).toBeInTheDocument();
  });

  it('renders the Privacy button', () => {
    const mockOnTogglePrivacyControls = vi.fn();
    render(
      <SearchHeader
        onTogglePrivacyControls={mockOnTogglePrivacyControls}
        showPrivacyControls={false}
      />
    );

    const privacyButton = screen.getByRole('button', { name: /privacy/i });
    expect(privacyButton).toBeInTheDocument();
  });

  it('calls onTogglePrivacyControls when Privacy button is clicked', () => {
    const mockOnTogglePrivacyControls = vi.fn();
    render(
      <SearchHeader
        onTogglePrivacyControls={mockOnTogglePrivacyControls}
        showPrivacyControls={false}
      />
    );

    const privacyButton = screen.getByRole('button', { name: /privacy/i });
    fireEvent.click(privacyButton);

    expect(mockOnTogglePrivacyControls).toHaveBeenCalledTimes(1);
  });

  it('renders correctly when showPrivacyControls is true', () => {
    const mockOnTogglePrivacyControls = vi.fn();
    render(
      <SearchHeader
        onTogglePrivacyControls={mockOnTogglePrivacyControls}
        showPrivacyControls={true}
      />
    );

    // It should still render the privacy button and the title
    expect(screen.getByText('AI Search')).toBeInTheDocument();
    const privacyButton = screen.getByRole('button', { name: /privacy/i });
    expect(privacyButton).toBeInTheDocument();
  });
});
