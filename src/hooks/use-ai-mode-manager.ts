import { useState, useCallback, useRef } from 'react';
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
  AIErrorHandler
} from '@/lib/ai-infrastructure';

// Configuration for AI mode manager
interface AIModeManagerConfig {
  maxRetries?: number;
  timeout?: number;
  debounceMs?: number;
}

// AI Mode Manager hook interface
export interface UseAIModeManager {
  // State
  currentMode: AIMode;
  processingState: AIProcessingState;
  hasSelectedText: boolean;
  
  // Mode management
  setMode: (mode: AIMode) => void;
  resetMode: () => void;
  
  // AI operations
  processPrompt: (prompt: string, cursorPosition: number) => Promise<AIResponse>;
  processContinue: (cursorPosition: number, selectedText?: string) => Promise<AIResponse>;
  processModify: (selectedText: string, modificationType: ModificationType) => Promise<AIResponse>;
  
  // Selection management
  updateSelection: (selection: TextSelection | null) => void;
  
  // Utility methods
  canActivateMode: (mode: AIMode) => boolean;
  isProcessing: boolean;
}

// Default configuration
const DEFAULT_CONFIG: Required<AIModeManagerConfig> = {
  maxRetries: 3,
  timeout: 30000,
  debounceMs: 300
};

/**
 * AI Mode Manager Hook
 * Manages AI mode state, transitions, and processing for the Builder tool
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
    currentMode: AIMode.NONE
  });
  const [selectedText, setSelectedText] = useState<TextSelection | null>(null);
  
  // Refs for managing async operations
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Computed properties
  const hasSelectedText = selectedText !== null && selectedText.text.trim().length > 0;
  const isProcessing = processingState.isProcessing;
  
  /**
   * Validates if a mode can be activated based on current state
   */
  const canActivateMode = useCallback((mode: AIMode): boolean => {
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
  }, [isProcessing, hasSelectedText, documentContent]);
  
  /**
   * Sets the current AI mode with validation
   */
  const setMode = useCallback((mode: AIMode) => {
    if (!canActivateMode(mode)) {
      console.warn(`Cannot activate mode ${mode}. Current state does not allow it.`);
      return;
    }
    
    // Cancel any ongoing operations when switching modes
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setCurrentMode(mode);
    setProcessingState(prev => ({
      ...prev,
      currentMode: mode,
      isProcessing: false,
      progress: undefined,
      statusMessage: undefined
    }));
  }, [canActivateMode]);
  
  /**
   * Resets mode to NONE
   */
  const resetMode = useCallback(() => {
    setMode(AIMode.NONE);
  }, [setMode]);
  
  /**
   * Updates text selection state
   */
  const updateSelection = useCallback((selection: TextSelection | null) => {
    setSelectedText(selection);
    
    // If modify mode is active but no text is selected, reset to NONE
    if (currentMode === AIMode.MODIFY && (!selection || !selection.text.trim())) {
      resetMode();
    }
  }, [currentMode, resetMode]);
  
  /**
   * Generic AI request handler with error handling and retry logic
   */
  const handleAIRequest = useCallback(async <T extends AIResponse>(
    requestFn: () => Promise<T>,
    mode: AIMode,
    statusMessage: string
  ): Promise<T> => {
    // Validate request parameters
    try {
      AIErrorHandler.validateRequest(
        { conversationId, documentContent },
        ['conversationId', 'documentContent']
      );
    } catch (error) {
      throw error;
    }
    
    // Set up abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    // Update processing state
    setProcessingState({
      isProcessing: true,
      currentMode: mode,
      progress: 0,
      statusMessage
    });
    
    let lastError: Error | null = null;
    
    // Retry logic
    for (let attempt = 1; attempt <= mergedConfig.maxRetries; attempt++) {
      try {
        // Check if operation was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          throw new AIError(
            'Operation was cancelled',
            AIErrorType.OPERATION_CANCELLED,
            'CANCELLED'
          );
        }
        
        // Update progress
        setProcessingState(prev => ({
          ...prev,
          progress: (attempt - 1) / mergedConfig.maxRetries * 50
        }));
        
        // Execute the request
        const response = await Promise.race([
          requestFn(),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new AIError(
              'Request timeout',
              AIErrorType.TIMEOUT_ERROR,
              'TIMEOUT'
            )), mergedConfig.timeout);
          })
        ]);
        
        // Update progress to completion
        setProcessingState(prev => ({
          ...prev,
          progress: 100,
          statusMessage: 'Processing complete'
        }));
        
        // Reset processing state after a brief delay
        setTimeout(() => {
          setProcessingState({
            isProcessing: false,
            currentMode: mode,
            progress: undefined,
            statusMessage: undefined
          });
        }, 500);
        
        return response;
        
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry for certain error types
        if (error instanceof AIError) {
          if (error.type === AIErrorType.OPERATION_CANCELLED ||
              error.type === AIErrorType.VALIDATION_ERROR ||
              !error.retryable) {
            break;
          }
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < mergedConfig.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed, reset state and throw error
    setProcessingState({
      isProcessing: false,
      currentMode: mode,
      progress: undefined,
      statusMessage: undefined
    });
    
    throw lastError || new AIError(
      'Unknown error occurred',
      AIErrorType.UNKNOWN_ERROR,
      'UNKNOWN'
    );
  }, [conversationId, documentContent, mergedConfig]);
  
  /**
   * Processes a prompt request
   */
  const processPrompt = useCallback(async (
    prompt: string,
    cursorPosition: number
  ): Promise<AIResponse> => {
    if (!prompt.trim()) {
      throw new AIError(
        'Prompt cannot be empty',
        AIErrorType.VALIDATION_ERROR,
        'EMPTY_PROMPT'
      );
    }
    
    const request: AIPromptRequest = {
      prompt: prompt.trim(),
      documentContent,
      cursorPosition,
      conversationId,
      timestamp: Date.now()
    };
    
    return handleAIRequest(
      async () => {
        const response = await fetch('/api/builder/ai/prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: abortControllerRef.current?.signal
        });
        
        if (!response.ok) {
          throw new AIError(
            `HTTP ${response.status}: ${response.statusText}`,
            AIErrorType.API_ERROR,
            `HTTP_${response.status}`
          );
        }
        
        return await response.json() as AIResponse;
      },
      AIMode.PROMPT,
      'Generating content from prompt...'
    );
  }, [documentContent, conversationId, handleAIRequest]);
  
  /**
   * Processes a continue request
   */
  const processContinue = useCallback(async (
    cursorPosition: number,
    selectedText?: string
  ): Promise<AIResponse> => {
    const request: AIContinueRequest = {
      documentContent,
      cursorPosition,
      selectedText,
      conversationId,
      timestamp: Date.now()
    };
    
    return handleAIRequest(
      async () => {
        const response = await fetch('/api/builder/ai/continue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: abortControllerRef.current?.signal
        });
        
        if (!response.ok) {
          throw new AIError(
            `HTTP ${response.status}: ${response.statusText}`,
            AIErrorType.API_ERROR,
            `HTTP_${response.status}`
          );
        }
        
        return await response.json() as AIResponse;
      },
      AIMode.CONTINUE,
      'Continuing content generation...'
    );
  }, [documentContent, conversationId, handleAIRequest]);
  
  /**
   * Processes a modify request
   */
  const processModify = useCallback(async (
    selectedText: string,
    modificationType: ModificationType
  ): Promise<AIResponse> => {
    if (!selectedText.trim()) {
      throw new AIError(
        'Selected text cannot be empty',
        AIErrorType.VALIDATION_ERROR,
        'EMPTY_SELECTION'
      );
    }
    
    const request: AIModifyRequest = {
      selectedText: selectedText.trim(),
      modificationType,
      documentContent,
      conversationId,
      timestamp: Date.now()
    };
    
    return handleAIRequest(
      async () => {
        const response = await fetch('/api/builder/ai/modify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: abortControllerRef.current?.signal
        });
        
        if (!response.ok) {
          throw new AIError(
            `HTTP ${response.status}: ${response.statusText}`,
            AIErrorType.API_ERROR,
            `HTTP_${response.status}`
          );
        }
        
        return await response.json() as AIResponse;
      },
      AIMode.MODIFY,
      `Modifying content (${modificationType})...`
    );
  }, [documentContent, conversationId, handleAIRequest]);
  
  return {
    // State
    currentMode,
    processingState,
    hasSelectedText,
    
    // Mode management
    setMode,
    resetMode,
    
    // AI operations
    processPrompt,
    processContinue,
    processModify,
    
    // Selection management
    updateSelection,
    
    // Utility methods
    canActivateMode,
    isProcessing
  };
}