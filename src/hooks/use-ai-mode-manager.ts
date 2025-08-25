import { useState, useCallback, useRef, useEffect } from "react";
import {
  AIMode,
  ModificationType,
  AIProcessingState,
  TextSelection,
  AIResponse,
  AIPromptRequest,
  AIContinueRequest,
  AIModifyRequest,
  AIError,
  AIErrorType,
  AIErrorHandler,
  ErrorRecoveryStrategy,
  ErrorContext,
} from "@/lib/ai-infrastructure";
import { 
  aiPerformanceOptimizer, 
  OptimisticUpdate, 
  PerformanceMetrics 
} from "@/lib/ai-performance-optimizer";

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

// AI Mode Manager hook interface
export interface UseAIModeManager {
  // State
  currentMode: AIMode;
  processingState: AIProcessingState;
  hasSelectedText: boolean;
  selectedText: TextSelection | null;
  errorState: ErrorState;

  // Mode management
  setMode: (mode: AIMode) => void;
  resetMode: () => void;

  // AI operations
  processPrompt: (
    prompt: string,
    cursorPosition: number
  ) => Promise<AIResponse>;
  processContinue: (
    cursorPosition: number,
    selectedText?: string
  ) => Promise<AIResponse>;
  processModify: (
    selectedText: string,
    modificationType: ModificationType
  ) => Promise<AIResponse>;

  // Error handling and recovery
  retryLastOperation: () => Promise<void>;
  clearError: () => void;
  handleGracefulDegradation: () => void;

  // Selection management
  updateSelection: (selection: TextSelection | null) => void;
  validateTextSelection: (selection: TextSelection | null) => boolean;

  // Modify mode specific
  showModificationTypeSelector: boolean;
  showModificationPreview: boolean;
  showCustomPromptInput: boolean;
  currentModificationType: ModificationType | null;
  modificationPreviewContent: string | null;
  originalTextForModification: string | null;
  customPrompt: string | null;

  // Modify mode actions
  startModifyMode: () => void;
  selectModificationType: (type: ModificationType) => Promise<void>;
  submitCustomPrompt: (prompt: string) => Promise<void>;
  backToModificationTypes: () => void;
  acceptModification: () => void;
  rejectModification: () => void;
  regenerateModification: () => Promise<void>;

  // Utility methods
  canActivateMode: (mode: AIMode) => boolean;
  isProcessing: boolean;

  // Performance optimization features
  optimisticUpdate: OptimisticUpdate | null;
  performanceMetrics: PerformanceMetrics;
  clearCache: () => void;
  getOptimizedContent: (content: string, mode: AIMode) => string;
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
 * AI Mode Manager Hook
 * Manages AI mode state, transitions, and processing for the Builder tool
 */
/**
 * @function useAIModeManager
 * @description Manages AI mode state, transitions, and processing for the Builder tool.
 * @param {string} conversationId - The ID of the current conversation.
 * @param {string} documentContent - The current content of the document.
 * @param {AIModeManagerConfig} [config={}] - Configuration options for the AI mode manager.
 * @returns {UseAIModeManager} An object containing state, mode management functions, AI operations, error handling, and modify mode specific functions.
 */
export function useAIModeManager(
  conversationId: string,
  documentContent: string,
  config: AIModeManagerConfig = {}
): UseAIModeManager {
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

  // Modify mode specific state
  const [showModificationTypeSelector, setShowModificationTypeSelector] =
    useState(false);
  const [showModificationPreview, setShowModificationPreview] = useState(false);
  const [showCustomPromptInput, setShowCustomPromptInput] = useState(false);
  const [currentModificationType, setCurrentModificationType] =
    useState<ModificationType | null>(null);
  const [modificationPreviewContent, setModificationPreviewContent] = useState<
    string | null
  >(null);
  const [originalTextForModification, setOriginalTextForModification] =
    useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string | null>(null);

  // Performance optimization state
  const [optimisticUpdate, setOptimisticUpdate] = useState<OptimisticUpdate | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>(
    aiPerformanceOptimizer.getMetrics()
  );

  // Refs for managing async operations and error recovery
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastOperationRef = useRef<{
    type: 'prompt' | 'continue' | 'modify';
    params: any;
  } | null>(null);

  // Computed properties
  const hasSelectedText =
    selectedText !== null && selectedText.text.trim().length > 0;
  const isProcessing = processingState.isProcessing;

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
    [isProcessing, hasSelectedText, documentContent]
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
      setOptimisticUpdate(null);

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
        currentMode,
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

    const fallbackMode = AIErrorHandler.getFallbackMode(errorState.error, currentMode);
    setCurrentMode(fallbackMode);
    clearError();

    console.info(`Manual graceful degradation from ${currentMode} to ${fallbackMode}`);
  }, [errorState.error, currentMode, clearError]);

  /**
   * Clear performance cache
   */
  /**
   * @function clearCache
   * @description Clear performance cache.
   */
  const clearCache = useCallback(() => {
    aiPerformanceOptimizer.clearCache();
    setPerformanceMetrics(aiPerformanceOptimizer.getMetrics());
  }, []);

  /**
   * Get optimized content for AI processing
   */
  /**
   * @function getOptimizedContent
   * @description Get optimized content for AI processing.
   * @param {string} content - The content to optimize.
   * @param {AIMode} mode - The AI mode.
   * @returns {string} The optimized content.
   */
  const getOptimizedContent = useCallback((content: string, mode: AIMode): string => {
    if (!mergedConfig.enableContextOptimization) {
      return content;
    }
    return aiPerformanceOptimizer.optimizeDocumentContent(content, mode);
  }, [mergedConfig.enableContextOptimization]);

  /**
   * Update performance metrics
   */
  /**
   * @function updatePerformanceMetrics
   * @description Update performance metrics.
   */
  const updatePerformanceMetrics = useCallback(() => {
    setPerformanceMetrics(aiPerformanceOptimizer.getMetrics());
  }, []);

  /**
   * Create optimistic update for immediate UI feedback
   */
  /**
   * @function createOptimisticUpdate
   * @description Create optimistic update for immediate UI feedback.
   * @param {AIMode} mode - The AI mode.
   * @param {Record<string, any>} parameters - The parameters for the update.
   * @returns {OptimisticUpdate | null} The optimistic update or null.
   */
  const createOptimisticUpdate = useCallback((mode: AIMode, parameters: Record<string, any>) => {
    if (!mergedConfig.enableOptimisticUpdates) {
      return null;
    }
    return aiPerformanceOptimizer.createOptimisticUpdate(mode, parameters);
  }, [mergedConfig.enableOptimisticUpdates]);

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
        setShowModificationTypeSelector(false);
        setShowModificationPreview(false);
      }
    },
    [currentMode, resetMode, validateTextSelection]
  );

  /**
   * Generic AI request handler with comprehensive error handling and retry logic
   */
    /**
   * @function handleAIRequest
   * @description Generic AI request handler with comprehensive error handling and retry logic.
   * @template T
   * @param {() => Promise<T>} requestFn - The function to execute the AI request.
   * @param {AIMode} mode - The AI mode.
   * @param {string} statusMessage - The status message to display during processing.
   * @param {'prompt' | 'continue' | 'modify'} operationType - The type of AI operation.
   * @param {any} operationParams - The parameters for the AI operation.
   * @returns {Promise<T>} The AI response.
   */
  const handleAIRequest = useCallback(
    async <T extends AIResponse>(
      requestFn: () => Promise<T>,
      mode: AIMode,
      statusMessage: string,
      operationType: 'prompt' | 'continue' | 'modify',
      operationParams: any
    ): Promise<T> => {
      // Clear any existing errors
      clearError();

      // Store operation for potential retry
      lastOperationRef.current = {
        type: operationType,
        params: operationParams,
      };

      // Create error context
      const errorContext = AIErrorHandler.createErrorContext(operationType, mode, 0);

      // Validate request parameters
      try {
        AIErrorHandler.validateRequest({ conversationId, documentContent }, [
          "conversationId",
          "documentContent",
        ]);
      } catch (error) {
        const validationError = AIErrorHandler.normalizeError(error);
        handleError(validationError, errorContext);
        throw validationError;
      }

      // Set up abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Update processing state
      setProcessingState({
        isProcessing: true,
        currentMode: mode,
        progress: 0,
        statusMessage,
      });

      try {
        // Use network error handler for robust retry logic
        const response = await AIErrorHandler.handleNetworkError(
          async () => {
            // Check if operation was cancelled
            if (abortControllerRef.current?.signal.aborted) {
              throw new AIError(
                "Operation was cancelled",
                AIErrorType.OPERATION_CANCELLED,
                "CANCELLED"
              );
            }

            // Update progress
            setProcessingState((prev) => ({
              ...prev,
              progress: 25,
              statusMessage: "Connecting to AI service...",
            }));

            // Execute the request with timeout
            const response = await Promise.race([
              requestFn(),
              new Promise<never>((_, reject) => {
                setTimeout(
                  () =>
                    reject(
                      new AIError(
                        "Request timeout",
                        AIErrorType.TIMEOUT_ERROR,
                        "TIMEOUT",
                        true
                      )
                    ),
                  mergedConfig.timeout
                );
              }),
            ]);

            // Update progress
            setProcessingState((prev) => ({
              ...prev,
              progress: 75,
              statusMessage: "Processing response...",
            }));

            // Validate response
            if (!response) {
              throw new AIError(
                "Empty response from AI service",
                AIErrorType.API_ERROR,
                "EMPTY_RESPONSE",
                true
              );
            }

            return response;
          },
          errorContext,
          mergedConfig.maxRetries
        );

        // Update progress to completion
        setProcessingState((prev) => ({
          ...prev,
          progress: 100,
          statusMessage: "Processing complete",
        }));

        // Reset processing state after a brief delay
        setTimeout(() => {
          setProcessingState({
            isProcessing: false,
            currentMode: mode,
            progress: undefined,
            statusMessage: undefined,
          });
        }, 500);

        return response;
      } catch (error) {
        // Handle error with recovery strategy
        handleError(error, errorContext);
        throw error;
      }
    },
    [conversationId, documentContent, mergedConfig, clearError, handleError]
  );

  /**
   * Processes a prompt request with comprehensive error handling and performance optimizations
   */
  /**
   * @function processPrompt
   * @description Processes a prompt request with comprehensive error handling and performance optimizations.
   * @param {string} prompt - The prompt text.
   * @param {number} cursorPosition - The current cursor position.
   * @returns {Promise<AIResponse>} The AI response.
   */
  const processPrompt = useCallback(
    async (prompt: string, cursorPosition: number): Promise<AIResponse> => {
      if (!prompt.trim()) {
        throw new AIError(
          "Prompt cannot be empty",
          AIErrorType.VALIDATION_ERROR,
          "EMPTY_PROMPT"
        );
      }

      const operationParams = { prompt: prompt.trim(), cursorPosition };

      // Create optimistic update if enabled
      if (mergedConfig.enableOptimisticUpdates) {
        const optimistic = createOptimisticUpdate(AIMode.PROMPT, operationParams);
        setOptimisticUpdate(optimistic);
      }

      // Use performance optimizer for the request
      return aiPerformanceOptimizer.optimizedRequest(
        AIMode.PROMPT,
        documentContent,
        operationParams,
        async () => {
          const request: AIPromptRequest = {
            prompt: prompt.trim(),
            documentContent: getOptimizedContent(documentContent, AIMode.PROMPT),
            cursorPosition,
            conversationId,
            timestamp: Date.now(),
          };

          return handleAIRequest(
            async () => {
              const response = await fetch("/api/builder/ai/prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request),
                signal: abortControllerRef.current?.signal,
              });

              if (!response.ok) {
                const errorText = await response.text().catch(() => response.statusText);
                throw new AIError(
                  `AI service error: ${errorText}`,
                  response.status >= 500 ? AIErrorType.SERVICE_UNAVAILABLE : AIErrorType.API_ERROR,
                  `HTTP_${response.status}`,
                  response.status >= 500 || response.status === 429
                );
              }

              const result = await response.json();
              
              // Validate response structure
              if (!result || typeof result.success !== 'boolean') {
                throw new AIError(
                  "Invalid response format from AI service",
                  AIErrorType.API_ERROR,
                  "INVALID_RESPONSE",
                  true
                );
              }

              // Clear optimistic update on success
              setOptimisticUpdate(null);
              updatePerformanceMetrics();

              return result as AIResponse;
            },
            AIMode.PROMPT,
            "Generating content from prompt...",
            'prompt',
            operationParams
          );
        },
        {
          enableCaching: mergedConfig.enableCaching,
          enableDebouncing: true,
          enableOptimization: mergedConfig.enableContextOptimization,
        }
      );
    },
    [documentContent, conversationId, handleAIRequest, mergedConfig, createOptimisticUpdate, getOptimizedContent, updatePerformanceMetrics]
  );

  /**
   * Processes a continue request with comprehensive error handling and performance optimizations
   */
  const /**
   * @function processContinue
   * @description Processes a continue request with comprehensive error handling and performance optimizations.
   * @param {number} cursorPosition - The current cursor position.
   * @param {string} [selectedText] - The selected text, if any.
   * @returns {Promise<AIResponse>} The AI response.
   */
  const processContinue = useCallback(
    async (
      cursorPosition: number,
      selectedText?: string
    ): Promise<AIResponse> => {
      const operationParams = { cursorPosition, selectedText, documentContent };

      // Create optimistic update if enabled
      if (mergedConfig.enableOptimisticUpdates) {
        const optimistic = createOptimisticUpdate(AIMode.CONTINUE, operationParams);
        setOptimisticUpdate(optimistic);
      }

      // Use performance optimizer for the request
      return aiPerformanceOptimizer.optimizedRequest(
        AIMode.CONTINUE,
        documentContent,
        operationParams,
        async () => {
          const request: AIContinueRequest = {
            documentContent: getOptimizedContent(documentContent, AIMode.CONTINUE),
            cursorPosition,
            selectedText,
            conversationId,
            timestamp: Date.now(),
          };

          return handleAIRequest(
            async () => {
              const response = await fetch("/api/builder/ai/continue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request),
                signal: abortControllerRef.current?.signal,
              });

              if (!response.ok) {
                const errorText = await response.text().catch(() => response.statusText);
                throw new AIError(
                  `AI service error: ${errorText}`,
                  response.status >= 500 ? AIErrorType.SERVICE_UNAVAILABLE : AIErrorType.API_ERROR,
                  `HTTP_${response.status}`,
                  response.status >= 500 || response.status === 429
                );
              }

              const result = await response.json();
              
              // Validate response structure
              if (!result || typeof result.success !== 'boolean') {
                throw new AIError(
                  "Invalid response format from AI service",
                  AIErrorType.API_ERROR,
                  "INVALID_RESPONSE",
                  true
                );
              }

              // Clear optimistic update on success
              setOptimisticUpdate(null);
              updatePerformanceMetrics();

              return result as AIResponse;
            },
            AIMode.CONTINUE,
            "Continuing content generation...",
            'continue',
            operationParams
          );
        },
        {
          enableCaching: mergedConfig.enableCaching,
          enableDebouncing: true,
          enableOptimization: mergedConfig.enableContextOptimization,
        }
      );
    },
    [documentContent, conversationId, handleAIRequest, mergedConfig, createOptimisticUpdate, getOptimizedContent, updatePerformanceMetrics]
  );

  /**
   * Processes a modify request with comprehensive error handling and performance optimizations
   */
  const   /**
   * @function processModify
   * @description Processes a modify request with comprehensive error handling and performance optimizations.
   * @param {string} selectedText - The selected text to modify.
   * @param {ModificationType} modificationType - The type of modification to perform.
   * @param {string} [customPromptText] - Optional custom prompt text for `ModificationType.PROMPT`.
   * @returns {Promise<AIResponse>} The AI response.
   */
  const processModify = useCallback(
    async (
      selectedText: string,
      modificationType: ModificationType,
      customPromptText?: string
    ): Promise<AIResponse> => {
      if (!selectedText.trim()) {
        throw new AIError(
          "Selected text cannot be empty",
          AIErrorType.VALIDATION_ERROR,
          "EMPTY_SELECTION"
        );
      }

      const operationParams = { selectedText: selectedText.trim(), modificationType, customPrompt: customPromptText };

      // Create optimistic update if enabled
      if (mergedConfig.enableOptimisticUpdates) {
        const optimistic = createOptimisticUpdate(AIMode.MODIFY, operationParams);
        setOptimisticUpdate(optimistic);
      }

      // Use performance optimizer for the request
      return aiPerformanceOptimizer.optimizedRequest(
        AIMode.MODIFY,
        documentContent,
        operationParams,
        async () => {
          const request: AIModifyRequest = {
            selectedText: selectedText.trim(),
            modificationType,
            documentContent: getOptimizedContent(documentContent, AIMode.MODIFY),
            conversationId,
            timestamp: Date.now(),
            ...(modificationType === ModificationType.PROMPT &&
              customPromptText && {
                customPrompt: customPromptText,
              }),
          };

          return handleAIRequest(
            async () => {
              const response = await fetch("/api/builder/ai/modify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(request),
                signal: abortControllerRef.current?.signal,
              });

              if (!response.ok) {
                const errorText = await response.text().catch(() => response.statusText);
                throw new AIError(
                  `AI service error: ${errorText}`,
                  response.status >= 500 ? AIErrorType.SERVICE_UNAVAILABLE : AIErrorType.API_ERROR,
                  `HTTP_${response.status}`,
                  response.status >= 500 || response.status === 429
                );
              }

              const result = await response.json();
              
              // Validate response structure
              if (!result || typeof result.success !== 'boolean') {
                throw new AIError(
                  "Invalid response format from AI service",
                  AIErrorType.API_ERROR,
                  "INVALID_RESPONSE",
                  true
                );
              }

              // Clear optimistic update on success
              setOptimisticUpdate(null);
              updatePerformanceMetrics();

              return result as AIResponse;
            },
            AIMode.MODIFY,
            `Modifying content (${modificationType})...`,
            'modify',
            operationParams
          );
        },
        {
          enableCaching: mergedConfig.enableCaching,
          enableDebouncing: true,
          enableOptimization: mergedConfig.enableContextOptimization,
        }
      );
    },
    [documentContent, conversationId, handleAIRequest, mergedConfig, createOptimisticUpdate, getOptimizedContent, updatePerformanceMetrics]
  );

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

    setCurrentMode(AIMode.MODIFY);
    setShowModificationTypeSelector(true);
    setShowModificationPreview(false);
    setShowCustomPromptInput(false);
    setCurrentModificationType(null);
    setModificationPreviewContent(null);
    setOriginalTextForModification(selectedText?.text || null);
    setCustomPrompt(null);
  }, [selectedText, validateTextSelection]);

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
        const response = await processModify(selectedText.text, type);

        if (response.success && response.content) {
          setModificationPreviewContent(response.content);
          setShowModificationPreview(true);
        } else {
          throw new AIError(
            !response.success ? (response as any).error || "Failed to generate modification" : "Failed to generate modification",
            AIErrorType.API_ERROR,
            "MODIFICATION_FAILED"
          );
        }
      } catch (error) {
        // Reset state on error
        setShowModificationTypeSelector(true);
        setCurrentModificationType(null);
        setModificationPreviewContent(null);
        throw error;
      }
    },
    [selectedText, validateTextSelection, processModify]
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
        const response = await processModify(
          selectedText.text,
          ModificationType.PROMPT,
          prompt
        );

        if (response.success && response.content) {
          setModificationPreviewContent(response.content);
          setShowModificationPreview(true);
        } else {
          throw new AIError(
            !response.success ? (response as any).error || "Failed to generate modification" : "Failed to generate modification",
            AIErrorType.API_ERROR,
            "MODIFICATION_FAILED"
          );
        }
      } catch (error) {
        // Reset state on error
        setShowCustomPromptInput(true);
        setModificationPreviewContent(null);
        throw error;
      }
    },
    [selectedText, validateTextSelection, processModify]
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
    setCurrentMode(AIMode.NONE);
    setShowModificationTypeSelector(false);
    setShowModificationPreview(false);
    setShowCustomPromptInput(false);
    setCurrentModificationType(null);
    setModificationPreviewContent(null);
    setOriginalTextForModification(null);
    setCustomPrompt(null);
  }, [modificationPreviewContent, selectedText]);

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
      const response = await processModify(
        selectedText.text,
        currentModificationType,
        currentModificationType === ModificationType.PROMPT
          ? customPrompt || undefined
          : undefined
      );

      if (response.success && response.content) {
        setModificationPreviewContent(response.content);
      } else {
        throw new AIError(
          !response.success ? (response as any).error || "Failed to regenerate modification" : "Failed to regenerate modification",
          AIErrorType.API_ERROR,
          "REGENERATION_FAILED"
        );
      }
    } catch (error) {
      console.error("Failed to regenerate modification:", error);
      throw error;
    }
  }, [
    currentModificationType,
    selectedText,
    validateTextSelection,
    processModify,
    customPrompt,
  ]);

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

    // AI operations
    processPrompt,
    processContinue,
    processModify,

    // Error handling and recovery
    retryLastOperation,
    clearError,
    handleGracefulDegradation,

    // Selection management
    updateSelection,
    validateTextSelection,

    // Modify mode specific
    showModificationTypeSelector,
    showModificationPreview,
    showCustomPromptInput,
    currentModificationType,
    modificationPreviewContent,
    originalTextForModification,
    customPrompt,

    // Modify mode actions
    startModifyMode,
    selectModificationType,
    submitCustomPrompt,
    backToModificationTypes,
    acceptModification,
    rejectModification,
    regenerateModification,

    // Utility methods
    canActivateMode,
    isProcessing,

    // Performance optimization features
    optimisticUpdate,
    performanceMetrics,
    clearCache,
    getOptimizedContent,
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      aiPerformanceOptimizer.cancelPendingRequests();
    };
  }, []);
}
