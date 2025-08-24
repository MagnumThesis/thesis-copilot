/**
 * Bibliography Generator Hook
 * Core logic for bibliography generation and export functionality
 */

import { useState, useCallback, useMemo } from 'react';
import { Reference, CitationStyle, ReferenceType } from '../lib/ai-types.js';
import { CitationStyleEngine } from '../worker/lib/citation-style-engine.js';
import { ExportFormatter, ExportFormat, ExportOptions, generateExportFilename, getExportMimeType, getExportFileExtension } from '../utils/export-formatters.js';

export interface BibliographyGeneratorState {
  references: Reference[];
  style: CitationStyle;
  sortOrder: 'alphabetical' | 'chronological' | 'appearance';
  isGenerating: boolean;
  generatedBibliography: string;
  statistics: BibliographyStatistics;
  error: string | null;
}

export interface BibliographyStatistics {
  totalReferences: number;
  uniqueReferences: number;
  duplicateReferences: number;
  referenceTypes: Record<ReferenceType, number>;
  publicationYears: Record<string, number>;
  averageAuthorsPerReference: number;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  mimeType: string;
  content: string;
  error?: string;
}

export interface BibliographyGeneratorActions {
  setReferences: (references: Reference[]) => void;
  setStyle: (style: CitationStyle) => void;
  setSortOrder: (sortOrder: 'alphabetical' | 'chronological' | 'appearance') => void;
  generateBibliography: () => Promise<void>;
  exportBibliography: (format: ExportFormat, options?: ExportOptions) => Promise<ExportResult>;
  downloadBibliography: (format: ExportFormat, options?: ExportOptions) => Promise<void>;
  copyToClipboard: () => Promise<boolean>;
  reset: () => void;
  clearError: () => void;
}

export type UseBibliographyGeneratorReturn = BibliographyGeneratorState & BibliographyGeneratorActions;

const initialStatistics: BibliographyStatistics = {
  totalReferences: 0,
  uniqueReferences: 0,
  duplicateReferences: 0,
  referenceTypes: {} as Record<ReferenceType, number>,
  publicationYears: {},
  averageAuthorsPerReference: 0
};

const initialState: BibliographyGeneratorState = {
  references: [],
  style: CitationStyle.APA,
  sortOrder: 'alphabetical',
  isGenerating: false,
  generatedBibliography: '',
  statistics: initialStatistics,
  error: null
};

/**
 * Custom hook for bibliography generation and export
 */
/**
 * @function useBibliographyGenerator
 * @description Custom hook for bibliography generation and export.
 * @param {Reference[]} [initialReferences=[]] - Initial list of references.
 * @param {CitationStyle} [initialStyle=CitationStyle.APA] - Initial citation style.
 * @returns {UseBibliographyGeneratorReturn} An object containing the bibliography generator state and actions.
 */
export function useBibliographyGenerator(
  initialReferences: Reference[] = [],
  initialStyle: CitationStyle = CitationStyle.APA
): UseBibliographyGeneratorReturn {
  const [state, setState] = useState<BibliographyGeneratorState>({
    ...initialState,
    references: initialReferences,
    style: initialStyle
  });

  /**
   * Calculate bibliography statistics
   */
  /**
   * @function calculateStatistics
   * @description Calculate bibliography statistics.
   * @param {Reference[]} references - The list of references.
   * @returns {BibliographyStatistics} The calculated statistics.
   */
  const calculateStatistics = useCallback((references: Reference[]): BibliographyStatistics => {
    const totalReferences = references.length;
    const uniqueReferences = new Set(references.map(ref => ref.id)).size;
    const duplicateReferences = totalReferences - uniqueReferences;

    const referenceTypes = references.reduce((acc, ref) => {
      acc[ref.type] = (acc[ref.type] || 0) + 1;
      return acc;
    }, {} as Record<ReferenceType, number>);

    const publicationYears = references.reduce((acc, ref) => {
      if (ref.publicationDate) {
        const year = ref.publicationDate.getFullYear().toString();
        acc[year] = (acc[year] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalAuthors = references.reduce((sum, ref) => sum + ref.authors.length, 0);
    const averageAuthorsPerReference = totalReferences > 0 ? totalAuthors / totalReferences : 0;

    return {
      totalReferences,
      uniqueReferences,
      duplicateReferences,
      referenceTypes,
      publicationYears,
      averageAuthorsPerReference
    };
  }, []);

  /**
   * Set references and update statistics
   */
  /**
   * @function setReferences
   * @description Set references and update statistics.
   * @param {Reference[]} references - The new list of references.
   */
  const setReferences = useCallback((references: Reference[]) => {
    setState(prev => {
      const statistics = calculateStatistics(references);
      return {
        ...prev,
        references,
        statistics,
        error: null
      };
    });
  }, [calculateStatistics]);

  /**
   * Set citation style
   */
  /**
   * @function setStyle
   * @description Set citation style.
   * @param {CitationStyle} style - The new citation style.
   */
  const setStyle = useCallback((style: CitationStyle) => {
    setState(prev => ({
      ...prev,
      style,
      error: null
    }));
  }, []);

  /**
   * Set sort order
   */
  /**
   * @function setSortOrder
   * @description Set sort order.
   * @param {'alphabetical' | 'chronological' | 'appearance'} sortOrder - The new sort order.
   */
  const setSortOrder = useCallback((sortOrder: 'alphabetical' | 'chronological' | 'appearance') => {
    setState(prev => ({
      ...prev,
      sortOrder,
      error: null
    }));
  }, []);

  /**
   * Generate bibliography using CitationStyleEngine
   */
  /**
   * @function generateBibliography
   * @description Generate bibliography using CitationStyleEngine.
   */
  const generateBibliography = useCallback(async () => {
    if (state.references.length === 0) {
      setState(prev => ({
        ...prev,
        error: 'No references provided for bibliography generation'
      }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      // Generate bibliography using CitationStyleEngine
      const bibliography = await CitationStyleEngine.generateBibliography(
        state.references,
        state.style,
        state.sortOrder
      );

      setState(prev => ({
        ...prev,
        generatedBibliography: bibliography,
        isGenerating: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate bibliography'
      }));
    }
  }, [state.references, state.style, state.sortOrder]);

  /**
   * Export bibliography to specified format
   */
  const   /**
   * @function exportBibliography
   * @description Export bibliography to specified format.
   * @param {ExportFormat} format - The export format.
   * @param {ExportOptions} [options={}] - Export options.
   * @returns {Promise<ExportResult>} A promise that resolves with the export result.
   */
  const exportBibliography = useCallback(async (
    format: ExportFormat,
    options: ExportOptions = {}
  ): Promise<ExportResult> => {
    if (state.generatedBibliography.length === 0) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        content: '',
        error: 'No bibliography generated to export'
      };
    }

    try {
      // Convert formatted bibliography to export format
      // Note: We need to pass the original references, not the formatted strings
      const exportedContent = ExportFormatter.exportBibliography(
        state.references,
        format,
        options
      );

      const filename = generateExportFilename(state.style, format);
      const mimeType = getExportMimeType(format);

      return {
        success: true,
        filename,
        mimeType,
        content: exportedContent
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export bibliography';
      return {
        success: false,
        filename: '',
        mimeType: '',
        content: '',
        error: errorMessage
      };
    }
  }, [state.generatedBibliography, state.references, state.style]);

  /**
   * Download bibliography as file
   */
  /**
   * @function downloadBibliography
   * @description Download bibliography as file.
   * @param {ExportFormat} format - The export format.
   * @param {ExportOptions} [options={}] - Export options.
   * @returns {Promise<void>} A promise that resolves when the download is initiated.
   */
  const downloadBibliography = useCallback(async (
    format: ExportFormat,
    options: ExportOptions = {}
  ): Promise<void> => {
    const result = await exportBibliography(format, options);

    if (!result.success) {
      setState(prev => ({ ...prev, error: result.error || 'Export failed' }));
      return;
    }

    try {
      // Create blob and download
      const blob = new Blob([result.content], { type: result.mimeType });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${result.filename}${getExportFileExtension(format)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download bibliography';
      setState(prev => ({ ...prev, error: errorMessage }));
    }
  }, [exportBibliography]);

  /**
   * Copy bibliography to clipboard
   */
  /**
   * @function copyToClipboard
   * @description Copy bibliography to clipboard.
   * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
   */
  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    if (state.generatedBibliography.length === 0) {
      setState(prev => ({
        ...prev,
        error: 'No bibliography generated to copy'
      }));
      return false;
    }

    try {
      // Since generatedBibliography is already a formatted string, use it directly
      await navigator.clipboard.writeText(state.generatedBibliography);
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to copy bibliography to clipboard'
      }));
      return false;
    }
  }, [state.generatedBibliography]);

  /**
   * Reset the generator state
   */
  /**
   * @function reset
   * @description Reset the generator state.
   */
  const reset = useCallback(() => {
    setState({
      ...initialState,
      references: [],
      statistics: initialStatistics
    });
  }, []);

  /**
   * Clear error state
   */
  /**
   * @function clearError
   * @description Clear error state.
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Memoize statistics calculation
  const statistics = useMemo(() => {
    return calculateStatistics(state.references);
  }, [state.references, calculateStatistics]);

  return {
    ...state,
    statistics,
    setReferences,
    setStyle,
    setSortOrder,
    generateBibliography,
    exportBibliography,
    downloadBibliography,
    copyToClipboard,
    reset,
    clearError
  };
}

export default useBibliographyGenerator;
