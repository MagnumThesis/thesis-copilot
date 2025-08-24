/**
 * Citation Formatter Custom Hook
 * Manages citation formatting logic for the CitationFormatter component
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Reference, CitationStyle, ValidationResult, CitationInstance } from '../lib/ai-types.js';
import { CitationStyleEngine } from '../worker/lib/citation-style-engine.js';

export interface CitationFormatterState {
  selectedStyle: CitationStyle;
  selectedReference: Reference | null;
  inlineCitation: string;
  bibliographyEntry: string;
  validationResult: ValidationResult | null;
  isProcessing: boolean;
  error: string | null;
  citationHistory: CitationInstance[];
}

export interface CitationFormatterActions {
  setSelectedStyle: (style: CitationStyle) => void;
  setSelectedReference: (reference: Reference | null) => void;
  formatCitation: () => void;
  copyToClipboard: (text: string) => Promise<boolean>;
  insertIntoDocument: (citation: string) => Promise<boolean>;
  validateReference: () => void;
  clearError: () => void;
  addToHistory: (citation: CitationInstance) => void;
  clearHistory: () => void;
}

export type UseCitationFormatterReturn = CitationFormatterState & CitationFormatterActions;

export interface UseCitationFormatterOptions {
  defaultStyle?: CitationStyle;
  autoFormat?: boolean;
  maxHistoryItems?: number;
}

/**
 * @function useCitationFormatter
 * @description Custom hook for managing citation formatting logic.
 * @param {UseCitationFormatterOptions} [options={}] - Options for the citation formatter hook.
 * @returns {UseCitationFormatterReturn} An object containing the citation formatter state and actions.
 */
export function useCitationFormatter(
  options: UseCitationFormatterOptions = {}
): UseCitationFormatterReturn {
  const {
    defaultStyle = CitationStyle.APA,
    autoFormat = true,
    maxHistoryItems = 50
  } = options;

  // State management
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>(defaultStyle);
  const [selectedReference, setSelectedReference] = useState<Reference | null>(null);
  const [inlineCitation, setInlineCitation] = useState<string>('');
  const [bibliographyEntry, setBibliographyEntry] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [citationHistory, setCitationHistory] = useState<CitationInstance[]>([]);

  // Memoized citation formatting
  const formattedCitations = useMemo(() => {
    if (!selectedReference) {
      return { inline: '', bibliography: '' };
    }

    try {
      const inline = CitationStyleEngine.formatInlineCitation(selectedReference, selectedStyle);
      const bibliography = CitationStyleEngine.formatBibliographyEntry(selectedReference, selectedStyle);
      return { inline, bibliography };
    } catch (err) {
      console.error('Citation formatting error:', err);
      return { inline: '', bibliography: '' };
    }
  }, [selectedReference, selectedStyle]);

  // Update formatted citations when they change
  useEffect(() => {
    setInlineCitation(formattedCitations.inline);
    setBibliographyEntry(formattedCitations.bibliography);
  }, [formattedCitations]);

  // Auto-format when reference or style changes
  useEffect(() => {
    if (autoFormat && selectedReference) {
      formatCitation();
    }
  }, [selectedReference, selectedStyle, autoFormat]);

  // Main citation formatting function
  /**
   * @function formatCitation
   * @description Main citation formatting function.
   */
  const formatCitation = useCallback(async () => {
    if (!selectedReference) {
      setError('No reference selected');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Format citations
      const inline = CitationStyleEngine.formatInlineCitation(selectedReference, selectedStyle);
      const bibliography = CitationStyleEngine.formatBibliographyEntry(selectedReference, selectedStyle);

      setInlineCitation(inline);
      setBibliographyEntry(bibliography);

      // Validate the reference
      const validation = CitationStyleEngine.validateStyleRequirements(selectedReference, selectedStyle);
      setValidationResult(validation);

      // Add to history
      const citationInstance: CitationInstance = {
        id: crypto.randomUUID(),
        referenceId: selectedReference.id,
        conversationId: selectedReference.conversationId,
        citationStyle: selectedStyle,
        citationText: inline,
        documentPosition: undefined, // Will be set when inserted
        context: undefined,
        createdAt: new Date()
      };

      addToHistory(citationInstance);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to format citation: ${errorMessage}`);
      console.error('Citation formatting error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedReference, selectedStyle]);

  // Copy to clipboard functionality
  /**
   * @function copyToClipboard
   * @description Copy to clipboard functionality.
   * @param {string} text - The text to copy.
   * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
   */
  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setError('Failed to copy to clipboard');
      return false;
    }
  }, []);

  // Insert citation into document
  /**
   * @function insertIntoDocument
   * @description Insert citation into document.
   * @param {string} citation - The citation to insert.
   * @returns {Promise<boolean>} A promise that resolves to true if successful, false otherwise.
   */
  const insertIntoDocument = useCallback(async (citation: string): Promise<boolean> => {
    try {
      // This would integrate with the document editor
      // For now, we'll just copy to clipboard as a fallback
      const success = await copyToClipboard(citation);
      if (success) {
        // In a real implementation, this would insert directly into the editor
        console.log('Citation would be inserted into document:', citation);
      }
      return success;
    } catch (err) {
      console.error('Failed to insert citation:', err);
      setError('Failed to insert citation into document');
      return false;
    }
  }, [copyToClipboard]);

  // Validate current reference
  /**
   * @function validateReference
   * @description Validate current reference.
   */
  const validateReference = useCallback(() => {
    if (!selectedReference) {
      setValidationResult(null);
      return;
    }

    try {
      const validation = CitationStyleEngine.validateStyleRequirements(selectedReference, selectedStyle);
      setValidationResult(validation);
    } catch (err) {
      console.error('Validation error:', err);
      setError('Failed to validate reference');
    }
  }, [selectedReference, selectedStyle]);

  // Clear error state
  /**
   * @function clearError
   * @description Clear error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Add citation to history
  /**
   * @function addToHistory
   * @description Add citation to history.
   * @param {CitationInstance} citation - The citation instance to add.
   */
  const addToHistory = useCallback((citation: CitationInstance) => {
    setCitationHistory(prev => {
      const newHistory = [citation, ...prev];
      // Keep only the most recent items
      return newHistory.slice(0, maxHistoryItems);
    });
  }, [maxHistoryItems]);

  // Clear citation history
  /**
   * @function clearHistory
   * @description Clear citation history.
   */
  const clearHistory = useCallback(() => {
    setCitationHistory([]);
  }, []);

  // Style change handler with validation
  /**
   * @function handleStyleChange
   * @description Style change handler with validation.
   * @param {CitationStyle} style - The new citation style.
   */
  const handleStyleChange = useCallback((style: CitationStyle) => {
    setSelectedStyle(style);
    if (selectedReference) {
      // Re-validate when style changes
      setTimeout(() => validateReference(), 0);
    }
  }, [selectedReference, validateReference]);

  // Reference change handler with validation
  /**
   * @function handleReferenceChange
   * @description Reference change handler with validation.
   * @param {Reference | null} reference - The new reference.
   */
  const handleReferenceChange = useCallback((reference: Reference | null) => {
    setSelectedReference(reference);
    if (reference) {
      // Validate new reference
      setTimeout(() => validateReference(), 0);
    } else {
      setValidationResult(null);
    }
  }, [validateReference]);

  return {
    // State
    selectedStyle,
    selectedReference,
    inlineCitation,
    bibliographyEntry,
    validationResult,
    isProcessing,
    error,
    citationHistory,

    // Actions
    setSelectedStyle: handleStyleChange,
    setSelectedReference: handleReferenceChange,
    formatCitation,
    copyToClipboard,
    insertIntoDocument,
    validateReference,
    clearError,
    addToHistory,
    clearHistory
  };
}
