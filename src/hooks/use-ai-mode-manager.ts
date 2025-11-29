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
  OptimisticUpdate
} from "@/lib/ai-performance-optimizer";
import { PerformanceMetrics } from "@/lib/performance/metrics-collector";

// Import the extracted hooks
import { useAIModeState, AIModeState } from "./ai-mode/use-ai-mode-state";
import { useAIErrorState, AIErrorState } from "./ai-mode/use-ai-error-state";
import { useAIModifyModeState, AIModifyModeState } from "./ai-mode/use-ai-modify-mode-state";
import { useAIOperations, AIOperations, AIOperationsState } from "./ai-mode/use-ai-operations";
import { useAISelectionManager, AISelectionManager } from "./ai-mode/use-ai-selection-manager";

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
 * This is the main hook that composes all the extracted hooks
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

  // Compose the extracted hooks
  const modeState: AIModeState = useAIModeState(conversationId, documentContent, config);
  const errorState: AIErrorState = useAIErrorState(
    modeState.currentMode,
    modeState,
    modeState.setMode
  );
  const aiOperations: AIOperations & AIOperationsState = useAIOperations(
    conversationId,
    documentContent,
    modeState,
    errorState,
    modeState.setMode,
    errorState.handleError,
    errorState.clearError
  );
  const modifyModeState: AIModifyModeState = useAIModifyModeState(
    modeState.currentMode,
    modeState.selectedText,
    modeState,
    errorState,
    modeState.setMode,
    modeState.resetMode,
    errorState.handleError,
    modeState.validateTextSelection,
    aiOperations.processModify
  );

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
    modeState.selectedText !== null && modeState.selectedText.text.trim().length > 0;
  const isProcessing = modeState.processingState.isProcessing;

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
   * Update performance metrics
   */
  /**
   * @function updatePerformanceMetrics
   * @description Update performance metrics.
   */
  const updatePerformanceMetrics = useCallback(() => {
    setPerformanceMetrics(aiPerformanceOptimizer.getMetrics());
  }, []);

  // Expose the composed interface
  return {
    // State
    currentMode: modeState.currentMode,
    processingState: modeState.processingState,
    hasSelectedText,
    selectedText: modeState.selectedText,
    errorState: errorState.errorState,

    // Mode management
    setMode: modeState.setMode,
    resetMode: modeState.resetMode,

    // AI operations
    processPrompt: aiOperations.processPrompt,
    processContinue: aiOperations.processContinue,
    processModify: aiOperations.processModify,

    // Error handling and recovery
    retryLastOperation: errorState.retryLastOperation,
    clearError: errorState.clearError,
    handleGracefulDegradation: errorState.handleGracefulDegradation,

    // Selection management - use modeState's selection management directly
    updateSelection: modeState.updateSelection,
    validateTextSelection: modeState.validateTextSelection,

    // Modify mode specific - use state from modifyModeState
    showModificationTypeSelector: modifyModeState.showModificationTypeSelector,
    showModificationPreview: modifyModeState.showModificationPreview,
    showCustomPromptInput: modifyModeState.showCustomPromptInput,
    currentModificationType: modifyModeState.currentModificationType,
    modificationPreviewContent: modifyModeState.modificationPreviewContent,
    originalTextForModification: modifyModeState.originalTextForModification,
    customPrompt: modifyModeState.customPrompt,

    // Modify mode actions
    startModifyMode: modifyModeState.startModifyMode,
    selectModificationType: modifyModeState.selectModificationType,
    submitCustomPrompt: modifyModeState.submitCustomPrompt,
    backToModificationTypes: modifyModeState.backToModificationTypes,
    acceptModification: modifyModeState.acceptModification,
    rejectModification: modifyModeState.rejectModification,
    regenerateModification: modifyModeState.regenerateModification,

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