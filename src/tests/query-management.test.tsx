import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryManagement } from '../components/ui/ai-searcher/query-management';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Filter: () => <div data-testid="icon-filter" />,
  Zap: () => <div data-testid="icon-zap" />,
  Search: () => <div data-testid="icon-search" />,
}));

describe('QueryManagement', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchQueryChange: vi.fn(),
    onSearch: vi.fn(),
    loading: false,
    onToggleFilters: vi.fn(),
    onGenerateQuery: vi.fn(),
    onRefineQuery: vi.fn(),
    refinementLoading: false,
    selectedContent: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<QueryManagement {...defaultProps} />);

    // Check if the input is rendered with the correct placeholder
    expect(screen.getByPlaceholderText("Enter your search query (e.g., 'machine learning in education')")).toBeInTheDocument();

    // Check if the buttons are rendered
    expect(screen.getByRole('button', { name: /Filters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refine/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
  });

  it('calls onSearchQueryChange when typing in the input', async () => {
    render(<QueryManagement {...defaultProps} />);
    const input = screen.getByLabelText(/Search Query/i);

    await userEvent.type(input, 'test query');

    expect(defaultProps.onSearchQueryChange).toHaveBeenCalledTimes(10); // 'test query' is 10 characters
  });

  it('calls onSearch when the "Search" button is clicked', async () => {
    render(<QueryManagement {...defaultProps} searchQuery="valid query" />);
    const searchButton = screen.getByRole('button', { name: /Search/i });

    await userEvent.click(searchButton);

    expect(defaultProps.onSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onSearch when the Enter key is pressed in the input', async () => {
    render(<QueryManagement {...defaultProps} searchQuery="valid query" />);
    const input = screen.getByLabelText(/Search Query/i);

    await userEvent.type(input, '{enter}');

    expect(defaultProps.onSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onToggleFilters when the "Filters" button is clicked', async () => {
    render(<QueryManagement {...defaultProps} />);
    const filtersButton = screen.getByRole('button', { name: /Filters/i });

    await userEvent.click(filtersButton);

    expect(defaultProps.onToggleFilters).toHaveBeenCalledTimes(1);
  });

  it('calls onGenerateQuery when the "Generate" button is clicked', async () => {
    const selectedContentMock = [
      { id: '1', sourceId: 'src1', type: 'text', content: 'test', metadata: {} }
    ];
    render(<QueryManagement {...defaultProps} selectedContent={selectedContentMock as any} />);
    const generateButton = screen.getByRole('button', { name: /Generate/i });

    await userEvent.click(generateButton);

    expect(defaultProps.onGenerateQuery).toHaveBeenCalledTimes(1);
  });

  it('disables the "Generate" button when selectedContent is empty', () => {
    render(<QueryManagement {...defaultProps} />);
    const generateButton = screen.getByRole('button', { name: /Generate/i });

    expect(generateButton).toBeDisabled();
  });

  it('disables the "Generate" button when loading is true', () => {
    const selectedContentMock = [
      { id: '1', sourceId: 'src1', type: 'text', content: 'test', metadata: {} }
    ];
    render(<QueryManagement {...defaultProps} selectedContent={selectedContentMock as any} loading={true} />);
    const generateButton = screen.getByRole('button', { name: /Generate/i });

    expect(generateButton).toBeDisabled();
  });

  it('calls onRefineQuery when the "Refine" button is clicked', async () => {
    render(<QueryManagement {...defaultProps} searchQuery="valid query" />);
    const refineButton = screen.getByRole('button', { name: /Refine/i });

    await userEvent.click(refineButton);

    expect(defaultProps.onRefineQuery).toHaveBeenCalledTimes(1);
  });

  it('disables the "Search" button when loading is true', () => {
    render(<QueryManagement {...defaultProps} searchQuery="valid query" loading={true} />);
    const searchButton = screen.getByRole('button', { name: /Searching.../i });

    expect(searchButton).toBeDisabled();
  });

  it('disables the "Search" button when the query is empty or whitespace', () => {
    const { rerender } = render(<QueryManagement {...defaultProps} searchQuery="" />);
    let searchButton = screen.getByRole('button', { name: /Search/i });
    expect(searchButton).toBeDisabled();

    rerender(<QueryManagement {...defaultProps} searchQuery="   " />);
    searchButton = screen.getByRole('button', { name: /Search/i });
    expect(searchButton).toBeDisabled();
  });

  it('disables the "Refine" button when refinementLoading is true', () => {
    render(<QueryManagement {...defaultProps} searchQuery="valid query" refinementLoading={true} />);
    const refineButton = screen.getByRole('button', { name: /Analyzing.../i });

    expect(refineButton).toBeDisabled();
  });

  it('disables the "Refine" button when the query is empty or whitespace', () => {
    const { rerender } = render(<QueryManagement {...defaultProps} searchQuery="" />);
    let refineButton = screen.getByRole('button', { name: /Refine/i });
    expect(refineButton).toBeDisabled();

    rerender(<QueryManagement {...defaultProps} searchQuery="   " />);
    refineButton = screen.getByRole('button', { name: /Refine/i });
    expect(refineButton).toBeDisabled();
  });

  it('displays the correct placeholder when selectedContent has items', () => {
    const selectedContentMock = [
      { id: '1', sourceId: 'src1', type: 'text', content: 'test', metadata: {} }
    ];
    render(<QueryManagement {...defaultProps} selectedContent={selectedContentMock as any} />);

    expect(screen.getByPlaceholderText("Query generated from selected content (you can modify it)")).toBeInTheDocument();
  });
});
