import { useCallback, useRef } from "react";
import {
  AIMode,
  ModificationType,
  AIResponse,
  AIPromptRequest,
  AIContinueRequest,
  AIModifyRequest,
  AIError,
  AIErrorType,
  AIErrorHandler,
  ErrorContext,
} from "@/lib/ai-infrastructure";
import { 
  aiPerformanceOptimizer, 
  OptimisticUpdate
} from "@/lib/ai-performance-optimizer";
import { PerformanceMetrics } from "@/lib/performance/metrics-collector";

// AI Operations interface
export interface AIOperations {
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
    modificationType: ModificationType,
    customPromptText?: string
  ) => Promise<AIResponse>;
}

// AI Operations State interface
export interface AIOperationsState {
  optimisticUpdate: OptimisticUpdate | null;
  performanceMetrics: PerformanceMetrics;
  isProcessing: boolean;
  processingState: {
    isProcessing: boolean;
    currentMode: AIMode;
    progress?: number;
    statusMessage?: string;
  };
}

/**
 * AI Operations Hook
 * Manages AI operations including prompt, continue, and modify requests
 */
/**
 * @function useAIOperations
 * @description Manages AI operations including prompt, continue, and modify requests.
 * @param {string} conversationId - The ID of the current conversation.
 * @param {string} documentContent - The current content of the document.
 * @param {import("./use-ai-mode-state").AIModeState} modeState - The AI mode state.
 * @param {import("./use-ai-error-state").AIErrorState} errorState - The AI error state.
 * @param {import("../ai-mode/use-ai-mode-state").setMode} setMode - Function to set the AI mode.
 * @param {import("../ai-mode/use-ai-error-state").handleError} handleError - Function to handle errors.
 * @param {import("../ai-mode/use-ai-error-state").clearError} clearError - Function to clear errors.
 * @returns {AIOperations & AIOperationsState} An object containing AI operations and state.
 */
export function useAIOperations(
  conversationId: string,
  documentContent: string,
  modeState: any, // This will be replaced with proper type when we have the mode state hook
  errorState: any, // This will be replaced with proper type when we have the error state hook
  setMode: (mode: any) => void, // This will be replaced with proper type when we have the mode state hook
  handleError: (error: any, context: any) => void, // This will be replaced with proper type when we have the error state hook
  clearError: () => void
): AIOperations & AIOperationsState {
  // Refs for managing async operations
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastOperationRef = useRef<{
    type: 'prompt' | 'continue' | 'modify';
    params: any;
  } | null>(null);

  // State (these would be managed by other hooks in the real implementation)
  const optimisticUpdate = null; // This will be managed by state in the real implementation
  const performanceMetrics = aiPerformanceOptimizer.getMetrics(); // This will be managed by state in the real implementation
  const isProcessing = false; // This will be managed by state in the real implementation
  const processingState = {
    isProcessing: false,
    currentMode: AIMode.NONE,
    progress: undefined,
    statusMessage: undefined,
  }; // This will be managed by state in the real implementation

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
      // Note: In real implementation, this would update state
      console.log(`Processing state updated: ${statusMessage}`);

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
            // Note: In real implementation, this would update state
            console.log("Connecting to AI service...");

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
                  30000 // Default timeout
                );
              }),
            ]);

            // Update progress
            // Note: In real implementation, this would update state
            console.log("Processing response...");

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
          3 // Default max retries
        );

        // Update progress to completion
        // Note: In real implementation, this would update state
        console.log("Processing complete");

        return response;
      } catch (error) {
        // Handle error with recovery strategy
        handleError(error, errorContext);
        throw error;
      }
    },
    [conversationId, documentContent, clearError, handleError]
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

      // Use performance optimizer for the request
      return aiPerformanceOptimizer.optimizedRequest(
        AIMode.PROMPT,
        documentContent,
        operationParams,
        async () => {
          const request: AIPromptRequest = {
            prompt: prompt.trim(),
            documentContent: documentContent, // In real implementation, this would use getOptimizedContent
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

              // Update performance metrics
              // Note: In real implementation, this would update state
              console.log("Performance metrics updated");

              return result as AIResponse;
            },
            AIMode.PROMPT,
            "Generating content from prompt...",
            'prompt',
            operationParams
          );
        },
        {
          enableCaching: true, // In real implementation, this would use config
          enableDebouncing: true,
          enableOptimization: true, // In real implementation, this would use config
        }
      );
    },
    [documentContent, conversationId, handleAIRequest]
  );

  /**
   * Processes a continue request with comprehensive error handling and performance optimizations
   */
  /**
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

      // Use performance optimizer for the request
      return aiPerformanceOptimizer.optimizedRequest(
        AIMode.CONTINUE,
        documentContent,
        operationParams,
        async () => {
          const request: AIContinueRequest = {
            documentContent: documentContent, // In real implementation, this would use getOptimizedContent
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

              // Update performance metrics
              // Note: In real implementation, this would update state
              console.log("Performance metrics updated");

              return result as AIResponse;
            },
            AIMode.CONTINUE,
            "Continuing content generation...",
            'continue',
            operationParams
          );
        },
        {
          enableCaching: true, // In real implementation, this would use config
          enableDebouncing: true,
          enableOptimization: true, // In real implementation, this would use config
        }
      );
    },
    [documentContent, conversationId, handleAIRequest]
  );

  /**
   * Processes a modify request with comprehensive error handling and performance optimizations
   */
  /**
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

      // Use performance optimizer for the request
      return aiPerformanceOptimizer.optimizedRequest(
        AIMode.MODIFY,
        documentContent,
        operationParams,
        async () => {
          const request: AIModifyRequest = {
            selectedText: selectedText.trim(),
            modificationType,
            documentContent: documentContent, // In real implementation, this would use getOptimizedContent
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

              // Update performance metrics
              // Note: In real implementation, this would update state
              console.log("Performance metrics updated");

              return result as AIResponse;
            },
            AIMode.MODIFY,
            `Modifying content (${modificationType})...`,
            'modify',
            operationParams
          );
        },
        {
          enableCaching: true, // In real implementation, this would use config
          enableDebouncing: true,
          enableOptimization: true, // In real implementation, this would use config
        }
      );
    },
    [documentContent, conversationId, handleAIRequest]
  );

  return {
    // Operations
    processPrompt,
    processContinue,
    processModify,

    // State
    optimisticUpdate,
    performanceMetrics,
    isProcessing,
    processingState,
  };
}