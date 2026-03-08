import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ContentSourceManagement } from '../../../../components/ui/ai-searcher/content-source-management';
import { ExtractedContent } from '../../../../lib/ai-types';

// Mock Lucide icons to prevent portal/SVG issues in JSDOM
vi.mock('lucide-react', () => ({
  Settings: () => <div data-testid="settings-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Search: () => <div data-testid="search-icon" />,
}));

describe('ContentSourceManagement', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchQueryChange: vi.fn(),
    onToggleContentSelector: vi.fn(),
    showContentSelector: false,
    selectedContent: [],
    onSearch: vi.fn(),
    loading: false,
    onToggleFilters: vi.fn(),
    onRefineQuery: vi.fn(),
    refinementLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<ContentSourceManagement {...defaultProps} />);

    expect(screen.getByText('AI-Powered Search Options')).toBeInTheDocument();
    expect(screen.getByLabelText('Search Query')).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByRole('button', { name: /show content selection/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refine/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('toggles content selection button text based on showContentSelector prop', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ContentSourceManagement {...defaultProps} showContentSelector={false} />);

    const toggleButton = screen.getByRole('button', { name: /show content selection/i });
    expect(toggleButton).toBeInTheDocument();

    await user.click(toggleButton);
    expect(defaultProps.onToggleContentSelector).toHaveBeenCalledTimes(1);

    // Re-render with showContentSelector = true
    rerender(<ContentSourceManagement {...defaultProps} showContentSelector={true} />);
    expect(screen.getByRole('button', { name: /hide content selection/i })).toBeInTheDocument();
  });

  it('displays a summary when selectedContent is not empty', () => {
    const mockSelectedContent: ExtractedContent[] = [
      { id: '1', type: 'idea', content: 'Idea 1', title: 'Idea 1', selected: true },
      { id: '2', type: 'idea', content: 'Idea 2', title: 'Idea 2', selected: true }
    ];

    render(<ContentSourceManagement {...defaultProps} selectedContent={mockSelectedContent} />);

    expect(screen.getByText(/Using content from 2 sources/i)).toBeInTheDocument();
    expect(screen.getByText(/Search query will be generated from your selected Ideas and Builder content/i)).toBeInTheDocument();
  });

  it('displays singular source text when exactly one content item is selected', () => {
    const mockSelectedContent: ExtractedContent[] = [
      { id: '1', type: 'idea', content: 'Idea 1', title: 'Idea 1', selected: true }
    ];

    render(<ContentSourceManagement {...defaultProps} selectedContent={mockSelectedContent} />);

    expect(screen.getByText(/Using content from 1 source/i)).toBeInTheDocument();
    expect(screen.queryByText(/Using content from 1 sources/i)).not.toBeInTheDocument();
  });

  it('calls onSearchQueryChange when typing in the search input', async () => {
    const user = userEvent.setup();
    render(<ContentSourceManagement {...defaultProps} />);

    const input = screen.getByLabelText('Search Query');
    await user.type(input, 'test query');

    // userEvent.type triggers change for each character, so we check if it was called
    expect(defaultProps.onSearchQueryChange).toHaveBeenCalled();
  });

  it('calls onSearch when pressing Enter in the search input', async () => {
    const user = userEvent.setup();
    render(<ContentSourceManagement {...defaultProps} searchQuery="test" />);

    const input = screen.getByLabelText('Search Query');
    await user.type(input, '{Enter}');

    expect(defaultProps.onSearch).toHaveBeenCalled();
  });

  it('calls onToggleFilters when clicking the Filters button', async () => {
    const user = userEvent.setup();
    render(<ContentSourceManagement {...defaultProps} />);

    const filtersButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filtersButton);

    expect(defaultProps.onToggleFilters).toHaveBeenCalledTimes(1);
  });

  it('disables Refine and Search buttons when searchQuery is empty or whitespace', () => {
    const { rerender } = render(<ContentSourceManagement {...defaultProps} searchQuery="" />);

    expect(screen.getByRole('button', { name: /refine/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled();

    rerender(<ContentSourceManagement {...defaultProps} searchQuery="   " />);
    expect(screen.getByRole('button', { name: /refine/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /search/i })).toBeDisabled();
  });

  it('enables Refine and Search buttons when searchQuery has text', () => {
    render(<ContentSourceManagement {...defaultProps} searchQuery="valid query" />);

    expect(screen.getByRole('button', { name: /refine/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /search/i })).toBeEnabled();
  });

  it('calls onRefineQuery when Refine button is clicked', async () => {
    const user = userEvent.setup();
    render(<ContentSourceManagement {...defaultProps} searchQuery="test query" />);

    const refineButton = screen.getByRole('button', { name: /refine/i });
    await user.click(refineButton);

    expect(defaultProps.onRefineQuery).toHaveBeenCalledTimes(1);
  });

  it('shows analyzing state and disables Refine button when refinementLoading is true', () => {
    render(<ContentSourceManagement {...defaultProps} searchQuery="test" refinementLoading={true} />);

    const refineButton = screen.getByRole('button', { name: /analyzing.../i });
    expect(refineButton).toBeInTheDocument();
    expect(refineButton).toBeDisabled();
  });

  it('shows searching state and disables Search button when loading is true', () => {
    render(<ContentSourceManagement {...defaultProps} searchQuery="test" loading={true} />);

    const searchButton = screen.getByRole('button', { name: /searching.../i });
    expect(searchButton).toBeInTheDocument();
    expect(searchButton).toBeDisabled();
  });

  it('calls onSearch when Search button is clicked', async () => {
    const user = userEvent.setup();
    render(<ContentSourceManagement {...defaultProps} searchQuery="test query" />);

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    expect(defaultProps.onSearch).toHaveBeenCalledTimes(1);
  });

  it('changes input placeholder based on selectedContent length', () => {
    const { rerender } = render(<ContentSourceManagement {...defaultProps} selectedContent={[]} />);

    expect(screen.getByPlaceholderText(/Enter your search query/i)).toBeInTheDocument();

    const mockSelectedContent: ExtractedContent[] = [
      { id: '1', type: 'idea', content: 'Idea 1', title: 'Idea 1', selected: true }
    ];
    rerender(<ContentSourceManagement {...defaultProps} selectedContent={mockSelectedContent} />);

    expect(screen.getByPlaceholderText(/Query generated from selected content/i)).toBeInTheDocument();
  });
});
