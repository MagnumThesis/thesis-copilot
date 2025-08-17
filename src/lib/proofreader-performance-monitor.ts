/**
 * Proofreader Performance Monitor
 * Monitors and tracks performance metrics for proofreader operations
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceBenchmark {
  operation: string;
  samples: number[];
  average: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

/**
 * Performance monitoring class for proofreader operations
 */
export class ProofreaderPerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private benchmarks: Map<string, number[]> = new Map();
  private isEnabled: boolean = true;

  /**
   * Start measuring a performance metric
   */
  public startMeasure(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }

  /**
   * End measuring a performance metric
   */
  public endMeasure(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric '${name}' was not started`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Add to benchmarks
    const operation = metric.metadata?.operation || name;
    if (!this.benchmarks.has(operation)) {
      this.benchmarks.set(operation, []);
    }
    this.benchmarks.get(operation)!.push(duration);

    // Keep only last 100 samples per operation
    const samples = this.benchmarks.get(operation)!;
    if (samples.length > 100) {
      samples.shift();
    }

    this.metrics.delete(name);
    return duration;
  }

  /**
   * Measure a function execution time
   */
  public async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<{ result: T; duration: number }> {
    if (!this.isEnabled) {
      const result = await fn();
      return { result, duration: 0 };
    }

    this.startMeasure(name, metadata);
    try {
      const result = await fn();
      const duration = this.endMeasure(name) || 0;
      return { result, duration };
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  /**
   * Measure a synchronous function execution time
   */
  public measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): { result: T; duration: number } {
    if (!this.isEnabled) {
      const result = fn();
      return { result, duration: 0 };
    }

    this.startMeasure(name, metadata);
    try {
      const result = fn();
      const duration = this.endMeasure(name) || 0;
      return { result, duration };
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  /**
   * Get benchmark statistics for an operation
   */
  public getBenchmark(operation: string): PerformanceBenchmark | null {
    const samples = this.benchmarks.get(operation);
    if (!samples || samples.length === 0) {
      return null;
    }

    const sorted = [...samples].sort((a, b) => a - b);
    const sum = samples.reduce((a, b) => a + b, 0);

    return {
      operation,
      samples: [...samples],
      average: sum / samples.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  /**
   * Get all benchmarks
   */
  public getAllBenchmarks(): PerformanceBenchmark[] {
    return Array.from(this.benchmarks.keys())
      .map(operation => this.getBenchmark(operation))
      .filter((benchmark): benchmark is PerformanceBenchmark => benchmark !== null);
  }

  /**
   * Clear all metrics and benchmarks
   */
  public clear(): void {
    this.metrics.clear();
    this.benchmarks.clear();
  }

  /**
   * Enable or disable performance monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * Check if monitoring is enabled
   */
  public isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    totalOperations: number;
    averageResponseTime: number;
    slowestOperation: string | null;
    fastestOperation: string | null;
    benchmarks: PerformanceBenchmark[];
  } {
    const benchmarks = this.getAllBenchmarks();
    
    if (benchmarks.length === 0) {
      return {
        totalOperations: 0,
        averageResponseTime: 0,
        slowestOperation: null,
        fastestOperation: null,
        benchmarks: []
      };
    }

    const totalSamples = benchmarks.reduce((sum, b) => sum + b.samples.length, 0);
    const totalTime = benchmarks.reduce((sum, b) => sum + b.samples.reduce((s, t) => s + t, 0), 0);
    const averageResponseTime = totalTime / totalSamples;

    const slowestBenchmark = benchmarks.reduce((slowest, current) => 
      current.average > slowest.average ? current : slowest
    );

    const fastestBenchmark = benchmarks.reduce((fastest, current) => 
      current.average < fastest.average ? current : fastest
    );

    return {
      totalOperations: totalSamples,
      averageResponseTime,
      slowestOperation: slowestBenchmark.operation,
      fastestOperation: fastestBenchmark.operation,
      benchmarks
    };
  }

  /**
   * Log performance summary to console
   */
  public logPerformanceSummary(): void {
    const summary = this.getPerformanceSummary();
    
    console.group('🚀 Proofreader Performance Summary');
    console.log(`Total Operations: ${summary.totalOperations}`);
    console.log(`Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms`);
    
    if (summary.slowestOperation) {
      console.log(`Slowest Operation: ${summary.slowestOperation}`);
    }
    
    if (summary.fastestOperation) {
      console.log(`Fastest Operation: ${summary.fastestOperation}`);
    }

    if (summary.benchmarks.length > 0) {
      console.table(summary.benchmarks.map(b => ({
        Operation: b.operation,
        Samples: b.samples.length,
        'Avg (ms)': b.average.toFixed(2),
        'Min (ms)': b.min.toFixed(2),
        'Max (ms)': b.max.toFixed(2),
        'P95 (ms)': b.p95.toFixed(2),
        'P99 (ms)': b.p99.toFixed(2)
      })));
    }
    
    console.groupEnd();
  }

  /**
   * Export performance data for analysis
   */
  public exportData(): {
    timestamp: string;
    summary: ReturnType<ProofreaderPerformanceMonitor['getPerformanceSummary']>;
    rawData: Record<string, number[]>;
  } {
    return {
      timestamp: new Date().toISOString(),
      summary: this.getPerformanceSummary(),
      rawData: Object.fromEntries(this.benchmarks.entries())
    };
  }

  /**
   * Import performance data
   */
  public importData(data: {
    rawData: Record<string, number[]>;
  }): void {
    this.benchmarks.clear();
    
    for (const [operation, samples] of Object.entries(data.rawData)) {
      this.benchmarks.set(operation, [...samples]);
    }
  }
}

// Global performance monitor instance
export const proofreaderPerformanceMonitor = new ProofreaderPerformanceMonitor();

// Development helper to enable/disable monitoring based on environment
if (typeof window !== 'undefined') {
  // Enable monitoring in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  proofreaderPerformanceMonitor.setEnabled(isDevelopment);
  
  // Add global access for debugging
  (window as any).proofreaderPerformance = proofreaderPerformanceMonitor;
}