import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultsManagement, ResultsManagementProps } from '@/components/ui/ai-searcher/results-management';

// Mock child components
vi.mock('@/components/ui/query-refinement-panel', () => ({
  QueryRefinementPanel: () => <div data-testid="mock-query-refinement-panel" />
}));

vi.mock('@/components/ui/deduplication-settings', () => ({
  DeduplicationSettings: () => <div data-testid="mock-deduplication-settings" />
}));

vi.mock('@/components/ui/duplicate-conflict-resolver', () => ({
  DuplicateConflictResolver: () => <div data-testid="mock-duplicate-conflict-resolver" />
}));

vi.mock('@/components/ui/search-results-display', () => ({
  SearchResultsDisplay: () => <div data-testid="mock-search-results-display" />
}));

vi.mock('@/components/ui/search-session-feedback', () => ({
  SearchSessionFeedbackComponent: () => <div data-testid="mock-search-session-feedback" />
}));

describe('ResultsManagement', () => {
  const defaultProps: ResultsManagementProps = {
    hasSearched: false,
    searchResults: [],
    originalResults: [],
    searchError: null,
    loading: false,
    currentSessionId: null,
    duplicatesDetected: false,
    duplicateGroups: [],
    deduplicationOptions: { mergeStrategy: 'manual_review' },
    showDuplicateResolver: false,
    showDeduplicationSettings: false,
    sessionFeedbackSubmitted: false,
    showSessionFeedback: false,
    searchQuery: 'test query',
    selectedContent: [],
    onAddReference: vi.fn(),
    onProvideFeedback: vi.fn(),
    onResolveDuplicateConflicts: vi.fn(),
    onCancelDuplicateResolution: vi.fn(),
    onShowSessionFeedback: vi.fn(),
    onCancelSessionFeedback: vi.fn(),
    onToggleDeduplicationSettings: vi.fn(),
    onShowDuplicateResolver: vi.fn(),
    onQueryUpdate: vi.fn(),
    onApplyRefinement: vi.fn(),
    onRegenerateRefinement: vi.fn(),
    refinementLoading: false,
    queryRefinement: null,
    showQueryRefinement: false,
    onToggleQueryRefinement: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when not searched and not loading', () => {
    render(<ResultsManagement {...defaultProps} />);

    expect(screen.getByText('Enter a search query to find relevant academic references using AI.')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-search-results-display')).not.toBeInTheDocument();
  });

  it('renders query refinement panel when showQueryRefinement is true and queryRefinement exists', () => {
    render(
      <ResultsManagement
        {...defaultProps}
        showQueryRefinement={true}
        queryRefinement={{ status: 'ready' }}
      />
    );

    expect(screen.getByTestId('mock-query-refinement-panel')).toBeInTheDocument();
    expect(screen.getByText('Query Refinement & Analysis')).toBeInTheDocument();
  });

  it('renders deduplication settings when showDeduplicationSettings is true', () => {
    render(
      <ResultsManagement
        {...defaultProps}
        showDeduplicationSettings={true}
      />
    );

    expect(screen.getByTestId('mock-deduplication-settings')).toBeInTheDocument();
  });

  it('renders duplicate resolver when showDuplicateResolver is true and there are duplicate groups', () => {
    render(
      <ResultsManagement
        {...defaultProps}
        showDuplicateResolver={true}
        duplicateGroups={[[{ id: '1' }, { id: '2' }]]}
      />
    );

    expect(screen.getByTestId('mock-duplicate-conflict-resolver')).toBeInTheDocument();
  });

  it('renders search results and duplicate warning when hasSearched is true and duplicatesDetected is true', () => {
    render(
      <ResultsManagement
        {...defaultProps}
        hasSearched={true}
        duplicatesDetected={true}
        duplicateGroups={[[{ id: '1' }, { id: '2' }]]}
        originalResults={[{ id: '1' }, { id: '2' }]}
        searchResults={[{ id: '1' }]}
      />
    );

    expect(screen.getByTestId('mock-search-results-display')).toBeInTheDocument();
    expect(screen.getByText(/1 duplicate group detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Found 1 group of duplicate results from 2 original results/i)).toBeInTheDocument();
  });

  it('renders search error when hasSearched and searchError are true', () => {
    render(
      <ResultsManagement
        {...defaultProps}
        hasSearched={true}
        searchError="Network timeout"
      />
    );

    expect(screen.getByTestId('mock-search-results-display')).toBeInTheDocument();
    expect(screen.getByText('Search Error:')).toBeInTheDocument();
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });

  it('renders session feedback when showSessionFeedback is true and currentSessionId exists', () => {
    render(
      <ResultsManagement
        {...defaultProps}
        hasSearched={true}
        showSessionFeedback={true}
        currentSessionId="session-123"
      />
    );

    expect(screen.getByTestId('mock-search-session-feedback')).toBeInTheDocument();
  });

  it('calls correct callbacks when header buttons are clicked', async () => {
    const user = userEvent.setup();
    const onToggleDeduplicationSettings = vi.fn();
    const onShowDuplicateResolver = vi.fn();
    const onShowSessionFeedback = vi.fn();

    render(
      <ResultsManagement
        {...defaultProps}
        hasSearched={true}
        duplicatesDetected={true}
        currentSessionId="session-123"
        onToggleDeduplicationSettings={onToggleDeduplicationSettings}
        onShowDuplicateResolver={onShowDuplicateResolver}
        onShowSessionFeedback={onShowSessionFeedback}
      />
    );

    const dedupeSettingsBtn = screen.getByRole('button', { name: /Deduplication Settings/i });
    await user.click(dedupeSettingsBtn);
    expect(onToggleDeduplicationSettings).toHaveBeenCalledTimes(1);

    const resolveDuplicatesBtn = screen.getByRole('button', { name: /Resolve Duplicates/i });
    await user.click(resolveDuplicatesBtn);
    expect(onShowDuplicateResolver).toHaveBeenCalledTimes(1);

    const rateSearchBtn = screen.getByRole('button', { name: /Rate Search/i });
    await user.click(rateSearchBtn);
    expect(onShowSessionFeedback).toHaveBeenCalledTimes(1);
  });
});
