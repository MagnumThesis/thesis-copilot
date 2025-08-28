/**
 * AI Mode Configuration
 * Configuration interfaces and default values for AI mode manager
 */

import { AIMode } from "../ai-types";

/**
 * Configuration for AI mode manager
 */
export interface AIModeManagerConfig {
  maxRetries?: number;
  timeout?: number;
  debounceMs?: number;
  enableGracefulDegradation?: boolean;
  showErrorNotifications?: boolean;
  enableCaching?: boolean;
  enableOptimisticUpdates?: boolean;
  enableContextOptimization?: boolean;
}

/**
 * Default configuration for AI mode manager
 */
export const DEFAULT_CONFIG: Required<AIModeManagerConfig> = {
  maxRetries: 3,
  timeout: 30000,
  debounceMs: 300,
  enableGracefulDegradation: true,
  showErrorNotifications: true,
  enableCaching: true,
  enableOptimisticUpdates: true,
  enableContextOptimization: true,
};