/**
 * Metrics Collector
 * Handles collection and aggregation of performance metrics
 */

export interface PerformanceMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  totalRequests: number;
  cachedRequests: number;
  debouncedRequests: number;
  contextOptimizations: number;
}

export class MetricsCollector {
  private metrics: PerformanceMetrics = {
    cacheHitRate: 0,
    averageResponseTime: 0,
    totalRequests: 0,
    cachedRequests: 0,
    debouncedRequests: 0,
    contextOptimizations: 0
  };

  /**
   * Update cache hit rate metric
   */
  updateCacheHitRate(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.cacheHitRate = this.metrics.cachedRequests / this.metrics.totalRequests;
    }
  }

  /**
   * Update average response time metric
   */
  updateAverageResponseTime(responseTime: number): void {
    const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1);
    this.metrics.averageResponseTime = (totalTime + responseTime) / this.metrics.totalRequests;
  }

  /**
   * Increment total requests count
   */
  incrementTotalRequests(): void {
    this.metrics.totalRequests++;
  }

  /**
   * Increment cached requests count
   */
  incrementCachedRequests(): void {
    this.metrics.cachedRequests++;
    this.updateCacheHitRate();
  }

  /**
   * Increment debounced requests count
   */
  incrementDebouncedRequests(): void {
    this.metrics.debouncedRequests++;
  }

  /**
   * Increment context optimizations count
   */
  incrementContextOptimizations(): void {
    this.metrics.contextOptimizations++;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.metrics = {
      cacheHitRate: 0,
      averageResponseTime: 0,
      totalRequests: 0,
      cachedRequests: 0,
      debouncedRequests: 0,
      contextOptimizations: 0
    };
  }

  /**
   * Update metrics for a cache hit
   */
  recordCacheHit(): void {
    this.incrementCachedRequests();
    this.incrementTotalRequests();
  }

  /**
   * Update metrics for a cache miss
   */
  recordCacheMiss(): void {
    this.incrementTotalRequests();
  }

  /**
   * Update metrics for a debounced request
   */
  recordDebouncedRequest(): void {
    this.incrementDebouncedRequests();
  }

  /**
   * Update metrics for a context optimization
   */
  recordContextOptimization(): void {
    this.incrementContextOptimizations();
  }
}