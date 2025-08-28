import { useState, useCallback } from "react";
import { 
  ModificationType,
  TextSelection,
  AIError,
  AIErrorType
} from "@/lib/ai-infrastructure";

// Modify mode state interface
export interface ModifyModeState {
  showModificationTypeSelector: boolean;
  showModificationPreview: boolean;
  showCustomPromptInput: boolean;
  currentModificationType: ModificationType | null;
  modificationPreviewContent: string | null;
  originalTextForModification: string | null;
  customPrompt: string | null;
}

// Modify mode actions interface
export interface ModifyModeActions {
  startModifyMode: () => void;
  selectModificationType: (type: ModificationType) => Promise<void>;
  submitCustomPrompt: (prompt: string) => Promise<void>;
  backToModificationTypes: () => void;
  acceptModification: () => void;
  rejectModification: () => void;
  regenerateModification: () => Promise<void>;
}

// AI Modify Mode State interface
export interface AIModifyModeState extends ModifyModeState, ModifyModeActions {
  // Additional state and actions can be added here if needed
}

/**
 * AI Modify Mode State Hook
 * Manages modify mode state and actions for the Builder tool
 */
/**
 * @function useAIModifyModeState
 * @description Manages modify mode state and actions for the Builder tool.
 * @param {string} currentMode - The current AI mode.
 * @param {TextSelection | null} selectedText - The currently selected text.
 * @param {import("./use-ai-mode-state").AIModeState} modeState - The AI mode state.
 * @param {import("./use-ai-error-state").AIErrorState} errorState - The AI error state.
 * @param {import("../ai-mode/use-ai-mode-state").setMode} setMode - Function to set the AI mode.
 * @param {import("../ai-mode/use-ai-mode-state").resetMode} resetMode - Function to reset the AI mode.
 * @param {import("../ai-mode/use-ai-error-state").handleError} handleError - Function to handle errors.
 * @param {import("../ai-mode/use-ai-selection-manager").validateTextSelection} validateTextSelection - Function to validate text selection.
 * @returns {AIModifyModeState} An object containing modify mode state and actions.
 */
export function useAIModifyModeState(
  currentMode: string,
  selectedText: TextSelection | null,
  modeState: any, // This will be replaced with proper type when we have the mode state hook
  errorState: any, // This will be replaced with proper type when we have the error state hook
  setMode: (mode: any) => void, // This will be replaced with proper type when we have the mode state hook
  resetMode: () => void,
  handleError: (error: any, context: any) => void, // This will be replaced with proper type when we have the error state hook
  validateTextSelection: (selection: TextSelection | null) => boolean
): AIModifyModeState {
  // Modify mode specific state
  const [showModificationTypeSelector, setShowModificationTypeSelector] = useState(false);
  const [showModificationPreview, setShowModificationPreview] = useState(false);
  const [showCustomPromptInput, setShowCustomPromptInput] = useState(false);
  const [currentModificationType, setCurrentModificationType] = useState<ModificationType | null>(null);
  const [modificationPreviewContent, setModificationPreviewContent] = useState<string | null>(null);
  const [originalTextForModification, setOriginalTextForModification] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string | null>(null);

  /**
   * Starts modify mode workflow
   */
  /**
   * @function startModifyMode
   * @description Starts modify mode workflow.
   */
  const startModifyMode = useCallback(() => {
    if (!validateTextSelection(selectedText)) {
      console.warn("Cannot start modify mode: invalid text selection");
      return;
    }

    setMode("MODIFY"); // This will be replaced with proper type when we have the mode state hook
    setShowModificationTypeSelector(true);
    setShowModificationPreview(false);
    setShowCustomPromptInput(false);
    setCurrentModificationType(null);
    setModificationPreviewContent(null);
    setOriginalTextForModification(selectedText?.text || null);
    setCustomPrompt(null);
  }, [selectedText, validateTextSelection, setMode]);

  /**
   * Selects modification type and processes the modification
   */
  /**
   * @function selectModificationType
   * @description Selects modification type and processes the modification.
   * @param {ModificationType} type - The type of modification to select.
   */
  const selectModificationType = useCallback(
    async (type: ModificationType) => {
      if (!selectedText || !validateTextSelection(selectedText)) {
        throw new AIError(
          "No valid text selected for modification",
          AIErrorType.VALIDATION_ERROR,
          "NO_SELECTION"
        );
      }

      setCurrentModificationType(type);
      setShowModificationTypeSelector(false);

      // If it's a prompt type, show the custom prompt input
      if (type === ModificationType.PROMPT) {
        setShowCustomPromptInput(true);
        return;
      }

      try {
        // Process the modification for predefined types
        // Note: This will be implemented in the AI operations hook
        // For now, we'll just set up the UI state
        console.info(`Processing modification type: ${type}`);
        
        // Set preview content (this would come from the API in the real implementation)
        setModificationPreviewContent(`Preview content for ${type} modification`);
        setShowModificationPreview(true);
      } catch (error) {
        // Reset state on error
        setShowModificationTypeSelector(true);
        setCurrentModificationType(null);
        setModificationPreviewContent(null);
        throw error;
      }
    },
    [selectedText, validateTextSelection]
  );

  /**
   * Submits custom prompt and processes the modification
   */
  /**
   * @function submitCustomPrompt
   * @description Submits custom prompt and processes the modification.
   * @param {string} prompt - The custom prompt text.
   */
  const submitCustomPrompt = useCallback(
    async (prompt: string) => {
      if (!selectedText || !validateTextSelection(selectedText)) {
        throw new AIError(
          "No valid text selected for modification",
          AIErrorType.VALIDATION_ERROR,
          "NO_SELECTION"
        );
      }

      if (!prompt.trim()) {
        throw new AIError(
          "Custom prompt cannot be empty",
          AIErrorType.VALIDATION_ERROR,
          "EMPTY_PROMPT"
        );
      }

      try {
        setCustomPrompt(prompt);
        setShowCustomPromptInput(false);

        // Process the modification with custom prompt
        // Note: This will be implemented in the AI operations hook
        // For now, we'll just set up the UI state
        console.info(`Processing custom prompt: ${prompt}`);
        
        // Set preview content (this would come from the API in the real implementation)
        setModificationPreviewContent(`Preview content for custom prompt: ${prompt}`);
        setShowModificationPreview(true);
      } catch (error) {
        // Reset state on error
        setShowCustomPromptInput(true);
        setModificationPreviewContent(null);
        throw error;
      }
    },
    [selectedText, validateTextSelection]
  );

  /**
   * Returns to modification type selection
   */
  /**
   * @function backToModificationTypes
   * @description Returns to modification type selection.
   */
  const backToModificationTypes = useCallback(() => {
    setShowCustomPromptInput(false);
    setShowModificationTypeSelector(true);
    setCurrentModificationType(null);
    setCustomPrompt(null);
  }, []);

  /**
   * Accepts the current modification and applies it to the document
   */
  /**
   * @function acceptModification
   * @description Accepts the current modification and applies it to the document.
   */
  const acceptModification = useCallback(() => {
    if (!modificationPreviewContent || !selectedText) {
      console.warn(
        "Cannot accept modification: no content or selection available"
      );
      return;
    }

    // This will be handled by the editor component
    // The editor should replace the selected text with the modified content

    // Reset modify mode state
    setMode("NONE"); // This will be replaced with proper type when we have the mode state hook
    setShowModificationTypeSelector(false);
    setShowModificationPreview(false);
    setShowCustomPromptInput(false);
    setCurrentModificationType(null);
    setModificationPreviewContent(null);
    setOriginalTextForModification(null);
    setCustomPrompt(null);
  }, [modificationPreviewContent, selectedText, setMode]);

  /**
   * Rejects the current modification and returns to type selection
   */
  /**
   * @function rejectModification
   * @description Rejects the current modification and returns to type selection.
   */
  const rejectModification = useCallback(() => {
    setShowModificationPreview(false);
    setModificationPreviewContent(null);

    // Return to type selection if we have valid text selected
    if (validateTextSelection(selectedText)) {
      setShowModificationTypeSelector(true);
      setShowCustomPromptInput(false);
      setCurrentModificationType(null);
      setCustomPrompt(null);
    } else {
      // No valid selection, exit modify mode completely
      resetMode();
      setShowModificationTypeSelector(false);
      setShowCustomPromptInput(false);
      setCurrentModificationType(null);
      setOriginalTextForModification(null);
      setCustomPrompt(null);
    }
  }, [selectedText, validateTextSelection, resetMode]);

  /**
   * Regenerates the current modification with the same type
   */
  /**
   * @function regenerateModification
   * @description Regenerates the current modification with the same type.
   */
  const regenerateModification = useCallback(async () => {
    if (
      !currentModificationType ||
      !selectedText ||
      !validateTextSelection(selectedText)
    ) {
      throw new AIError(
        "Cannot regenerate: missing modification type or selection",
        AIErrorType.VALIDATION_ERROR,
        "INVALID_REGENERATE_STATE"
      );
    }

    try {
      // Process the modification again with the same type and prompt (if applicable)
      // Note: This will be implemented in the AI operations hook
      // For now, we'll just set up the UI state
      console.info(`Regenerating modification type: ${currentModificationType}`);
      
      // Set preview content (this would come from the API in the real implementation)
      setModificationPreviewContent(`Regenerated preview content for ${currentModificationType} modification`);
    } catch (error) {
      console.error("Failed to regenerate modification:", error);
      throw error;
    }
  }, [
    currentModificationType,
    selectedText,
    validateTextSelection,
  ]);

  return {
    // State
    showModificationTypeSelector,
    showModificationPreview,
    showCustomPromptInput,
    currentModificationType,
    modificationPreviewContent,
    originalTextForModification,
    customPrompt,

    // Actions
    startModifyMode,
    selectModificationType,
    submitCustomPrompt,
    backToModificationTypes,
    acceptModification,
    rejectModification,
    regenerateModification,
  };
}