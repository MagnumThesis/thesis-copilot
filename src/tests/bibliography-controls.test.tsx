import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BibliographyControls } from '../components/ui/bibliography-controls';
import { CitationStyle } from '../lib/ai-types';

describe('BibliographyControls', () => {
  it('renders the component with default APA style', () => {
    render(<BibliographyControls />);

    expect(screen.getByText('Bibliography Controls')).toBeInTheDocument();

    // Check if the select has APA as default
    const selectTrigger = screen.getByRole('combobox');
    expect(selectTrigger).toHaveTextContent('APA');

    // Check export buttons
    expect(screen.getByRole('button', { name: /bibtex/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ris/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /json/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /csv/i })).toBeInTheDocument();
  });

  it('renders with a specific citation style', () => {
    render(<BibliographyControls citationStyle={CitationStyle.MLA} />);

    const selectTrigger = screen.getByRole('combobox');
    expect(selectTrigger).toHaveTextContent('MLA');
  });

  it('calls onStyleChange when a new style is selected', async () => {
    const onStyleChange = vi.fn();
    render(<BibliographyControls onStyleChange={onStyleChange} />);

    // Open the select dropdown
    const selectTrigger = screen.getByRole('combobox');
    await userEvent.click(selectTrigger);

    // Select Chicago style
    const option = screen.getByRole('option', { name: 'Chicago' });
    await userEvent.click(option);

    expect(onStyleChange).toHaveBeenCalledTimes(1);
    expect(onStyleChange).toHaveBeenCalledWith(CitationStyle.CHICAGO);
  });

  it('calls onExport with correct format when buttons are clicked', async () => {
    const onExport = vi.fn();
    render(<BibliographyControls onExport={onExport} />);

    // Click BibTeX
    await userEvent.click(screen.getByRole('button', { name: /bibtex/i }));
    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenLastCalledWith('bibtex');

    // Click RIS
    await userEvent.click(screen.getByRole('button', { name: /ris/i }));
    expect(onExport).toHaveBeenCalledTimes(2);
    expect(onExport).toHaveBeenLastCalledWith('ris');

    // Click JSON
    await userEvent.click(screen.getByRole('button', { name: /json/i }));
    expect(onExport).toHaveBeenCalledTimes(3);
    expect(onExport).toHaveBeenLastCalledWith('json');

    // Click CSV
    await userEvent.click(screen.getByRole('button', { name: /csv/i }));
    expect(onExport).toHaveBeenCalledTimes(4);
    expect(onExport).toHaveBeenLastCalledWith('csv');
  });

  it('handles missing onStyleChange callback without throwing', async () => {
    // Render without onStyleChange
    render(<BibliographyControls />);

    // Open the select dropdown
    const selectTrigger = screen.getByRole('combobox');
    await userEvent.click(selectTrigger);

    // Select an option, shouldn't throw error
    const option = screen.getByRole('option', { name: 'MLA' });
    await userEvent.click(option);

    // If it reached here without throwing, test passes
    expect(true).toBe(true);
  });

  it('handles missing onExport callback without throwing', async () => {
    // Render without onExport
    render(<BibliographyControls />);

    // Click a button, shouldn't throw error
    await userEvent.click(screen.getByRole('button', { name: /bibtex/i }));

    // If it reached here without throwing, test passes
    expect(true).toBe(true);
  });
});
