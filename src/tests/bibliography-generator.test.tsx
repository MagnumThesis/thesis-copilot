import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BibliographyGenerator } from '../components/ui/bibliography-generator';
import { CitationStyle } from '../lib/ai-types';

// Mock PointerEvent and hasPointerCapture for Radix UI Select in jsdom
if (typeof window !== 'undefined' && typeof window.PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {
    public pointerId: number;
    public pointerType: string;
    public isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId || 0;
      this.pointerType = params.pointerType || '';
      this.isPrimary = params.isPrimary || false;
    }
  }
  window.PointerEvent = PointerEvent as any;
}

if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
}

if (typeof HTMLElement !== 'undefined') {
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = () => {};
  }
}

describe('BibliographyGenerator', () => {
  const mockReferences = [
    {
      authors: ['Smith, J.', 'Doe, A.'],
      publication_date: '2023',
      title: 'The Art of Writing',
      journal: 'Journal of Creative Arts',
    },
    {
      authors: ['Johnson, B.'],
      publication_date: '2022',
      title: 'Science in Practice',
      publisher: 'Academic Press',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with empty state when no references are provided', () => {
    render(<BibliographyGenerator />);

    expect(screen.getByText('Bibliography Generator')).toBeInTheDocument();
    expect(screen.getByText('Generated Bibliography (0 references)')).toBeInTheDocument();
    expect(screen.getByText('No references available.')).toBeInTheDocument();
    expect(screen.getByText('Add some references to generate a bibliography.')).toBeInTheDocument();
    expect(screen.getByText('No references to display.')).toBeInTheDocument();
  });

  it('renders correctly with APA citation style by default', () => {
    render(<BibliographyGenerator references={mockReferences} />);

    expect(screen.getByText('Generated Bibliography (2 references)')).toBeInTheDocument();

    const formattedText = screen.getByText(/1\. Smith, J., Doe, A\. \(2023\)\. The Art of Writing\. Journal of Creative Arts\./);
    expect(formattedText).toBeInTheDocument();

    const secondFormattedText = screen.getByText(/2\. Johnson, B\. \(2022\)\. Science in Practice\. Academic Press\./);
    expect(secondFormattedText).toBeInTheDocument();
  });

  it('renders correctly with MLA citation style', () => {
    render(<BibliographyGenerator references={mockReferences} citationStyle={CitationStyle.MLA} />);

    const formattedText = screen.getByText(/Smith, J., Doe, A\.. "The Art of Writing." Journal of Creative Arts, 2023\./);
    expect(formattedText).toBeInTheDocument();

    const secondFormattedText = screen.getByText(/Johnson, B\.. "Science in Practice." Academic Press, 2022\./);
    expect(secondFormattedText).toBeInTheDocument();
  });

  it('renders correctly with an unknown or fallback citation style', () => {
    render(<BibliographyGenerator references={mockReferences} citationStyle={CitationStyle.CHICAGO} />);

    // The fallback logic format: `${authors}. ${publicationDate}. ${title}.`
    const formattedText = screen.getByText(/Smith, J., Doe, A\.. 2023. The Art of Writing\./);
    expect(formattedText).toBeInTheDocument();
  });

  it('handles style changes and calls onStyleChange callback', async () => {
    const onStyleChangeMock = vi.fn();
    const user = userEvent.setup();

    render(
      <BibliographyGenerator
        references={mockReferences}
        onStyleChange={onStyleChangeMock}
      />
    );

    // Find the Citation Style select trigger
    // By default it shows "APA"
    const styleSelects = screen.getAllByRole('combobox');
    const styleSelect = styleSelects[0]; // First one is citation style

    await user.click(styleSelect);

    // Select MLA option
    const mlaOption = await screen.findByRole('option', { name: 'MLA' });
    await user.click(mlaOption);

    expect(onStyleChangeMock).toHaveBeenCalledWith(CitationStyle.MLA);
  });

  it('handles format changes and calls onExport callback with correct format', async () => {
    const onExportMock = vi.fn();
    const user = userEvent.setup();

    render(
      <BibliographyGenerator
        references={mockReferences}
        onExport={onExportMock}
      />
    );

    // The second combobox is the Export Format
    const selects = screen.getAllByRole('combobox');
    const formatSelect = selects[1];

    await user.click(formatSelect);

    // Select HTML option
    const htmlOption = await screen.findByRole('option', { name: 'HTML' });
    await user.click(htmlOption);

    // Click Export button
    const exportButton = screen.getByRole('button', { name: /Export Bibliography/i });
    await user.click(exportButton);

    expect(onExportMock).toHaveBeenCalledWith('html');
  });

  it('calls onExport with default text format if no format change is made', async () => {
    const onExportMock = vi.fn();
    const user = userEvent.setup();

    render(
      <BibliographyGenerator
        references={mockReferences}
        onExport={onExportMock}
      />
    );

    // Click Export button
    const exportButton = screen.getByRole('button', { name: /Export Bibliography/i });
    await user.click(exportButton);

    expect(onExportMock).toHaveBeenCalledWith('text');
  });

  it('copies bibliography to clipboard when "Copy to Clipboard" is clicked', async () => {
    const user = userEvent.setup();
    const mockClipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockClipboardWriteText,
      },
      configurable: true,
      writable: true,
    });

    // Mock console.log to prevent cluttering test output, and to check if it's called
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    render(<BibliographyGenerator references={mockReferences} />);

    const copyButton = screen.getByRole('button', { name: /Copy to Clipboard/i });
    await user.click(copyButton);

    expect(mockClipboardWriteText).toHaveBeenCalled();
    const clipboardArg = mockClipboardWriteText.mock.calls[0][0];

    expect(clipboardArg).toContain('1. Smith, J., Doe, A. (2023). The Art of Writing. Journal of Creative Arts.');
    expect(clipboardArg).toContain('2. Johnson, B. (2022). Science in Practice. Academic Press.');

    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith('Bibliography copied to clipboard');
    });

    consoleLogSpy.mockRestore();
  });

  it('handles clipboard copy errors gracefully', async () => {
    const user = userEvent.setup();
    const mockClipboardWriteText = vi.fn().mockRejectedValue(new Error('Clipboard error'));
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockClipboardWriteText,
      },
      configurable: true,
      writable: true,
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<BibliographyGenerator references={mockReferences} />);

    const copyButton = screen.getByRole('button', { name: /Copy to Clipboard/i });
    await user.click(copyButton);

    expect(mockClipboardWriteText).toHaveBeenCalled();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy bibliography:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles malformed references gracefully', () => {
    const malformedReferences = [
      {
        authors: 'Invalid Author Type', // string instead of array
        publication_date: 2023, // number instead of string
        title: null, // null instead of string
        journal: undefined,
      },
      {
        // Missing everything
      }
    ];

    render(<BibliographyGenerator references={malformedReferences as any} />);

    const formattedText = screen.getByText(/1\. Unknown Author \(n\.d\.\)\. Untitled\./);
    expect(formattedText).toBeInTheDocument();

    const secondFormattedText = screen.getByText(/2\. Unknown Author \(n\.d\.\)\. Untitled\./);
    expect(secondFormattedText).toBeInTheDocument();
  });
});
