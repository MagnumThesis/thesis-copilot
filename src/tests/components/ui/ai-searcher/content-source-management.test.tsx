import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentSourceManagement, ContentSourceManagementProps } from '../../../../components/ui/ai-searcher/content-source-management';
import { ExtractedContent } from '../../../../lib/ai-types';

// Mock Lucide icons to prevent JSDOM issues
vi.mock('lucide-react', () => ({
  Settings: () => <div data-testid="icon-settings" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
  Filter: () => <div data-testid="icon-filter" />,
  Zap: () => <div data-testid="icon-zap" />,
  Search: () => <div data-testid="icon-search" />,
}));

const mockExtractedContent: ExtractedContent = {
  id: '1',
  type: 'idea',
  content: 'Sample idea content',
  metadata: {
    sourceId: 'source-1',
    title: 'Idea 1'
  }
};

describe('ContentSourceManagement', () => {
  let defaultProps: ContentSourceManagementProps;

  beforeEach(() => {
    defaultProps = {
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
  });

  it('renders correctly with default props', () => {
    render(<ContentSourceManagement {...defaultProps} />);

    expect(screen.getByText('AI-Powered Search Options')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show Content Selection/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Search Query/i)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Enter your search query/i);
    expect(searchInput).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Filters/i })).toBeInTheDocument();

    const refineButton = screen.getByRole('button', { name: /Refine/i });
    expect(refineButton).toBeInTheDocument();
    expect(refineButton).toBeDisabled(); // Disabled because searchQuery is empty

    const searchButton = screen.getByRole('button', { name: /Search/i });
    expect(searchButton).toBeInTheDocument();
    expect(searchButton).toBeDisabled(); // Disabled because searchQuery is empty
  });

  it('calls onToggleContentSelector when "Show/Hide Content Selection" is clicked', async () => {
    const user = userEvent.setup();
    render(<ContentSourceManagement {...defaultProps} />);

    const toggleButton = screen.getByRole('button', { name: /Show Content Selection/i });
    await user.click(toggleButton);

    expect(defaultProps.onToggleContentSelector).toHaveBeenCalledTimes(1);
  });

  it('renders "Hide Content Selection" when showContentSelector is true', () => {
    render(<ContentSourceManagement {...defaultProps} showContentSelector={true} />);

    expect(screen.getByRole('button', { name: /Hide Content Selection/i })).toBeInTheDocument();
  });

  it('calls onSearchQueryChange when user types in the input', async () => {
    const user = userEvent.setup();
    render(<ContentSourceManagement {...defaultProps} />);

    const searchInput = screen.getByLabelText(/Search Query/i);
    await user.type(searchInput, 'test query');

    expect(defaultProps.onSearchQueryChange).toHaveBeenCalled();
  });

  it('calls onSearch when "Search" button is clicked', async () => {
    const user = userEvent.setup();
    render(<ContentSourceManagement {...defaultProps} searchQuery="test query" />);

    const searchButton = screen.getByRole('button', { name: /Search/i });
    expect(searchButton).not.toBeDisabled();

    await user.click(searchButton);
    expect(defaultProps.onSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onSearch when "Enter" is pressed in input', async () => {
    const user = userEvent.setup();
    render(<ContentSourceManagement {...defaultProps} searchQuery="test query" />);

    const searchInput = screen.getByLabelText(/Search Query/i);
    await user.click(searchInput);
    await user.keyboard('{Enter}');

    expect(defaultProps.onSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleFilters when "Filters" is clicked', async () => {
    const user = userEvent.setup();
    render(<ContentSourceManagement {...defaultProps} searchQuery="test query" />);

    const filtersButton = screen.getByRole('button', { name: /Filters/i });
    await user.click(filtersButton);

    expect(defaultProps.onToggleFilters).toHaveBeenCalledTimes(1);
  });

  it('calls onRefineQuery when "Refine" is clicked', async () => {
    const user = userEvent.setup();
    render(<ContentSourceManagement {...defaultProps} searchQuery="test query" />);

    const refineButton = screen.getByRole('button', { name: /Refine/i });
    expect(refineButton).not.toBeDisabled();

    await user.click(refineButton);
    expect(defaultProps.onRefineQuery).toHaveBeenCalledTimes(1);
  });

  it('disables "Search" button when loading is true', () => {
    render(<ContentSourceManagement {...defaultProps} searchQuery="test query" loading={true} />);

    const searchButton = screen.getByRole('button', { name: /Searching.../i });
    expect(searchButton).toBeDisabled();
  });

  it('disables "Refine" button when refinementLoading is true', () => {
    render(<ContentSourceManagement {...defaultProps} searchQuery="test query" refinementLoading={true} />);

    const refineButton = screen.getByRole('button', { name: /Analyzing.../i });
    expect(refineButton).toBeDisabled();
  });

  it('renders selected content summary when selectedContent is not empty', () => {
    render(<ContentSourceManagement {...defaultProps} selectedContent={[mockExtractedContent]} />);

    expect(screen.getByText('Using content from 1 source')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Query generated from selected content/i)).toBeInTheDocument();
  });

  it('renders correct summary text for multiple selected contents', () => {
    render(
      <ContentSourceManagement
        {...defaultProps}
        selectedContent={[mockExtractedContent, { ...mockExtractedContent, id: '2' }]}
      />
    );

    expect(screen.getByText('Using content from 2 sources')).toBeInTheDocument();
  });
});
