/**
 * AI Searcher Comprehensive Error Handling System
 * 
 * This module provides comprehensive error handling, graceful degradation,
 * fallback mechanisms, and monitoring for the AI-powered reference searcher.
 */

export enum AISearcherErrorType {
  SEARCH_SERVICE_ERROR = 'search_service_error',
  CONTENT_EXTRACTION_ERROR = 'content_extraction_error',
  QUERY_GENERATION_ERROR = 'query_generation_error',
  NETWORK_ERROR = 'network_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  PARSING_ERROR = 'parsing_error',
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  SERVICE_UNAVAILABLE_ERROR = 'service_unavailable_error',
  TIMEOUT_ERROR = 'timeout_error',
  QUOTA_EXCEEDED_ERROR = 'quota_exceeded_error',
  DATABASE_ERROR = 'database_error',
  CACHE_ERROR = 'cache_error',
  UNKNOWN_ERROR = 'unknown_error'
}

export enum AISearcherErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AISearcherError {
  type: AISearcherErrorType;
  severity: AISearcherErrorSeverity;
  message: string;
  userMessage: string;
  technicalMessage: string;
  code?: string;
  details?: any;
  timestamp: Date;
  operation: string;
  conversationId?: string;
  sessionId?: string;
  retryable: boolean;
  retryAfter?: number;
  recoveryActions: RecoveryAction[];
  fallbackAvailable: boolean;
  context?: {
    query?: string;
    contentSources?: string[];
    searchFilters?: any;
    userAgent?: string;
    requestId?: string;
  };
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'cache' | 'manual' | 'alternative_service' | 'degraded_mode';
  label: string;
  description: string;
  priority: number;
  action: () => Promise<any> | any;
  estimatedTime?: number;
  successRate?: number;
}

export interface FallbackConfig {
  enabled: boolean;
  services: FallbackService[];
  maxAttempts: number;
  timeout: number;
  degradedModeEnabled: boolean;
}

export interface FallbackService {
  name: string;
  type: 'search' | 'extraction' | 'query_generation';
  endpoint?: string;
  priority: number;
  enabled: boolean;
  healthCheck: () => Promise<boolean>;
  execute: (params: any) => Promise<any>;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
  retryableErrors: AISearcherErrorType[];
  exponentialBackoff: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  metricsCollection: boolean;
  errorReporting: boolean;
  performanceTracking: boolean;
  userFeedbackCollection: boolean;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<AISearcherErrorType, number>;
  errorsBySeverity: Record<AISearcherErrorSeverity, number>;
  retrySuccessRate: number;
  fallbackSuccessRate: number;
  averageRecoveryTime: number;
  userSatisfactionScore?: number;
  mostCommonErrors: Array<{
    type: AISearcherErrorType;
    count: number;
    percentage: number;
  }>;
}

/**
 * Default retry configurations for different operations
 */
export const SEARCH_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 2000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitterEnabled: true,
  exponentialBackoff: true,
  retryableErrors: [
    AISearcherErrorType.NETWORK_ERROR,
    AISearcherErrorType.TIMEOUT_ERROR,
    AISearcherErrorType.RATE_LIMIT_ERROR,
    AISearcherErrorType.SERVICE_UNAVAILABLE_ERROR
  ]
};

export const CONTENT_EXTRACTION_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitterEnabled: true,
  exponentialBackoff: true,
  retryableErrors: [
    AISearcherErrorType.CONTENT_EXTRACTION_ERROR,
    AISearcherErrorType.NETWORK_ERROR,
    AISearcherErrorType.TIMEOUT_ERROR,
    AISearcherErrorType.DATABASE_ERROR
  ]
};

export const QUERY_GENERATION_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2,
  baseDelay: 500,
  maxDelay: 5000,
  backoffMultiplier: 2,
  jitterEnabled: false,
  exponentialBackoff: true,
  retryableErrors: [
    AISearcherErrorType.QUERY_GENERATION_ERROR,
    AISearcherErrorType.NETWORK_ERROR
  ]
};

/**
 * Default fallback configuration
 */
export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  enabled: true,
  maxAttempts: 2,
  timeout: 15000,
  degradedModeEnabled: true,
  services: [
    {
      name: 'semantic_scholar',
      type: 'search',
      priority: 1,
      enabled: true,
      healthCheck: async () => true, // Placeholder
      execute: async (params) => [] // Placeholder
    },
    {
      name: 'crossref',
      type: 'search',
      priority: 2,
      enabled: true,
      healthCheck: async () => true, // Placeholder
      execute: async (params) => [] // Placeholder
    }
  ]
};

/**
 * Default monitoring configuration
 */
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: true,
  logLevel: 'info',
  metricsCollection: true,
  errorReporting: true,
  performanceTracking: true,
  userFeedbackCollection: true
};

/**
 * User-friendly error messages for different error types
 */
export const USER_ERROR_MESSAGES: Record<AISearcherErrorType, string> = {
  [AISearcherErrorType.SEARCH_SERVICE_ERROR]: 'Unable to search for academic papers right now. Please try again in a few moments.',
  [AISearcherErrorType.CONTENT_EXTRACTION_ERROR]: 'Unable to analyze your content. Please check your content and try again.',
  [AISearcherErrorType.QUERY_GENERATION_ERROR]: 'Unable to generate search terms from your content. You can try entering search terms manually.',
  [AISearcherErrorType.NETWORK_ERROR]: 'Network connection issue. Please check your internet connection and try again.',
  [AISearcherErrorType.RATE_LIMIT_ERROR]: 'Too many searches performed recently. Please wait a moment before trying again.',
  [AISearcherErrorType.PARSING_ERROR]: 'Unable to process search results. The search service may be experiencing issues.',
  [AISearcherErrorType.VALIDATION_ERROR]: 'Invalid search parameters. Please check your input and try again.',
  [AISearcherErrorType.AUTHENTICATION_ERROR]: 'Authentication failed. Please refresh the page and try again.',
  [AISearcherErrorType.SERVICE_UNAVAILABLE_ERROR]: 'Search service is temporarily unavailable. Please try again later.',
  [AISearcherErrorType.TIMEOUT_ERROR]: 'Search request timed out. Please try again with a simpler query.',
  [AISearcherErrorType.QUOTA_EXCEEDED_ERROR]: 'Daily search limit reached. Please try again tomorrow.',
  [AISearcherErrorType.DATABASE_ERROR]: 'Unable to save search results. Please try again.',
  [AISearcherErrorType.CACHE_ERROR]: 'Cache error occurred. This won\'t affect your search results.',
  [AISearcherErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
};

/**
 * Technical error messages for logging and debugging
 */
export const TECHNICAL_ERROR_MESSAGES: Record<AISearcherErrorType, string> = {
  [AISearcherErrorType.SEARCH_SERVICE_ERROR]: 'Google Scholar or alternative search service returned an error',
  [AISearcherErrorType.CONTENT_EXTRACTION_ERROR]: 'Failed to extract content from Ideas or Builder tools',
  [AISearcherErrorType.QUERY_GENERATION_ERROR]: 'Query generation engine failed to create search terms',
  [AISearcherErrorType.NETWORK_ERROR]: 'Network request failed or connection was lost',
  [AISearcherErrorType.RATE_LIMIT_ERROR]: 'API rate limit exceeded for search service',
  [AISearcherErrorType.PARSING_ERROR]: 'Failed to parse search results from service response',
  [AISearcherErrorType.VALIDATION_ERROR]: 'Input validation failed for search parameters',
  [AISearcherErrorType.AUTHENTICATION_ERROR]: 'Authentication or authorization failed',
  [AISearcherErrorType.SERVICE_UNAVAILABLE_ERROR]: 'External search service is unavailable',
  [AISearcherErrorType.TIMEOUT_ERROR]: 'Request exceeded timeout threshold',
  [AISearcherErrorType.QUOTA_EXCEEDED_ERROR]: 'API quota or usage limit exceeded',
  [AISearcherErrorType.DATABASE_ERROR]: 'Database operation failed',
  [AISearcherErrorType.CACHE_ERROR]: 'Cache operation failed',
  [AISearcherErrorType.UNKNOWN_ERROR]: 'Unclassified error occurred'
};

/**
 * Comprehensive AI Searcher Error Handler
 */
export class AISearcherErrorHandler {
  private static instance: AISearcherErrorHandler;
  private retryConfigs: Map<string, RetryConfig> = new Map();
  private fallbackConfig: FallbackConfig;
  private monitoringConfig: MonitoringConfig;
  private errorMetrics: ErrorMetrics;
  private activeRetries: Map<string, number> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  private constructor(
    fallbackConfig: FallbackConfig = DEFAULT_FALLBACK_CONFIG,
    monitoringConfig: MonitoringConfig = DEFAULT_MONITORING_CONFIG
  ) {
    this.fallbackConfig = fallbackConfig;
    this.monitoringConfig = monitoringConfig;
    this.errorMetrics = this.initializeMetrics();
    
    // Set up default retry configurations
    this.retryConfigs.set('search', SEARCH_RETRY_CONFIG);
    this.retryConfigs.set('content_extraction', CONTENT_EXTRACTION_RETRY_CONFIG);
    this.retryConfigs.set('query_generation', QUERY_GENERATION_RETRY_CONFIG);
    
    // Initialize circuit breakers for external services
    this.initializeCircuitBreakers();
  }

  public static getInstance(
    fallbackConfig?: FallbackConfig,
    monitoringConfig?: MonitoringConfig
  ): AISearcherErrorHandler {
    if (!AISearcherErrorHandler.instance) {
      AISearcherErrorHandler.instance = new AISearcherErrorHandler(
        fallbackConfig,
        monitoringConfig
      );
    }
    return AISearcherErrorHandler.instance;
  }

  /**
   * Handle and classify errors with comprehensive recovery options
   */
  public async handleError(
    error: unknown,
    operation: string,
    context?: {
      conversationId?: string;
      sessionId?: string;
      query?: string;
      contentSources?: string[];
      searchFilters?: any;
      requestId?: string;
    }
  ): Promise<AISearcherError> {
    const classifiedError = this.classifyError(error, operation, context);
    
    // Record error metrics
    this.recordErrorMetrics(classifiedError);
    
    // Log error based on monitoring configuration
    this.logError(classifiedError);
    
    // Generate recovery actions
    classifiedError.recoveryActions = await this.generateRecoveryActions(classifiedError);
    
    // Check if fallback is available
    classifiedError.fallbackAvailable = this.isFallbackAvailable(classifiedError);
    
    // Report error if monitoring is enabled
    if (this.monitoringConfig.errorReporting) {
      await this.reportError(classifiedError);
    }
    
    return classifiedError;
  }

  /**
   * Classify error type and severity based on error characteristics
   */
  public classifyError(
    error: unknown,
    operation: string,
    context?: any
  ): AISearcherError {
    let errorType = AISearcherErrorType.UNKNOWN_ERROR;
    let severity = AISearcherErrorSeverity.MEDIUM;
    let message = 'Unknown error occurred';
    let retryable = false;
    let retryAfter: number | undefined;

    if (error instanceof Error) {
      const errorMessage = error.message ? error.message.toLowerCase() : '';
      
      // Classify based on error message patterns
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        errorType = AISearcherErrorType.RATE_LIMIT_ERROR;
        severity = AISearcherErrorSeverity.MEDIUM;
        retryable = true;
        retryAfter = this.extractRetryAfter(error.message);
      } else if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
        errorType = AISearcherErrorType.TIMEOUT_ERROR;
        severity = AISearcherErrorSeverity.MEDIUM;
        retryable = true;
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorType = AISearcherErrorType.NETWORK_ERROR;
        severity = AISearcherErrorSeverity.HIGH;
        retryable = true;
      } else if (errorMessage.includes('blocked') || errorMessage.includes('403')) {
        errorType = AISearcherErrorType.AUTHENTICATION_ERROR;
        severity = AISearcherErrorSeverity.HIGH;
        retryable = false;
      } else if (errorMessage.includes('service unavailable') || errorMessage.includes('503')) {
        errorType = AISearcherErrorType.SERVICE_UNAVAILABLE_ERROR;
        severity = AISearcherErrorSeverity.HIGH;
        retryable = true;
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit exceeded')) {
        errorType = AISearcherErrorType.QUOTA_EXCEEDED_ERROR;
        severity = AISearcherErrorSeverity.CRITICAL;
        retryable = false;
      } else if (errorMessage.includes('parse') || errorMessage.includes('invalid response')) {
        errorType = AISearcherErrorType.PARSING_ERROR;
        severity = AISearcherErrorSeverity.MEDIUM;
        retryable = true;
      } else if (operation.includes('content') || operation.includes('extract')) {
        errorType = AISearcherErrorType.CONTENT_EXTRACTION_ERROR;
        severity = AISearcherErrorSeverity.MEDIUM;
        retryable = true;
      } else if (operation.includes('query') || operation.includes('generate')) {
        errorType = AISearcherErrorType.QUERY_GENERATION_ERROR;
        severity = AISearcherErrorSeverity.LOW;
        retryable = true;
      } else if (errorMessage.includes('database') || errorMessage.includes('supabase')) {
        errorType = AISearcherErrorType.DATABASE_ERROR;
        severity = AISearcherErrorSeverity.HIGH;
        retryable = true;
      } else if (errorMessage.includes('cache')) {
        errorType = AISearcherErrorType.CACHE_ERROR;
        severity = AISearcherErrorSeverity.LOW;
        retryable = false;
      } else if (operation.includes('search')) {
        errorType = AISearcherErrorType.SEARCH_SERVICE_ERROR;
        severity = AISearcherErrorSeverity.HIGH;
        retryable = true;
      }
      
      message = error.message || '';
      
      // If message is empty, classify as unknown error
      if (!message.trim()) {
        errorType = AISearcherErrorType.UNKNOWN_ERROR;
        severity = AISearcherErrorSeverity.MEDIUM;
        retryable = false;
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    return {
      type: errorType,
      severity,
      message,
      userMessage: USER_ERROR_MESSAGES[errorType],
      technicalMessage: TECHNICAL_ERROR_MESSAGES[errorType],
      timestamp: new Date(),
      operation,
      conversationId: context?.conversationId,
      sessionId: context?.sessionId,
      retryable,
      retryAfter,
      recoveryActions: [], // Will be populated by generateRecoveryActions
      fallbackAvailable: false, // Will be set by handleError
      context
    };
  }

  /**
   * Execute retry logic with exponential backoff and jitter
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationType: string,
    context?: any
  ): Promise<T> {
    const retryConfig = this.retryConfigs.get(operationType) || SEARCH_RETRY_CONFIG;
    const operationKey = `${operationType}_${context?.conversationId || 'default'}`;
    
    let lastError: AISearcherError | null = null;
    let attempt = 0;

    while (attempt < retryConfig.maxAttempts) {
      try {
        // Check circuit breaker before attempting
        if (this.isCircuitBreakerOpen(operationType)) {
          throw new Error(`Circuit breaker is open for ${operationType}`);
        }

        const result = await operation();
        
        // Reset retry counter on success
        this.activeRetries.delete(operationKey);
        
        // Record successful operation for circuit breaker
        this.recordCircuitBreakerSuccess(operationType);
        
        return result;
        
      } catch (error) {
        attempt++;
        lastError = await this.handleError(error, operationType, context);
        
        // Record failure for circuit breaker
        this.recordCircuitBreakerFailure(operationType);
        
        // Check if error is retryable
        if (!lastError.retryable || !retryConfig.retryableErrors.includes(lastError.type)) {
          break;
        }
        
        // Don't retry if we've reached max attempts
        if (attempt >= retryConfig.maxAttempts) {
          break;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateRetryDelay(attempt, retryConfig);
        
        this.log('info', `Retrying ${operationType} in ${delay}ms (attempt ${attempt}/${retryConfig.maxAttempts})`);
        
        // Wait before retrying
        await this.delay(delay);
        
        // Update active retry counter
        this.activeRetries.set(operationKey, attempt);
      }
    }

    // If we get here, all retries failed
    if (lastError) {
      // Try fallback if available
      if (this.fallbackConfig.enabled && this.isFallbackAvailable(lastError)) {
        try {
          return await this.executeFallback<T>(lastError, context);
        } catch (fallbackError) {
          this.log('error', 'Fallback also failed', fallbackError);
        }
      }
      
      throw new Error(lastError.userMessage);
    }
    
    throw new Error('Operation failed after all retries');
  }

  /**
   * Execute fallback mechanisms when primary operations fail
   */
  private async executeFallback<T>(error: AISearcherError, context?: any): Promise<T> {
    const relevantServices = this.fallbackConfig.services.filter(
      service => this.isServiceRelevant(service, error.type)
    );

    for (const service of relevantServices) {
      if (!service.enabled) continue;
      
      try {
        // Check service health before using
        const isHealthy = await Promise.race([
          service.healthCheck(),
          this.timeoutPromise(5000, false)
        ]);
        
        if (!isHealthy) {
          this.log('warn', `Fallback service ${service.name} failed health check`);
          continue;
        }
        
        this.log('info', `Attempting fallback with service: ${service.name}`);
        
        const result = await Promise.race([
          service.execute(context),
          this.timeoutPromise(this.fallbackConfig.timeout, null)
        ]);
        
        if (result !== null) {
          this.log('info', `Fallback service ${service.name} succeeded`);
          return result;
        }
        
      } catch (fallbackError) {
        this.log('warn', `Fallback service ${service.name} failed`, fallbackError);
        continue;
      }
    }
    
    // If all fallbacks failed, try degraded mode
    if (this.fallbackConfig.degradedModeEnabled) {
      return this.executeDegradedMode<T>(error, context);
    }
    
    throw new Error('All fallback mechanisms failed');
  }

  /**
   * Execute degraded mode operations when all else fails
   */
  private async executeDegradedMode<T>(error: AISearcherError, context?: any): Promise<T> {
    this.log('info', 'Executing degraded mode operation');
    
    // Return minimal/cached results based on operation type
    switch (error.type) {
      case AISearcherErrorType.SEARCH_SERVICE_ERROR:
      case AISearcherErrorType.SERVICE_UNAVAILABLE_ERROR:
      case AISearcherErrorType.RATE_LIMIT_ERROR:
      case AISearcherErrorType.NETWORK_ERROR:
        return this.getDegradedSearchResults(context) as T;
      case AISearcherErrorType.CONTENT_EXTRACTION_ERROR:
        return this.getDegradedContentExtraction(context) as T;
      case AISearcherErrorType.QUERY_GENERATION_ERROR:
        return this.getDegradedQueryGeneration(context) as T;
      default:
        // For unknown errors, try to provide a generic degraded response
        return this.getDegradedSearchResults(context) as T;
    }
  }

  /**
   * Generate recovery actions based on error type and context
   */
  private async generateRecoveryActions(error: AISearcherError): Promise<RecoveryAction[]> {
    const actions: RecoveryAction[] = [];

    // Add retry action if error is retryable
    if (error.retryable) {
      actions.push({
        type: 'retry',
        label: 'Try Again',
        description: 'Retry the operation',
        priority: 1,
        action: () => {
          // This will be handled by the calling code
          return Promise.resolve();
        },
        estimatedTime: 5,
        successRate: 0.7
      });
    }

    // Add fallback actions based on error type
    if (this.isFallbackAvailable(error)) {
      actions.push({
        type: 'fallback',
        label: 'Use Alternative Service',
        description: 'Try alternative search services',
        priority: 2,
        action: async () => {
          return this.executeFallback(error, error.context);
        },
        estimatedTime: 10,
        successRate: 0.5
      });
    }

    // Add manual actions
    switch (error.type) {
      case AISearcherErrorType.QUERY_GENERATION_ERROR:
        actions.push({
          type: 'manual',
          label: 'Enter Search Terms Manually',
          description: 'Provide your own search terms instead of auto-generation',
          priority: 3,
          action: () => {
            // This will be handled by the UI
            return Promise.resolve();
          },
          estimatedTime: 30,
          successRate: 0.9
        });
        break;
        
      case AISearcherErrorType.CONTENT_EXTRACTION_ERROR:
        actions.push({
          type: 'manual',
          label: 'Select Different Content',
          description: 'Try selecting different content sources',
          priority: 3,
          action: () => {
            return Promise.resolve();
          },
          estimatedTime: 60,
          successRate: 0.8
        });
        break;
    }

    // Add degraded mode if available
    if (this.fallbackConfig.degradedModeEnabled) {
      actions.push({
        type: 'degraded_mode',
        label: 'Continue with Limited Features',
        description: 'Use basic functionality while services recover',
        priority: 4,
        action: async () => {
          return this.executeDegradedMode(error, error.context);
        },
        estimatedTime: 2,
        successRate: 0.6
      });
    }

    return actions.sort((a, b) => a.priority - b.priority);
  }

  // Helper methods and utilities continue in the next part...
  
  private initializeMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorsByType: {} as Record<AISearcherErrorType, number>,
      errorsBySeverity: {} as Record<AISearcherErrorSeverity, number>,
      retrySuccessRate: 0,
      fallbackSuccessRate: 0,
      averageRecoveryTime: 0,
      mostCommonErrors: []
    };
  }

  private initializeCircuitBreakers(): void {
    const services = ['google_scholar', 'semantic_scholar', 'crossref'];
    services.forEach(service => {
      this.circuitBreakers.set(service, new CircuitBreaker({
        failureThreshold: 5,
        recoveryTimeout: 60000,
        monitoringPeriod: 300000
      }));
    });
  }

  private recordErrorMetrics(error: AISearcherError): void {
    this.errorMetrics.totalErrors++;
    this.errorMetrics.errorsByType[error.type] = (this.errorMetrics.errorsByType[error.type] || 0) + 1;
    this.errorMetrics.errorsBySeverity[error.severity] = (this.errorMetrics.errorsBySeverity[error.severity] || 0) + 1;
  }

  private logError(error: AISearcherError): void {
    if (!this.monitoringConfig.enabled) return;

    const logLevel = this.getLogLevel(error.severity);
    this.log(logLevel, `AI Searcher Error: ${error.type}`, {
      message: error.message,
      operation: error.operation,
      conversationId: error.conversationId,
      sessionId: error.sessionId,
      retryable: error.retryable,
      context: error.context
    });
  }

  private async reportError(error: AISearcherError): Promise<void> {
    // Implementation would send error to monitoring service
    // For now, just log it
    this.log('error', 'Error reported to monitoring service', error);
  }

  private isFallbackAvailable(error: AISearcherError): boolean {
    return this.fallbackConfig.enabled && 
           this.fallbackConfig.services.some(service => 
             this.isServiceRelevant(service, error.type) && service.enabled
           );
  }

  private isServiceRelevant(service: FallbackService, errorType: AISearcherErrorType): boolean {
    switch (errorType) {
      case AISearcherErrorType.SEARCH_SERVICE_ERROR:
      case AISearcherErrorType.RATE_LIMIT_ERROR:
      case AISearcherErrorType.SERVICE_UNAVAILABLE_ERROR:
        return service.type === 'search';
      case AISearcherErrorType.CONTENT_EXTRACTION_ERROR:
        return service.type === 'extraction';
      case AISearcherErrorType.QUERY_GENERATION_ERROR:
        return service.type === 'query_generation';
      default:
        return false;
    }
  }

  private extractRetryAfter(message: string): number | undefined {
    const match = message.match(/retry.*?(\d+)/i);
    return match ? parseInt(match[1]) * 1000 : undefined;
  }

  private calculateRetryDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, config.maxDelay);
    
    if (config.jitterEnabled) {
      delay += Math.random() * 1000;
    }
    
    return Math.floor(delay);
  }

  private async delay(ms: number): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async timeoutPromise<T>(ms: number, defaultValue: T): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(defaultValue), ms);
    });
  }

  private isCircuitBreakerOpen(service: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(service);
    return circuitBreaker ? circuitBreaker.isOpen() : false;
  }

  private recordCircuitBreakerSuccess(service: string): void {
    const circuitBreaker = this.circuitBreakers.get(service);
    if (circuitBreaker) {
      circuitBreaker.recordSuccess();
    }
  }

  private recordCircuitBreakerFailure(service: string): void {
    const circuitBreaker = this.circuitBreakers.get(service);
    if (circuitBreaker) {
      circuitBreaker.recordFailure();
    }
  }

  private getLogLevel(severity: AISearcherErrorSeverity): 'debug' | 'info' | 'warn' | 'error' {
    switch (severity) {
      case AISearcherErrorSeverity.LOW: return 'info';
      case AISearcherErrorSeverity.MEDIUM: return 'warn';
      case AISearcherErrorSeverity.HIGH: return 'error';
      case AISearcherErrorSeverity.CRITICAL: return 'error';
      default: return 'warn';
    }
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.monitoringConfig.enabled) return;
    
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'ai-searcher',
      data
    };

    console[level](`[AI-Searcher] ${message}`, data || '');
  }

  // Degraded mode implementations
  private getDegradedSearchResults(context: any): any {
    return {
      results: [{
        title: 'Search temporarily unavailable',
        authors: ['System Message'],
        journal: 'Thesis Copilot',
        confidence: 0.1,
        relevance_score: 0.1,
        abstract: 'Search services are temporarily unavailable. Please try again later or search manually.',
        url: context?.query ? `https://scholar.google.com/scholar?q=${encodeURIComponent(context.query)}` : undefined
      }],
      total_results: 1,
      degraded_mode: true,
      message: 'Search is running in degraded mode due to service issues'
    };
  }

  private getDegradedContentExtraction(context: any): any {
    return {
      content: 'Content extraction temporarily unavailable',
      keywords: [],
      topics: [],
      confidence: 0.1,
      degraded_mode: true,
      message: 'Please enter search terms manually'
    };
  }

  private getDegradedQueryGeneration(context: any): any {
    return {
      queries: [{
        query: 'research paper',
        confidence: 0.1,
        keywords: ['research', 'paper'],
        topics: ['general']
      }],
      degraded_mode: true,
      message: 'Query generation unavailable, using generic terms'
    };
  }

  /**
   * Get current error metrics
   */
  public getErrorMetrics(): ErrorMetrics {
    return { ...this.errorMetrics };
  }

  /**
   * Reset error metrics
   */
  public resetErrorMetrics(): void {
    this.errorMetrics = this.initializeMetrics();
  }

  /**
   * Update configuration
   */
  public updateConfig(
    fallbackConfig?: Partial<FallbackConfig>,
    monitoringConfig?: Partial<MonitoringConfig>
  ): void {
    if (fallbackConfig) {
      this.fallbackConfig = { ...this.fallbackConfig, ...fallbackConfig };
    }
    if (monitoringConfig) {
      this.monitoringConfig = { ...this.monitoringConfig, ...monitoringConfig };
    }
  }
}

/**
 * Simple Circuit Breaker implementation
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(private config: {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
  }) {}

  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }
}

export default AISearcherErrorHandler;