import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PerformanceBenchmark,
  measureTime,
  measureMemory,
  PerformanceProfiler,
  globalProfiler,
} from '../../utils/performance-benchmark';

describe('PerformanceBenchmark Utility', () => {
  let benchmark: PerformanceBenchmark;

  beforeEach(() => {
    benchmark = new PerformanceBenchmark();
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Default performance.now() returns time since origin, just mock it to return Date.now() for simplicity when using fake timers
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('PerformanceBenchmark class', () => {
    it('should run benchmark correctly with default options', async () => {
      let counter = 0;
      const testFn = vi.fn().mockImplementation(async () => {
        counter++;
        vi.advanceTimersByTime(10);
      });

      // We need to use process.nextTick or similar to let the promises resolve
      // but since we advance time inside the function, it handles the fake time
      const resultPromise = benchmark.benchmark('test-default', testFn, {
        iterations: 5,
        warmupIterations: 2
      });

      // Flush microtasks
      await Promise.resolve();

      const result = await resultPromise;

      expect(testFn).toHaveBeenCalledTimes(7); // 5 iterations + 2 warmup
      expect(result.name).toBe('test-default');
      expect(result.iterations).toBe(5);
      expect(result.averageTime).toBe(10);
      expect(result.minTime).toBe(10);
      expect(result.maxTime).toBe(10);
      expect(result.memoryUsage).toBeUndefined();
    });

    it('should measure memory if measureMemory is true', async () => {
      // Mock process.memoryUsage
      let memoryCounter = 1000;
      vi.spyOn(process, 'memoryUsage').mockImplementation(() => ({
        heapUsed: (memoryCounter += 1000),
        rss: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0
      }));

      const testFn = vi.fn().mockResolvedValue(undefined);

      const result = await benchmark.benchmark('test-memory', testFn, {
        iterations: 1,
        warmupIterations: 0,
        measureMemory: true
      });

      expect(result.memoryUsage).toBeDefined();
      expect(result.memoryUsage?.before).toBe(2000); // First call to memoryUsage
      expect(result.memoryUsage?.after).toBe(3000);  // Second call to memoryUsage
      expect(result.memoryUsage?.increase).toBe(1000);
    });

    it('should handle benchmark timeout', async () => {
      const slowFn = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 10000)));

      const benchmarkPromise = benchmark.benchmark('test-timeout', slowFn, {
        iterations: 1,
        warmupIterations: 0,
        timeout: 100
      });

      // Advance time past timeout
      vi.advanceTimersByTime(150);

      await expect(benchmarkPromise).rejects.toThrow('Benchmark timeout');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Benchmark iteration 1 failed:'), expect.any(Error));
    });

    it('should force garbage collection if global.gc is available', async () => {
      const gcMock = vi.fn();
      // @ts-ignore
      global.gc = gcMock;

      await benchmark.benchmark('test-gc', vi.fn(), { iterations: 1, warmupIterations: 0 });

      expect(gcMock).toHaveBeenCalled();

      // cleanup
      // @ts-ignore
      delete global.gc;
    });

    it('should calculate speedup and improvements correctly in compare()', () => {
      const baseline = {
        name: 'baseline',
        duration: 1000,
        iterations: 10,
        averageTime: 100,
        minTime: 90,
        maxTime: 110,
        memoryUsage: { before: 100, after: 200, increase: 100 }
      };

      const comparison = {
        name: 'comparison',
        duration: 500,
        iterations: 10,
        averageTime: 50,
        minTime: 40,
        maxTime: 60,
        memoryUsage: { before: 100, after: 150, increase: 50 }
      };

      const result = benchmark.compare(baseline, comparison);

      expect(result.speedup).toBe(2);
      expect(result.percentageImprovement).toBe(50);
      expect(result.memoryImprovement).toBe(50);
    });

    it('should store and retrieve results', async () => {
      await benchmark.benchmark('test1', vi.fn(), { iterations: 1, warmupIterations: 0 });
      await benchmark.benchmark('test2', vi.fn(), { iterations: 1, warmupIterations: 0 });

      const results = benchmark.getResults();
      expect(results.length).toBe(2);
      expect(results[0].name).toBe('test1');
      expect(results[1].name).toBe('test2');
    });

    it('should clear results', async () => {
      await benchmark.benchmark('test1', vi.fn(), { iterations: 1, warmupIterations: 0 });
      benchmark.clearResults();
      expect(benchmark.getResults().length).toBe(0);
    });

    it('should export results to JSON', async () => {
      await benchmark.benchmark('test1', vi.fn(), { iterations: 1, warmupIterations: 0 });
      const json = benchmark.exportResults();
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.length).toBe(1);
      expect(parsed[0].name).toBe('test1');
    });

    it('should generate a formatted report', async () => {
      expect(benchmark.generateReport()).toBe('No benchmark results available.');

      await benchmark.benchmark('test1', vi.fn(), { iterations: 1, warmupIterations: 0 });
      const report = benchmark.generateReport();
      expect(report).toContain('Performance Benchmark Report');
      expect(report).toContain('Benchmark: test1');
    });
  });

  describe('measureTime utility', () => {
    it('should measure time correctly for async functions', async () => {
      const testFn = async () => {
        vi.advanceTimersByTime(50);
        return 'success';
      };

      const { result, duration } = await measureTime(testFn, 'test-label');

      expect(result).toBe('success');
      expect(duration).toBe(50);
      expect(console.log).toHaveBeenCalledWith('test-label: 50.00ms');
    });
  });

  describe('measureMemory utility', () => {
    it('should measure memory increase correctly', () => {
      let memoryCounter = 1000;
      vi.spyOn(process, 'memoryUsage').mockImplementation(() => ({
        heapUsed: (memoryCounter += 1000),
        rss: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0
      }));

      const testFn = () => 'success';

      const { result, memoryIncrease } = measureMemory(testFn, 'test-memory-label');

      expect(result).toBe('success');
      expect(memoryIncrease).toBe(1000);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test-memory-label memory increase:'));
    });
  });

  describe('PerformanceProfiler class', () => {
    let profiler: PerformanceProfiler;

    beforeEach(() => {
      profiler = new PerformanceProfiler();
    });

    it('should record operation duration correctly', () => {
      profiler.start('op1');
      vi.advanceTimersByTime(100);
      const duration = profiler.end('op1');

      expect(duration).toBe(100);

      const stats = profiler.getStats('op1');
      expect(stats).toEqual({
        count: 1,
        total: 100,
        average: 100,
        min: 100,
        max: 100
      });
    });

    it('should aggregate multiple recordings of the same operation', () => {
      profiler.start('op1');
      vi.advanceTimersByTime(100);
      profiler.end('op1');

      profiler.start('op1');
      vi.advanceTimersByTime(200);
      profiler.end('op1');

      const stats = profiler.getStats('op1');
      expect(stats).toEqual({
        count: 2,
        total: 300,
        average: 150,
        min: 100,
        max: 200
      });
    });

    it('should throw error if end is called without start', () => {
      expect(() => profiler.end('non-existent')).toThrow('No start time found for operation: non-existent');
    });

    it('should return null for non-existent stats', () => {
      expect(profiler.getStats('non-existent')).toBeNull();
    });

    it('should return all stats correctly', () => {
      profiler.start('op1');
      vi.advanceTimersByTime(10);
      profiler.end('op1');

      profiler.start('op2');
      vi.advanceTimersByTime(20);
      profiler.end('op2');

      const allStats = profiler.getAllStats();
      expect(Object.keys(allStats).length).toBe(2);
      expect(allStats['op1']?.average).toBe(10);
      expect(allStats['op2']?.average).toBe(20);
    });

    it('should clear recorded operations', () => {
      profiler.start('op1');
      vi.advanceTimersByTime(10);
      profiler.end('op1');

      profiler.clear();

      expect(profiler.getAllStats()).toEqual({});
      expect(profiler.getStats('op1')).toBeNull();
    });

    it('should generate a formatted report', () => {
      expect(profiler.generateReport()).toBe('No performance data available.');

      profiler.start('op1');
      vi.advanceTimersByTime(100);
      profiler.end('op1');

      const report = profiler.generateReport();
      expect(report).toContain('Performance Profiler Report');
      expect(report).toContain('Operation: op1');
      expect(report).toContain('Count: 1');
    });
  });

  describe('globalProfiler', () => {
    it('should be an instance of PerformanceProfiler', () => {
      expect(globalProfiler).toBeInstanceOf(PerformanceProfiler);
    });
  });
});
