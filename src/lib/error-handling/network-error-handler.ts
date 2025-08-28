/**
 * Network Error Handler
 * Handles network-specific errors with intelligent retry logic and network status monitoring
 */

import { AIError, AIErrorType } from "../ai-error-handler";
import { ErrorContext } from "../ai-error-handler";

// Network status interface for connection monitoring
export interface NetworkStatus {
  isOnline: boolean;
  connectionType?: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export class NetworkErrorHandler {
  private static readonly DEFAULT_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff
  private static readonly MAX_RETRY_DELAY = 10000; // Maximum delay between retries
  private static readonly NETWORK_CHECK_TIMEOUT = 5000; // Network connectivity check timeout

  /**
   * Check network connectivity
   */
  static async checkNetworkConnectivity(): Promise<NetworkStatus> {
    const status: NetworkStatus = {
      isOnline: navigator.onLine
    };

    // Get connection information if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      status.connectionType = connection?.type;
      status.effectiveType = connection?.effectiveType;
      status.downlink = connection?.downlink;
      status.rtt = connection?.rtt;
    }

    // Perform actual connectivity test
    if (status.isOnline) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.NETWORK_CHECK_TIMEOUT);
        
        const response = await fetch('/api/health', {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        });
        
        clearTimeout(timeoutId);
        status.isOnline = response.ok;
      } catch (error) {
        status.isOnline = false;
      }
    }

    return status;
  }

  /**
   * Handle network-specific errors with intelligent retry
   */
  static async handleNetworkError<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries: number = this.DEFAULT_RETRY_ATTEMPTS
  ): Promise<T> {
    let lastError: unknown;
    let networkStatus = await this.checkNetworkConnectivity();

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check network status before retry
        if (attempt > 0) {
          networkStatus = await this.checkNetworkConnectivity();
          if (!networkStatus.isOnline) {
            throw new AIError(
              'No internet connection available',
              AIErrorType.NETWORK_ERROR,
              'NO_CONNECTION',
              true
            );
          }
        }

        return await operation();
      } catch (error) {
        lastError = error;
        const aiError = NetworkErrorHandler.normalizeNetworkError(error);

        // Don't retry if error is not retryable or max attempts reached
        if (!aiError.retryable || attempt === maxRetries) {
          throw aiError;
        }

        // Calculate delay with jitter for network errors
        const baseDelay = this.RETRY_DELAYS[attempt] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
        const jitter = Math.random() * 1000; // Add randomness to prevent thundering herd
        const delay = Math.min(baseDelay + jitter, this.MAX_RETRY_DELAY);

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));

        console.info(`Retrying network operation (attempt ${attempt + 1}/${maxRetries}) in ${context.operation}`, {
          delay,
          networkStatus,
          error: aiError.message
        });
      }
    }

    throw NetworkErrorHandler.normalizeNetworkError(lastError);
  }

  /**
   * Normalize network errors into AIError
   */
  static normalizeNetworkError(error: unknown): AIError {
    if (error instanceof AIError) {
      return error;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Network errors
      if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
        return new AIError(
          'Network connection failed. Please check your internet connection.',
          AIErrorType.NETWORK_ERROR,
          'NETWORK_FAILED',
          true,
          error
        );
      }

      // Timeout errors
      if (message.includes('timeout') || message.includes('aborted')) {
        return new AIError(
          'Request timed out. Please try again.',
          AIErrorType.TIMEOUT_ERROR,
          'REQUEST_TIMEOUT',
          true,
          error
        );
      }
    }

    // Unknown errors
    return new AIError(
      'A network error occurred. Please try again.',
      AIErrorType.NETWORK_ERROR,
      'NETWORK_ERROR',
      true,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}