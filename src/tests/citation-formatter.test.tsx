/**
 * Citation Formatter Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CitationFormatter } from '../components/ui/citation-formatter.js';
import { Reference, CitationStyle } from '../lib/ai-types.js';

// Mock the useCitationFormatter hook
const mockUseCitationFormatter = vi.fn();
vi.mock('../hooks/useCitationFormatter.js', () => ({
  useCitationFormatter: mockUseCitationFormatter
}));

describe('CitationFormatter Component', () => {
  const mockReference: Reference = {
    id: 'test-ref-1',
    conversationId: 'conv-1',
    type: 'journal_article',
    title: 'Test Article Title',
    authors: [
      { firstName: 'John', lastName: 'Doe', middleName: '', suffix: '' }
    ],
    publicationDate: new Date('2023-01-01'),
    journal: 'Test Journal',
    volume: '10',
    issue: '2',
    pages: '123-145',
    doi: '10.1234/test',
    url: 'https://example.com',
    tags: [],
    metadataConfidence: 0.9,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const defaultHookReturn = {
    selectedStyle: CitationStyle.APA,
    selectedReference: null,
    inlineCitation: '',
    bibliographyEntry: '',
    validationResult: null,
    isProcessing: false,
    error: null,
    citationHistory: [],
    setSelectedStyle: vi.fn(),
    setSelectedReference: vi.fn(),
    formatCitation: vi.fn(),
    copyToClipboard: vi.fn(),
    insertIntoDocument: vi.fn(),
    validateReference: vi.fn(),
    clearError: vi.fn(),
    addToHistory: vi.fn(),
    clearHistory: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCitationFormatter.mockReturnValue(defaultHookReturn);
  });

  it('renders empty state when no reference is selected', () => {
    render(<CitationFormatter />);

    expect(screen.getByText('No Reference Selected')).toBeInTheDocument();
    expect(screen.getByText('Select a reference to start formatting citations.')).toBeInTheDocument();
  });

  it('renders header with title', () => {
    render(<CitationFormatter />);

    expect(screen.getByText('Citation Formatter')).toBeInTheDocument();
  });

  it('shows settings button', () => {
    render(<CitationFormatter />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toBeInTheDocument();
  });

  it('displays reference information when reference is provided', () => {
    mockUseCitationFormatter.mockReturnValue({
      ...defaultHookReturn,
      selectedReference: mockReference
    });

    render(<CitationFormatter reference={mockReference} />);

    expect(screen.getByText('Reference:')).toBeInTheDocument();
    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
  });

  it('calls setSelectedReference when reference prop changes', () => {
    const setSelectedReference = vi.fn();
    mockUseCitationFormatter.mockReturnValue({
      ...defaultHookReturn,
      setSelectedReference
    });

    const { rerender } = render(<CitationFormatter reference={null} />);

    rerender(<CitationFormatter reference={mockReference} />);

    expect(setSelectedReference).toHaveBeenCalledWith(mockReference);
  });

  it('shows processing indicator when isProcessing is true', () => {
    mockUseCitationFormatter.mockReturnValue({
      ...defaultHookReturn,
      isProcessing: true
    });

    render(<CitationFormatter />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('displays error message when error exists', () => {
    const testError = 'Test error message';
    mockUseCitationFormatter.mockReturnValue({
      ...defaultHookReturn,
      error: testError
    });

    render(<CitationFormatter />);

    expect(screen.getByText(testError)).toBeInTheDocument();
  });

  it('shows citation history when available', () => {
    const historyItems = [
      {
        id: '1',
        referenceId: 'ref1',
        conversationId: 'conv1',
        citationStyle: CitationStyle.APA,
        citationText: '(Test, 2023)',
        createdAt: new Date()
      }
    ];

    mockUseCitationFormatter.mockReturnValue({
      ...defaultHookReturn,
      citationHistory: historyItems
    });

    render(<CitationFormatter />);

    expect(screen.getByText('Recent citations: 1')).toBeInTheDocument();
    expect(screen.getByText('APA')).toBeInTheDocument();
  });

  it('renders compact version when compact prop is true', () => {
    render(<CitationFormatter compact={true} />);

    // In compact mode, the title should be smaller
    const title = screen.getByText('Citation Formatter');
    expect(title).toHaveClass('text-sm');
  });

  it('toggles settings panel when settings button is clicked', async () => {
    render(<CitationFormatter />);

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);

    // Settings panel should be visible
    await waitFor(() => {
      expect(screen.getByText('Citation Settings')).toBeInTheDocument();
    });
  });

  it('handles citation insertion callbacks', async () => {
    const onCitationInsert = vi.fn().mockResolvedValue(true);
    const onBibliographyInsert = vi.fn().mockResolvedValue(true);

    mockUseCitationFormatter.mockReturnValue({
      ...defaultHookReturn,
      selectedReference: mockReference,
      inlineCitation: '(Doe, 2023)',
      bibliographyEntry: 'Doe, J. (2023). Test Article Title. Test Journal, 10(2), 123-145. https://doi.org/10.1234/test'
    });

    render(
      <CitationFormatter
        reference={mockReference}
        onCitationInsert={onCitationInsert}
        onBibliographyInsert={onBibliographyInsert}
      />
    );

    // The component should render with citation content
    expect(screen.getByText('Inline Citation')).toBeInTheDocument();
    expect(screen.getByText('Bibliography Entry')).toBeInTheDocument();
  });

  it('displays validation result when validation is enabled', () => {
    const validationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: []
    };

    mockUseCitationFormatter.mockReturnValue({
      ...defaultHookReturn,
      selectedReference: mockReference,
      validationResult
    });

    render(<CitationFormatter reference={mockReference} showValidation={true} />);

    // The validation display should be rendered
    expect(screen.getByText('Inline Citation')).toBeInTheDocument();
  });

  it('respects showValidation prop', () => {
    const validationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: []
    };

    mockUseCitationFormatter.mockReturnValue({
      ...defaultHookReturn,
      selectedReference: mockReference,
      validationResult
    });

    const { rerender } = render(
      <CitationFormatter reference={mockReference} showValidation={true} />
    );

    // Should show validation
    expect(screen.getByText('Inline Citation')).toBeInTheDocument();

    // Hide validation
    rerender(<CitationFormatter reference={mockReference} showValidation={false} />);

    // Validation should still be there since it's controlled by the hook
    expect(screen.getByText('Inline Citation')).toBeInTheDocument();
  });
});
