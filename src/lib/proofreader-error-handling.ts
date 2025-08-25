/**
 * Proofreader Error Handling and Recovery Mechanisms
 * 
 * This module provides comprehensive error handling, retry logic, and recovery
 * mechanisms for the proofreader tool, including network errors, AI service
 * failures, and offline status tracking.
 */

export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  AI_SERVICE_ERROR = 'ai_service_error',
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  CONTENT_ERROR = 'content_error',
  DATABASE_ERROR = 'database_error',
  TIMEOUT_ERROR = 'timeout_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ProofreaderError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
  timestamp: Date;
  operation: string;
  conversationId?: string;
  retryable: boolean;
  recoveryActions?: RecoveryAction[];
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'cache' | 'offline' | 'manual';
  label: string;
  description: string;
  action: () => Promise<void> | void;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

export interface OfflineStatus {
  isOnline: boolean;
  lastOnline?: Date;
  queuedOperations: QueuedOperation[];
  syncInProgress: boolean;
}

export interface QueuedOperation {
  id: string;
  type: 'status_update' | 'analysis_request';
  data: any;
  timestamp: Date;
  retryCount: number;
}

/**
 * Default retry configuration for different operations
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorType.NETWORK_ERROR,
    ErrorType.TIMEOUT_ERROR,
    ErrorType.RATE_LIMIT_ERROR
  ]
};

export const AI_SERVICE_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2,
  baseDelay: 2000,
  maxDelay: 8000,
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorType.AI_SERVICE_ERROR,
    ErrorType.NETWORK_ERROR,
    ErrorType.TIMEOUT_ERROR,
    ErrorType.RATE_LIMIT_ERROR
  ]
};

/**
 * @class ProofreaderErrorHandler
 * @description Enhanced error classification and handling for the proofreader tool.
 */
export class ProofreaderErrorHandler {
  private static instance: ProofreaderErrorHandler;
  private offlineStatus: OfflineStatus = {
    isOnline: navigator.onLine,
    queuedOperations: [],
    syncInProgress: false
  };
  private errorHistory: ProofreaderError[] = [];
  private maxErrorHistory = 50;

  private constructor() {
    this.setupNetworkListeners();
  }

  public static getInstance(): ProofreaderErrorHandler {
    if (!ProofreaderErrorHandler.instance) {
      ProofreaderErrorHandler.instance = new ProofreaderErrorHandler();
    }
    return ProofreaderErrorHandler.instance;
  }

  /**
   * Classify and create a standardized error object
   */
  public classifyError(
    error: unknown,
    operation: string,
    conversationId?: string
  ): ProofreaderError {
    const timestamp = new Date();
    let proofreaderError: ProofreaderError;

    if (error instanceof Error) {
      proofreaderError = this.classifyKnownError(error, operation, timestamp, conversationId);
    } else if (typeof error === 'string') {
      proofreaderError = {
        type: ErrorType.UNKNOWN_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: error,
        userMessage: error,
        timestamp,
        operation,
        conversationId,
        retryable: false
      };
    } else {
      proofreaderError = {
        type: ErrorType.UNKNOWN_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: 'An unexpected error occurred',
        userMessage: 'An unexpected error occurred. Please try again.',
        timestamp,
        operation,
        conversationId,
        retryable: false
      };
    }

    // Add recovery actions based on error type
    proofreaderError.recoveryActions = this.generateRecoveryActions(proofreaderError);

    // Store in error history
    this.addToErrorHistory(proofreaderError);

    return proofreaderError;
  }

  /**
   * Classify known error types with detailed analysis
   */
  private classifyKnownError(
    error: Error,
    operation: string,
    timestamp: Date,
    conversationId?: string
  ): ProofreaderError {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch') || 
        message.includes('connection') || error.name === 'NetworkError') {
      return {
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        message: error.message,
        userMessage: 'Network connection failed. Please check your internet connection and try again.',
        timestamp,
        operation,
        conversationId,
        retryable: true
      };
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('aborted') || error.name === 'AbortError') {
      return {
        type: ErrorType.TIMEOUT_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: error.message,
        userMessage: 'The operation timed out. Please try again.',
        timestamp,
        operation,
        conversationId,
        retryable: true
      };
    }

    // Authentication errors
    if (message.includes('api key') || message.includes('authentication') || 
        message.includes('unauthorized') || message.includes('401')) {
      return {
        type: ErrorType.AUTHENTICATION_ERROR,
        severity: ErrorSeverity.CRITICAL,
        message: error.message,
        userMessage: 'Authentication failed. Please check your API configuration.',
        timestamp,
        operation,
        conversationId,
        retryable: false
      };
    }

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('quota') || 
        message.includes('429') || message.includes('too many requests')) {
      return {
        type: ErrorType.RATE_LIMIT_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: error.message,
        userMessage: 'Rate limit exceeded. Please wait a moment before trying again.',
        timestamp,
        operation,
        conversationId,
        retryable: true
      };
    }

    // AI service errors
    if (message.includes('ai') || message.includes('model') || 
        message.includes('generation') || message.includes('content filter')) {
      return {
        type: ErrorType.AI_SERVICE_ERROR,
        severity: ErrorSeverity.HIGH,
        message: error.message,
        userMessage: 'AI service is temporarily unavailable. Please try again later.',
        timestamp,
        operation,
        conversationId,
        retryable: true
      };
    }

    // Content validation errors
    if (message.includes('content') || message.includes('validation') || 
        message.includes('required') || message.includes('invalid')) {
      return {
        type: ErrorType.CONTENT_ERROR,
        severity: ErrorSeverity.LOW,
        message: error.message,
        userMessage: error.message, // Use original message for validation errors
        timestamp,
        operation,
        conversationId,
        retryable: false
      };
    }

    // Database errors
    if (message.includes('database') || message.includes('supabase') || 
        message.includes('sql') || message.includes('storage')) {
      return {
        type: ErrorType.DATABASE_ERROR,
        severity: ErrorSeverity.HIGH,
        message: error.message,
        userMessage: 'Database error occurred. Your changes may not be saved.',
        timestamp,
        operation,
        conversationId,
        retryable: true
      };
    }

    // Default unknown error
    return {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: error.message,
      userMessage: 'An unexpected error occurred. Please try again.',
      timestamp,
      operation,
      conversationId,
      retryable: false
    };
  }

  /**
   * Generate recovery actions based on error type
   */
  private generateRecoveryActions(error: ProofreaderError): RecoveryAction[] {
    const actions: RecoveryAction[] = [];

    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        actions.push({
          type: 'retry',
          label: 'Retry',
          description: 'Try the operation again',
          action: () => {} // Will be set by caller
        });
        actions.push({
          type: 'offline',
          label: 'Work Offline',
          description: 'Continue working offline and sync later',
          action: () => this.enableOfflineMode()
        });
        break;

      case ErrorType.AI_SERVICE_ERROR:
        actions.push({
          type: 'retry',
          label: 'Retry Analysis',
          description: 'Try the AI analysis again',
          action: () => {} // Will be set by caller
        });
        actions.push({
          type: 'fallback',
          label: 'Basic Analysis',
          description: 'Use basic analysis without AI',
          action: () => {} // Will be set by caller
        });
        break;

      case ErrorType.RATE_LIMIT_ERROR:
        actions.push({
          type: 'retry',
          label: 'Wait and Retry',
          description: 'Wait for rate limit to reset and try again',
          action: () => {} // Will be set by caller
        });
        break;

      case ErrorType.DATABASE_ERROR:
        actions.push({
          type: 'retry',
          label: 'Retry Save',
          description: 'Try saving again',
          action: () => {} // Will be set by caller
        });
        actions.push({
          type: 'cache',
          label: 'Save Locally',
          description: 'Save changes locally for now',
          action: () => {} // Will be set by caller
        });
        break;

      case ErrorType.CONTENT_ERROR:
        actions.push({
          type: 'manual',
          label: 'Fix Content',
          description: 'Review and fix the content issues',
          action: () => {} // Will be set by caller
        });
        break;
    }

    return actions;
  }

  /**
   * Execute retry logic with exponential backoff
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    conversationId?: string
  ): Promise<T> {
    let lastError: ProofreaderError | null = null;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const classifiedError = this.classifyError(error, operationName, conversationId);
        lastError = classifiedError;

        // Check if error is retryable
        if (!config.retryableErrors.includes(classifiedError.type)) {
          throw classifiedError;
        }

        // Don't retry on last attempt
        if (attempt === config.maxAttempts) {
          throw classifiedError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        console.warn(`Attempt ${attempt} failed for ${operationName}:`, classifiedError.message);
        console.warn(`Retrying in ${delay}ms...`);

        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Handle graceful degradation for analysis failures
   */
  public async handleAnalysisFailure(
    error: ProofreaderError,
    content: string,
    conversationId: string
  ): Promise<{
    success: boolean;
    concerns?: any[];
    fallbackUsed?: boolean;
    error?: string;
  }> {
    console.warn('Analysis failed, attempting graceful degradation:', error);

    // Try basic analysis without AI
    try {
      const basicConcerns = await this.performBasicAnalysis(content, conversationId);
      
      return {
        success: true,
        concerns: basicConcerns,
        fallbackUsed: true
      };
    } catch (fallbackError) {
      console.error('Fallback analysis also failed:', fallbackError);
      
      return {
        success: false,
        error: 'Both AI and fallback analysis failed. Please try again later.',
        fallbackUsed: true
      };
    }
  }

  /**
   * Basic analysis without AI for fallback scenarios
   */
  private async performBasicAnalysis(content: string, conversationId: string): Promise<any[]> {
    const concerns: any[] = [];
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Basic length checks
    if (content.length < 500) {
      concerns.push({
        id: crypto.randomUUID(),
        conversationId,
        category: 'completeness',
        severity: 'medium',
        title: 'Document appears to be very short',
        description: 'The document is quite brief and may need more detailed content.',
        suggestions: ['Consider expanding on key points', 'Add more detailed explanations'],
        status: 'to_be_done',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Basic sentence length check
    const longSentences = sentences.filter(s => s.split(/\s+/).length > 30);
    if (longSentences.length > 0) {
      concerns.push({
        id: crypto.randomUUID(),
        conversationId,
        category: 'clarity',
        severity: 'low',
        title: 'Some sentences may be too long',
        description: `Found ${longSentences.length} sentences with more than 30 words.`,
        suggestions: ['Consider breaking long sentences into shorter ones', 'Use punctuation to improve readability'],
        status: 'to_be_done',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Basic structure check
    const hasHeadings = /^#{1,6}\s+/.test(content);
    if (!hasHeadings && content.length > 1000) {
      concerns.push({
        id: crypto.randomUUID(),
        conversationId,
        category: 'structure',
        severity: 'medium',
        title: 'Document lacks clear structure',
        description: 'No headings found in the document.',
        suggestions: ['Add section headings to organize content', 'Use markdown formatting for better structure'],
        status: 'to_be_done',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return concerns;
  }

  /**
   * Offline status management
   */
  public getOfflineStatus(): OfflineStatus {
    return { ...this.offlineStatus };
  }

  public enableOfflineMode(): void {
    console.log('Enabling offline mode for proofreader');
    // Additional offline setup can be added here
  }

  public queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): void {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      retryCount: 0
    };

    this.offlineStatus.queuedOperations.push(queuedOp);
    this.saveQueuedOperations();
  }

  public async syncQueuedOperations(): Promise<void> {
    if (!this.offlineStatus.isOnline || this.offlineStatus.syncInProgress) {
      return;
    }

    this.offlineStatus.syncInProgress = true;
    const operations = [...this.offlineStatus.queuedOperations];

    for (const operation of operations) {
      try {
        await this.executeSyncOperation(operation);
        this.removeQueuedOperation(operation.id);
      } catch (error) {
        console.error('Failed to sync operation:', operation, error);
        operation.retryCount++;
        
        // Remove operations that have failed too many times
        if (operation.retryCount > 3) {
          this.removeQueuedOperation(operation.id);
        }
      }
    }

    this.offlineStatus.syncInProgress = false;
    this.saveQueuedOperations();
  }

  /**
   * Network status monitoring
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      this.offlineStatus.isOnline = true;
      this.syncQueuedOperations();
    });

    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      this.offlineStatus.isOnline = false;
      this.offlineStatus.lastOnline = new Date();
    });
  }

  /**
   * Error history management
   */
  private addToErrorHistory(error: ProofreaderError): void {
    this.errorHistory.unshift(error);
    
    // Keep only recent errors
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(0, this.maxErrorHistory);
    }
  }

  public getErrorHistory(): ProofreaderError[] {
    return [...this.errorHistory];
  }

  public getRecentErrors(minutes: number = 10): ProofreaderError[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.errorHistory.filter(error => error.timestamp > cutoff);
  }

  /**
   * Utility methods
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async executeSyncOperation(operation: QueuedOperation): Promise<void> {
    switch (operation.type) {
      case 'status_update':
        await this.syncStatusUpdate(operation.data);
        break;
      case 'analysis_request':
        // Analysis requests are typically not queued for sync
        break;
    }
  }

  private async syncStatusUpdate(data: any): Promise<void> {
    const response = await fetch(`/api/proofreader/concerns/${data.concernId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: data.status })
    });

    if (!response.ok) {
      throw new Error(`Failed to sync status update: ${response.statusText}`);
    }
  }

  private removeQueuedOperation(operationId: string): void {
    this.offlineStatus.queuedOperations = this.offlineStatus.queuedOperations
      .filter(op => op.id !== operationId);
  }

  private saveQueuedOperations(): void {
    try {
      localStorage.setItem('proofreader-queued-operations', 
        JSON.stringify(this.offlineStatus.queuedOperations));
    } catch (error) {
      console.error('Failed to save queued operations:', error);
    }
  }

  private loadQueuedOperations(): void {
    try {
      const saved = localStorage.getItem('proofreader-queued-operations');
      if (saved) {
        this.offlineStatus.queuedOperations = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load queued operations:', error);
      this.offlineStatus.queuedOperations = [];
    }
  }

  /**
   * Enhanced network error detection
   */
  public isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('connection') ||
        message.includes('timeout') ||
        error.name === 'NetworkError' ||
        error.name === 'TypeError' && message.includes('failed to fetch')
      );
    }
    return false;
  }

  /**
   * Enhanced AI service error detection
   */
  public isAIServiceError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('ai') ||
        message.includes('model') ||
        message.includes('generation') ||
        message.includes('content filter') ||
        message.includes('safety') ||
        message.includes('quota') ||
        message.includes('rate limit') ||
        message.includes('api key') ||
        message.includes('authentication')
      );
    }
    return false;
  }

  /**
   * Check if error is retryable based on type and context
   */
  public isRetryableError(error: ProofreaderError, retryCount: number = 0): boolean {
    // Don't retry if we've exceeded max attempts
    if (retryCount >= 3) return false;

    // Check if error type is retryable
    const retryableTypes = [
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.AI_SERVICE_ERROR,
      ErrorType.DATABASE_ERROR,
      ErrorType.RATE_LIMIT_ERROR
    ];

    return retryableTypes.includes(error.type);
  }

  /**
   * Get appropriate retry delay based on error type and attempt count
   */
  public getRetryDelay(error: ProofreaderError, retryCount: number): number {
    const baseDelays = {
      [ErrorType.NETWORK_ERROR]: 1000,
      [ErrorType.TIMEOUT_ERROR]: 2000,
      [ErrorType.AI_SERVICE_ERROR]: 3000,
      [ErrorType.DATABASE_ERROR]: 1500,
      [ErrorType.RATE_LIMIT_ERROR]: 5000,
      [ErrorType.VALIDATION_ERROR]: 1000,
      [ErrorType.AUTHENTICATION_ERROR]: 2000,
      [ErrorType.CONTENT_ERROR]: 1000,
      [ErrorType.UNKNOWN_ERROR]: 2000
    };

    const baseDelay = baseDelays[error.type] || 2000;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const maxDelay = error.type === ErrorType.RATE_LIMIT_ERROR ? 30000 : 10000;

    return Math.min(exponentialDelay, maxDelay);
  }

  /**
   * Create user-friendly error message with recovery suggestions
   */
  public createUserFriendlyMessage(error: ProofreaderError): string {
    const baseMessage = error.userMessage;
    const suggestions: string[] = [];

    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        suggestions.push('Check your internet connection');
        suggestions.push('Try again in a few moments');
        break;
      case ErrorType.AI_SERVICE_ERROR:
        suggestions.push('The AI service may be temporarily unavailable');
        suggestions.push('Try using basic analysis mode');
        break;
      case ErrorType.RATE_LIMIT_ERROR:
        suggestions.push('Wait a few minutes before trying again');
        suggestions.push('Consider analyzing smaller sections');
        break;
      case ErrorType.AUTHENTICATION_ERROR:
        suggestions.push('Check your API configuration');
        suggestions.push('Contact support if the issue persists');
        break;
      case ErrorType.CONTENT_ERROR:
        suggestions.push('Review your document content');
        suggestions.push('Ensure sufficient content for analysis');
        break;
    }

    if (suggestions.length > 0) {
      return `${baseMessage}\n\nSuggestions:\n• ${suggestions.join('\n• ')}`;
    }

    return baseMessage;
  }

  /**
   * Handle connection recovery after network issues
   */
  public async handleConnectionRecovery(): Promise<void> {
    if (!this.offlineStatus.isOnline) {
      console.log('Connection recovered, syncing queued operations...');
      await this.syncQueuedOperations();
    }
  }

  /**
   * Get error statistics for monitoring
   */
  public getErrorStatistics(timeWindow: number = 60): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsByOperation: Record<string, number>;
    recentErrorRate: number;
  } {
    const cutoff = new Date(Date.now() - timeWindow * 60 * 1000);
    const recentErrors = this.errorHistory.filter(error => error.timestamp > cutoff);

    const errorsByType = {} as Record<ErrorType, number>;
    const errorsByOperation = {} as Record<string, number>;

    Object.values(ErrorType).forEach(type => {
      errorsByType[type] = 0;
    });

    recentErrors.forEach(error => {
      errorsByType[error.type]++;
      errorsByOperation[error.operation] = (errorsByOperation[error.operation] || 0) + 1;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsByOperation,
      recentErrorRate: recentErrors.length / Math.max(timeWindow, 1)
    };
  }
}

// Export singleton instance
export const proofreaderErrorHandler = ProofreaderErrorHandler.getInstance();