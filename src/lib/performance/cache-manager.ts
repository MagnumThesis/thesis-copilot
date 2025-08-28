/**
 * Cache Manager
 * Handles caching operations for AI requests
 */

import { AIResponse } from "../ai-interfaces";
import { AIMode } from "../ai-types";
import { CacheConfig, DEFAULT_CACHE_CONFIG } from "../config/performance-config";
import { simpleHash } from "../utils/text-utils";

// Cache entry interface
interface CacheEntry {
  response: AIResponse;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

// Request fingerprint for caching
interface RequestFingerprint {
  mode: AIMode;
  contentHash: string;
  parametersHash: string;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private readonly cacheConfig: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  /**
   * Create a fingerprint for request caching
   */
  private createRequestFingerprint(
    mode: AIMode,
    content: string,
    parameters: Record<string, any>
  ): RequestFingerprint {
    // Create content hash (simple hash for performance)
    const contentHash = simpleHash(content);
    
    // Create parameters hash
    const parametersString = JSON.stringify(parameters, Object.keys(parameters).sort());
    const parametersHash = simpleHash(parametersString);

    return {
      mode,
      contentHash,
      parametersHash
    };
  }

  /**
   * Generate cache key from request fingerprint
   */
  private getCacheKey(fingerprint: RequestFingerprint): string {
    return `${fingerprint.mode}:${fingerprint.contentHash}:${fingerprint.parametersHash}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isCacheEntryValid(entry: CacheEntry): boolean {
    const now = Date.now();
    const isNotExpired = (now - entry.timestamp) < this.cacheConfig.ttlMs;
    const hasAccessesLeft = entry.accessCount < this.cacheConfig.maxAccessCount;
    
    return isNotExpired && hasAccessesLeft;
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheEntryValid(entry)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    // If cache is still too large, remove least recently used entries
    if (this.cache.size > this.cacheConfig.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      const entriesToRemove = entries.slice(0, entries.length - this.cacheConfig.maxSize);
      entriesToRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Get cached response if available
   */
  getCachedResponse(cacheKey: string): AIResponse | null {
    const entry = this.cache.get(cacheKey);
    
    if (!entry || !this.isCacheEntryValid(entry)) {
      if (entry) {
        this.cache.delete(cacheKey);
      }
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.response;
  }

  /**
   * Cache response
   */
  cacheResponse(cacheKey: string, response: AIResponse): void {
    // Only cache successful responses
    if (!response.success) {
      return;
    }

    const entry: CacheEntry = {
      response,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(cacheKey, entry);
    this.cleanCache();
  }

  /**
   * Create cache key for a request
   */
  createCacheKey(mode: AIMode, content: string, parameters: Record<string, any>): string {
    const fingerprint = this.createRequestFingerprint(mode, content, parameters);
    return this.getCacheKey(fingerprint);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(entry => entry.timestamp);
    
    return {
      size: this.cache.size,
      maxSize: this.cacheConfig.maxSize,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }

  /**
   * Get cache configuration
   */
  getCacheConfig(): CacheConfig {
    return { ...this.cacheConfig };
  }
}