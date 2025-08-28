/**
 * Performance Configuration
 * Configuration interfaces and default values for performance optimization
 */

/**
 * Cache configuration
 */
export interface CacheConfig {
  maxSize: number;
  ttlMs: number; // Time to live in milliseconds
  maxAccessCount: number; // Maximum access count before eviction
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 100,
  ttlMs: 30 * 60 * 1000, // 30 minutes
  maxAccessCount: 10
};

/**
 * Debounce configuration
 */
export interface DebounceConfig {
  delayMs: number;
  maxWaitMs: number; // Maximum time to wait before forcing execution
}

/**
 * Default debounce configuration
 */
export const DEFAULT_DEBOUNCE_CONFIG: DebounceConfig = {
  delayMs: 300,
  maxWaitMs: 2000
};