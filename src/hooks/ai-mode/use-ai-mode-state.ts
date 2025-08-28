import { useState, useCallback, useRef } from "react";
import {
  AIMode,
  ModificationType,
  AIProcessingState,
  TextSelection,
  AIResponse,
  AIError,
  AIErrorType,
  AIErrorHandler,
  ErrorRecoveryStrategy,
  ErrorContext,
} from "@/lib/ai-infrastructure";
import { 
  aiPerformanceOptimizer, 
  OptimisticUpdate
} from "@/lib/ai-performance-optimizer";
import { PerformanceMetrics } from "@/lib/performance/metrics-collector";

// Configuration for AI mode manager
interface AIModeManagerConfig {
  maxRetries?: number;
  timeout?: number;
  debounceMs?: number;
  enableGracefulDegradation?: boolean;
  showErrorNotifications?: boolean;
  enableCaching?: boolean;
  enableOptimisticUpdates?: boolean;
  enableContextOptimization?: boolean;
}

// Error state interface for UI feedback
interface ErrorState {
  hasError: boolean;
  error: AIError | null;
  recoveryStrategy: ErrorRecoveryStrategy | null;
  canRetry: boolean;
  retryCount: number;
}

// AI Mode State interface
export interface AIModeState {
  currentMode: AIMode;
  processingState: AIProcessingState;
  hasSelectedText: boolean;
  selectedText: TextSelection | null;
  errorState: ErrorState;
  
  // Mode management
  setMode: (mode: AIMode) => void;
  resetMode: () => void;
  
  // Error handling
  clearError: () => void;
  handleError: (error: unknown, context: ErrorContext) => void;
  
  // Selection management
  updateSelection: (selection: TextSelection | null) => void;
  validateTextSelection: (selection: TextSelection | null) => boolean;
  
  // Utility methods
  canActivateMode: (mode: AIMode) => boolean;
}

// Default configuration
const DEFAULT_CONFIG: Required<AIModeManagerConfig> = {
  maxRetries: 3,
  timeout: 30000,
  debounceMs: 300,
  enableGracefulDegradation: true,
  showErrorNotifications: true,
  enableCaching: true,
  enableOptimisticUpdates: true,
  enableContextOptimization: true,
};

/**
 * AI Mode State Hook
 * Manages AI mode state, transitions, and processing state for the Builder tool
 */
/**
 * @function useAIModeState
 * @description Manages AI mode state, transitions, and processing state for the Builder tool.
 * @param {string} conversationId - The ID of the current conversation.
 * @param {string} documentContent - The current content of the document.
 * @param {AIModeManagerConfig} [config={}] - Configuration options for the AI mode manager.
 * @returns {AIModeState} An object containing state and mode management functions.
 */
export function useAIModeState(
  conversationId: string,
  documentContent: string,
  config: AIModeManagerConfig = {}
): AIModeState {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // State management
  const [currentMode, setCurrentMode] = useState<AIMode>(AIMode.NONE);
  const [processingState, setProcessingState] = useState<AIProcessingState>({
    isProcessing: false,
    currentMode: AIMode.NONE,
  });
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    recoveryStrategy: null,
    canRetry: false,
    retryCount: 0,
  });

  // Refs for managing async operations and error recovery
  const abortControllerRef = useRef<AbortController | null>(null);

  // Computed properties
  const hasSelectedText =
    selectedText !== null && selectedText.text.trim().length > 0;

  /**
   * Validates if a mode can be activated based on current state
   */
  /**
   * @function canActivateMode
   * @description Validates if a mode can be activated based on current state.
   * @param {AIMode} mode - The AI mode to check.
   * @returns {boolean} True if the mode can be activated, false otherwise.
   */
  const canActivateMode = useCallback(
    (mode: AIMode): boolean => {
      const isProcessing = processingState.isProcessing;
      
      switch (mode) {
        case AIMode.NONE:
          return true;
        case AIMode.PROMPT:
          return !isProcessing;
        case AIMode.CONTINUE:
          return !isProcessing && documentContent.trim().length > 0;
        case AIMode.MODIFY:
          return !isProcessing && hasSelectedText;
        default:
          return false;
      }
    },
    [processingState.isProcessing, hasSelectedText, documentContent]
  );

  /**
   * Sets the current AI mode with validation
   */
  /**
   * @function setMode
   * @description Sets the current AI mode with validation.
   * @param {AIMode} mode - The AI mode to set.
   */
  const setMode = useCallback(
    (mode: AIMode) => {
      if (!canActivateMode(mode)) {
        console.warn(
          `Cannot activate mode ${mode}. Current state does not allow it.`
        );
        return;
      }

      // Cancel any ongoing operations when switching modes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      setCurrentMode(mode);
      setProcessingState((prev) => ({
        ...prev,
        currentMode: mode,
        isProcessing: false,
        progress: undefined,
        statusMessage: undefined,
      }));
    },
    [canActivateMode]
  );

  /**
   * Resets mode to NONE and clears errors
   */
  /**
   * @function resetMode
   * @description Resets mode to NONE and clears errors.
   */
  const resetMode = useCallback(() => {
    setMode(AIMode.NONE);
    clearError();
  }, [setMode]);

  /**
   * Clear error state
   */
  /**
   * @function clearError
   * @description Clear error state.
   */
  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      recoveryStrategy: null,
      canRetry: false,
      retryCount: 0,
    });
  }, []);

  /**
   * Handle error with recovery strategy
   */
  /**
   * @function handleError
   * @description Handle error with recovery strategy.
   * @param {unknown} error - The error to handle.
   * @param {ErrorContext} context - The context of the error.
   */
  const handleError = useCallback(
    (error: unknown, context: ErrorContext) => {
      const aiError = error instanceof AIError ? error : new AIError(
        error instanceof Error ? error.message : String(error),
        AIErrorType.UNKNOWN_ERROR,
        'UNKNOWN',
        false,
        error instanceof Error ? error : undefined
      );
      const recoveryStrategy = AIErrorHandler.getRetryStrategy(aiError);

      setErrorState({
        hasError: true,
        error: aiError,
        recoveryStrategy,
        canRetry: recoveryStrategy.retryAttempts > 0 && (context.retryCount || 0) < recoveryStrategy.retryAttempts,
        retryCount: context.retryCount || 0,
      });

      // Log error with context
      AIErrorHandler.handleError(aiError, context.operation, context);

      // Handle graceful degradation if enabled
      if (mergedConfig.enableGracefulDegradation && AIErrorHandler.shouldGracefullyDegrade(aiError)) {
        const fallbackMode = AIErrorHandler.getFallbackMode(aiError, currentMode);
        if (fallbackMode !== currentMode) {
          console.info(`Gracefully degrading from ${currentMode} to ${fallbackMode}`);
          setCurrentMode(fallbackMode);
        }
      }

      // Clear optimistic update on error
      // Note: This will be handled by the main hook

      // Reset processing state
      setProcessingState({
        isProcessing: false,
        currentMode: currentMode,
        progress: undefined,
        statusMessage: undefined,
      });
    },
    [mergedConfig.enableGracefulDegradation, currentMode]
  );

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
      if (currentMode === AIMode.MODIFY && !validateTextSelection(selection)) {
        resetMode();
        // Note: setShowModificationTypeSelector and setShowModificationPreview will be handled by the main hook
      }
    },
    [currentMode, resetMode, validateTextSelection]
  );

  return {
    // State
    currentMode,
    processingState,
    hasSelectedText,
    selectedText,
    errorState,

    // Mode management
    setMode,
    resetMode,

    // Error handling
    clearError,
    handleError,

    // Selection management
    updateSelection,
    validateTextSelection,

    // Utility methods
    canActivateMode,
  };
}