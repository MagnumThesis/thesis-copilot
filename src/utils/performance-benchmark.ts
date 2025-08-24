/**
 * Performance Benchmark Utility
 * Provides utilities for measuring and reporting performance metrics
 */

export interface BenchmarkResult {
  name: string;
  duration: number;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  memoryUsage?: {
    before: number;
    after: number;
    increase: number;
  };
}

export interface BenchmarkOptions {
  iterations?: number;
  warmupIterations?: number;
  measureMemory?: boolean;
  timeout?: number;
}

/**
 * Performance benchmark utility class
 */
export class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  /**
   * Run a benchmark for a given function
   */
  async benchmark(
    name: string,
    fn: () => Promise<void> | void,
    options: BenchmarkOptions = {}
  ): Promise<BenchmarkResult> {
    const {
      iterations = 100,
      warmupIterations = 10,
      measureMemory = false,
      timeout = 30000
    } = options;

    console.log(`Starting benchmark: ${name}`);

    // Warmup iterations
    if (warmupIterations > 0) {
      console.log(`Running ${warmupIterations} warmup iterations...`);
      for (let i = 0; i < warmupIterations; i++) {
        await fn();
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const times: number[] = [];
    let memoryBefore = 0;
    let memoryAfter = 0;

    if (measureMemory) {
      memoryBefore = process.memoryUsage().heapUsed;
    }

    const startTime = Date.now();

    // Run benchmark iterations
    for (let i = 0; i < iterations; i++) {
      const iterationStart = performance.now();
      
      try {
        await Promise.race([
          Promise.resolve(fn()),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Benchmark timeout')), timeout)
          )
        ]);
      } catch (error) {
        console.error(`Benchmark iteration ${i + 1} failed:`, error);
        throw error;
      }
      
      const iterationEnd = performance.now();
      times.push(iterationEnd - iterationStart);

      // Progress reporting for long benchmarks
      if (iterations > 50 && (i + 1) % Math.floor(iterations / 10) === 0) {
        console.log(`Progress: ${i + 1}/${iterations} iterations completed`);
      }
    }

    const endTime = Date.now();

    if (measureMemory) {
      memoryAfter = process.memoryUsage().heapUsed;
    }

    // Calculate statistics
    const totalDuration = endTime - startTime;
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const result: BenchmarkResult = {
      name,
      duration: totalDuration,
      iterations,
      averageTime,
      minTime,
      maxTime,
      memoryUsage: measureMemory ? {
        before: memoryBefore,
        after: memoryAfter,
        increase: memoryAfter - memoryBefore
      } : undefined
    };

    this.results.push(result);

    console.log(`Benchmark completed: ${name}`);
    console.log(`  Total duration: ${totalDuration}ms`);
    console.log(`  Average time per iteration: ${averageTime.toFixed(2)}ms`);
    console.log(`  Min time: ${minTime.toFixed(2)}ms`);
    console.log(`  Max time: ${maxTime.toFixed(2)}ms`);
    
    if (measureMemory && result.memoryUsage) {
      console.log(`  Memory increase: ${(result.memoryUsage.increase / 1024 / 1024).toFixed(2)} MB`);
    }

    return result;
  }

  /**
   * Compare two benchmark results
   */
  compare(baseline: BenchmarkResult, comparison: BenchmarkResult): {
    speedup: number;
    percentageImprovement: number;
    memoryImprovement?: number;
  } {
    const speedup = baseline.averageTime / comparison.averageTime;
    const percentageImprovement = ((baseline.averageTime - comparison.averageTime) / baseline.averageTime) * 100;

    let memoryImprovement: number | undefined;
    if (baseline.memoryUsage && comparison.memoryUsage) {
      memoryImprovement = baseline.memoryUsage.increase - comparison.memoryUsage.increase;
    }

    return {
      speedup,
      percentageImprovement,
      memoryImprovement
    };
  }

  /**
   * Get all benchmark results
   */
  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  /**
   * Clear all results
   */
  clearResults(): void {
    this.results = [];
  }

  /**
   * Export results to JSON
   */
  exportResults(): string {
    return JSON.stringify(this.results, null, 2);
  }

  /**
   * Generate a performance report
   */
  generateReport(): string {
    if (this.results.length === 0) {
      return 'No benchmark results available.';
    }

    let report = 'Performance Benchmark Report\n';
    report += '================================\n\n';

    for (const result of this.results) {
      report += `Benchmark: ${result.name}\n`;
      report += `  Iterations: ${result.iterations}\n`;
      report += `  Total Duration: ${result.duration}ms\n`;
      report += `  Average Time: ${result.averageTime.toFixed(2)}ms\n`;
      report += `  Min Time: ${result.minTime.toFixed(2)}ms\n`;
      report += `  Max Time: ${result.maxTime.toFixed(2)}ms\n`;
      
      if (result.memoryUsage) {
        report += `  Memory Usage:\n`;
        report += `    Before: ${(result.memoryUsage.before / 1024 / 1024).toFixed(2)} MB\n`;
        report += `    After: ${(result.memoryUsage.after / 1024 / 1024).toFixed(2)} MB\n`;
        report += `    Increase: ${(result.memoryUsage.increase / 1024 / 1024).toFixed(2)} MB\n`;
      }
      
      report += '\n';
    }

    return report;
  }
}

/**
 * Utility function to measure execution time
 */
export async function measureTime<T>(
  fn: () => Promise<T> | T,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  if (label) {
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * Utility function to measure memory usage
 */
export function measureMemory<T>(fn: () => T, label?: string): { result: T; memoryIncrease: number } {
  const memoryBefore = process.memoryUsage().heapUsed;
  const result = fn();
  const memoryAfter = process.memoryUsage().heapUsed;
  const memoryIncrease = memoryAfter - memoryBefore;

  if (label) {
    console.log(`${label} memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
  }

  return { result, memoryIncrease };
}

/**
 * Create a performance profiler for tracking multiple operations
 */
export class PerformanceProfiler {
  private operations: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  start(operationName: string): void {
    this.startTimes.set(operationName, performance.now());
  }

  /**
   * End timing an operation
   */
  end(operationName: string): number {
    const startTime = this.startTimes.get(operationName);
    if (!startTime) {
      throw new Error(`No start time found for operation: ${operationName}`);
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(operationName);

    if (!this.operations.has(operationName)) {
      this.operations.set(operationName, []);
    }
    this.operations.get(operationName)!.push(duration);

    return duration;
  }

  /**
   * Get statistics for an operation
   */
  getStats(operationName: string): {
    count: number;
    total: number;
    average: number;
    min: number;
    max: number;
  } | null {
    const times = this.operations.get(operationName);
    if (!times || times.length === 0) {
      return null;
    }

    const total = times.reduce((sum, time) => sum + time, 0);
    const average = total / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return {
      count: times.length,
      total,
      average,
      min,
      max
    };
  }

  /**
   * Get all operation statistics
   */
  getAllStats(): Record<string, ReturnType<PerformanceProfiler['getStats']>> {
    const stats: Record<string, ReturnType<PerformanceProfiler['getStats']>> = {};
    
    for (const operationName of this.operations.keys()) {
      stats[operationName] = this.getStats(operationName);
    }

    return stats;
  }

  /**
   * Clear all recorded operations
   */
  clear(): void {
    this.operations.clear();
    this.startTimes.clear();
  }

  /**
   * Generate a performance report
   */
  generateReport(): string {
    const stats = this.getAllStats();
    
    if (Object.keys(stats).length === 0) {
      return 'No performance data available.';
    }

    let report = 'Performance Profiler Report\n';
    report += '===========================\n\n';

    for (const [operationName, operationStats] of Object.entries(stats)) {
      if (!operationStats) continue;

      report += `Operation: ${operationName}\n`;
      report += `  Count: ${operationStats.count}\n`;
      report += `  Total Time: ${operationStats.total.toFixed(2)}ms\n`;
      report += `  Average Time: ${operationStats.average.toFixed(2)}ms\n`;
      report += `  Min Time: ${operationStats.min.toFixed(2)}ms\n`;
      report += `  Max Time: ${operationStats.max.toFixed(2)}ms\n\n`;
    }

    return report;
  }
}

// Global performance profiler instance
export const globalProfiler = new PerformanceProfiler();