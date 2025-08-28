import { useState, useCallback } from "react";
import {
  TextSelection,
  AIError,
  AIErrorType,
} from "@/lib/ai-infrastructure";

// Text Selection interface
export interface TextSelectionState {
  selectedText: TextSelection | null;
  hasSelectedText: boolean;
}

// Text Selection Actions interface
export interface TextSelectionActions {
  updateSelection: (selection: TextSelection | null) => void;
  validateTextSelection: (selection: TextSelection | null) => boolean;
}

// AI Selection Manager interface
export interface AISelectionManager extends TextSelectionState, TextSelectionActions {
  // Additional state and actions can be added here if needed
}

/**
 * AI Selection Manager Hook
 * Manages text selection state and validation for the Builder tool
 */
/**
 * @function useAISelectionManager
 * @description Manages text selection state and validation for the Builder tool.
 * @param {string} currentMode - The current AI mode.
 * @param {import("./use-ai-mode-state").AIModeState} modeState - The AI mode state.
 * @param {import("./use-ai-mode-state").setMode} setMode - Function to set the AI mode.
 * @param {import("./use-ai-mode-state").resetMode} resetMode - Function to reset the AI mode.
 * @returns {AISelectionManager} An object containing text selection state and actions.
 */
export function useAISelectionManager(
  currentMode: string,
  modeState: any, // This will be replaced with proper type when we have the mode state hook
  setMode: (mode: any) => void, // This will be replaced with proper type when we have the mode state hook
  resetMode: () => void
): AISelectionManager {
  // Text selection state
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);

  // Computed property
  const hasSelectedText =
    selectedText !== null && selectedText.text.trim().length > 0;

  /**
   * Validates text selection for modify mode
   */
  /**
   * @function validateTextSelection
   * @description Validates text selection for modify mode.
   * @param {TextSelection | null} selection - The text selection.
   * @returns {boolean} True if the selection is valid, false otherwise.
   */
  const validateTextSelection = useCallback(
    (selection: TextSelection | null): boolean => {
      if (!selection) return false;

      const text = selection.text.trim();
      if (text.length === 0) return false;
      if (text.length < 3) return false; // Minimum text length for meaningful modification
      if (text.length > 5000) return false; // Maximum text length to avoid API limits

      return true;
    },
    []
  );

  /**
   * Updates text selection state
   */
  /**
   * @function updateSelection
   * @description Updates text selection state.
   * @param {TextSelection | null} selection - The text selection.
   */
  const updateSelection = useCallback(
    (selection: TextSelection | null) => {
      setSelectedText(selection);

      // If modify mode is active but no valid text is selected, reset to NONE
      if (currentMode === "MODIFY" && !validateTextSelection(selection)) {
        resetMode();
        // Note: In the full implementation, we would also update the modify mode state
        // For now, we're just focusing on the selection management
      }
    },
    [currentMode, resetMode, validateTextSelection]
  );

  return {
    // State
    selectedText,
    hasSelectedText,

    // Actions
    updateSelection,
    validateTextSelection,
  };
}