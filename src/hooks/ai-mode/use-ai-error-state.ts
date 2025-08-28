import { useState, useCallback, useRef } from "react";
import {
  AIError,
  AIErrorType,
  AIErrorHandler,
  ErrorRecoveryStrategy,
  ErrorContext,
} from "@/lib/ai-infrastructure";
import { PerformanceMetrics } from "@/lib/performance/metrics-collector";

// Error state interface for UI feedback
export interface ErrorState {
  hasError: boolean;
  error: AIError | null;
  recoveryStrategy: ErrorRecoveryStrategy | null;
  canRetry: boolean;
  retryCount: number;
}

// AI Error State interface
export interface AIErrorState {
  errorState: ErrorState;
  clearError: () => void;
  handleError: (error: unknown, context: ErrorContext) => void;
  retryLastOperation: () => Promise<void>;
  handleGracefulDegradation: () => void;
}

/**
 * AI Error State Hook
 * Manages AI error state, handling, and recovery for the Builder tool
 */
/**
 * @function useAIErrorState
 * @description Manages AI error state, handling, and recovery for the Builder tool.
 * @param {string} currentMode - The current AI mode.
 * @param {import("./use-ai-mode-state").AIModeState} modeState - The AI mode state.
 * @param {import("../ai-mode/use-ai-mode-state").setMode} setMode - Function to set the AI mode.
 * @returns {AIErrorState} An object containing error state and error management functions.
 */
export function useAIErrorState(
  currentMode: string,
  modeState: any, // This will be replaced with proper type when we have the mode state hook
  setMode: (mode: any) => void // This will be replaced with proper type when we have the mode state hook
): AIErrorState {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    recoveryStrategy: null,
    canRetry: false,
    retryCount: 0,
  });

  // Refs for managing error recovery
  const lastOperationRef = useRef<{
    type: string;
    params: any;
  } | null>(null);

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
      if (AIErrorHandler.shouldGracefullyDegrade(aiError)) {
        const fallbackMode = AIErrorHandler.getFallbackMode(aiError, currentMode as any);
        if (fallbackMode !== currentMode) {
          console.info(`Gracefully degrading from ${currentMode} to ${fallbackMode}`);
          setMode(fallbackMode);
        }
      }
    },
    [currentMode, setMode]
  );

  /**
   * Retry the last failed operation
   */
  /**
   * @function retryLastOperation
   * @description Retry the last failed operation.
   */
  const retryLastOperation = useCallback(async () => {
    if (!errorState.canRetry || !lastOperationRef.current) {
      console.warn('Cannot retry: no retryable operation available');
      return;
    }

    const operation = lastOperationRef.current;
    const newRetryCount = errorState.retryCount + 1;

    try {
      clearError();
      console.info(`Retrying operation: ${operation.type}`);
      
      // For now, just clear the error state and let the user manually retry
      // The actual retry logic will be handled by the UI components
    } catch (error) {
      const context = AIErrorHandler.createErrorContext(
        `retry-${operation.type}`,
        currentMode as any,
        newRetryCount
      );
      handleError(error, context);
    }
  }, [errorState.canRetry, errorState.retryCount, currentMode, clearError, handleError]);

  /**
   * Handle graceful degradation manually
   */
  /**
   * @function handleGracefulDegradation
   * @description Handle graceful degradation manually.
   */
  const handleGracefulDegradation = useCallback(() => {
    if (!errorState.error) return;

    const fallbackMode = AIErrorHandler.getFallbackMode(errorState.error, currentMode as any);
    setMode(fallbackMode);
    clearError();

    console.info(`Manual graceful degradation from ${currentMode} to ${fallbackMode}`);
  }, [errorState.error, currentMode, clearError, setMode]);

  return {
    // Error state
    errorState,

    // Error management
    clearError,
    handleError,
    retryLastOperation,
    handleGracefulDegradation,
  };
}