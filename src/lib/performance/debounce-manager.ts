/**
 * Debounce Manager
 * Handles debouncing operations for AI requests
 */

import { AIResponse } from "../ai-interfaces";
import { DebounceConfig, DEFAULT_DEBOUNCE_CONFIG } from "../config/performance-config";

export class DebounceManager {
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private pendingRequests = new Map<string, Promise<AIResponse>>();
  private readonly debounceConfig: DebounceConfig;
  private debouncedRequestsCount: number = 0;

  constructor(config: Partial<DebounceConfig> = {}) {
    this.debounceConfig = { ...DEFAULT_DEBOUNCE_CONFIG, ...config };
  }

  /**
   * Debounced AI request execution
   */
  async debouncedRequest<T extends AIResponse>(
    requestKey: string,
    requestFn: () => Promise<T>,
    forceImmediate: boolean = false
  ): Promise<T> {
    // If force immediate, execute right away
    if (forceImmediate) {
      return this.executeRequest(requestKey, requestFn);
    }

    // Check if there's already a pending request
    const pendingRequest = this.pendingRequests.get(requestKey);
    if (pendingRequest) {
      return pendingRequest as Promise<T>;
    }

    // Clear existing timer for this request
    const existingTimer = this.debounceTimers.get(requestKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set up debounced execution
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(requestKey);
        this.debouncedRequestsCount++;

        try {
          const result = await this.executeRequest(requestKey, requestFn);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, this.debounceConfig.delayMs);

      this.debounceTimers.set(requestKey, timer);
    });
  }

  /**
   * Execute request
   */
  private async executeRequest<T extends AIResponse>(
    requestKey: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Execute request
    const requestPromise = requestFn();
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const response = await requestPromise;
      return response;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Cancel all pending debounced requests
   */
  cancelPendingRequests(): void {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get debounce statistics
   */
  getDebounceStats(): {
    pendingRequestsCount: number;
    debounceTimersCount: number;
    debouncedRequestsCount: number;
  } {
    return {
      pendingRequestsCount: this.pendingRequests.size,
      debounceTimersCount: this.debounceTimers.size,
      debouncedRequestsCount: this.debouncedRequestsCount
    };
  }

  /**
   * Get debounce configuration
   */
  getDebounceConfig(): DebounceConfig {
    return { ...this.debounceConfig };
  }
}