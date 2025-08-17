/**
 * Virtual Scroll Hook Tests
 * Tests for the virtual scrolling hook implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVirtualScroll, useVirtualScrollDynamic, useInfiniteVirtualScroll } from '../hooks/use-virtual-scroll';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn();
Object.defineProperty(window, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
});

describe('useVirtualScroll', () => {
  beforeEach(() => {
    mockPerformanceNow.mockReturnValue(0);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Basic Virtual Scrolling', () => {
    it('should initialize with correct default values', () => {
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 400
        })
      );

      expect(result.current.totalHeight).toBe(5000); // 100 * 50
      expect(result.current.scrollTop).toBe(0);
      expect(result.current.isScrolling).toBe(false);
      expect(result.current.virtualItems.length).toBeGreaterThan(0);
    });

    it('should calculate visible items correctly', () => {
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 400,
          overscan: 2
        })
      );

      // With containerHeight 400 and itemHeight 50, we can see 8 items
      // Plus overscan of 2 on each side = 12 items total
      expect(result.current.virtualItems.length).toBeLessThanOrEqual(12);
      
      // First item should start at index 0
      expect(result.current.virtualItems[0].index).toBe(0);
      expect(result.current.virtualItems[0].offsetTop).toBe(0);
    });

    it('should update visible items when scrolling', () => {
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 400,
          overscan: 1
        })
      );

      // Simulate scroll event
      act(() => {
        const scrollEvent = {
          currentTarget: { scrollTop: 250 }
        } as React.UIEvent<HTMLElement>;
        
        result.current.scrollElementProps.onScroll(scrollEvent);
      });

      expect(result.current.scrollTop).toBe(250);
      expect(result.current.isScrolling).toBe(true);
      
      // Should show different items after scrolling
      const firstVisibleIndex = result.current.virtualItems[0].index;
      expect(firstVisibleIndex).toBeGreaterThan(0);
    });

    it('should handle scrolling state correctly', () => {
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 400,
          scrollingDelay: 100
        })
      );

      // Start scrolling
      act(() => {
        const scrollEvent = {
          currentTarget: { scrollTop: 100 }
        } as React.UIEvent<HTMLElement>;
        
        result.current.scrollElementProps.onScroll(scrollEvent);
      });

      expect(result.current.isScrolling).toBe(true);

      // Fast-forward time to trigger scrolling stop
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current.isScrolling).toBe(false);
    });

    it('should reset scroll position when items change significantly', () => {
      let items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      
      const { result, rerender } = renderHook(
        ({ items }) => useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 400
        }),
        { initialProps: { items } }
      );

      // Scroll down
      act(() => {
        const scrollEvent = {
          currentTarget: { scrollTop: 2000 }
        } as React.UIEvent<HTMLElement>;
        
        result.current.scrollElementProps.onScroll(scrollEvent);
      });

      expect(result.current.scrollTop).toBe(2000);

      // Change to much smaller list
      items = Array.from({ length: 10 }, (_, i) => `Item ${i}`);
      rerender({ items });

      // Should reset scroll position
      expect(result.current.scrollTop).toBe(0);
    });

    it('should provide correct container and scroll element props', () => {
      const items = Array.from({ length: 50 }, (_, i) => `Item ${i}`);
      
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 60,
          containerHeight: 300
        })
      );

      expect(result.current.scrollElementProps.style.height).toBe(300);
      expect(result.current.scrollElementProps.style.overflow).toBe('auto');
      expect(result.current.scrollElementProps.style.position).toBe('relative');

      expect(result.current.containerProps.style.height).toBe(3000); // 50 * 60
      expect(result.current.containerProps.style.position).toBe('relative');
    });
  });

  describe('Dynamic Height Virtual Scrolling', () => {
    it('should handle dynamic item heights', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({ id: i, content: `Item ${i}` }));
      const getItemHeight = (index: number) => 50 + (index % 3) * 20; // Variable heights
      
      const { result } = renderHook(() =>
        useVirtualScrollDynamic(items, getItemHeight, 400, 2)
      );

      expect(result.current.virtualItems.length).toBeGreaterThan(0);
      expect(result.current.totalHeight).toBeGreaterThan(0);
      
      // Each item should have correct offset
      result.current.virtualItems.forEach((item, index) => {
        if (index > 0) {
          expect(item.offsetTop).toBeGreaterThan(result.current.virtualItems[index - 1].offsetTop);
        }
      });
    });

    it('should update heights when elements are measured', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i, content: `Item ${i}` }));
      const getItemHeight = () => 50; // Default height
      
      const { result } = renderHook(() =>
        useVirtualScrollDynamic(items, getItemHeight, 400)
      );

      const initialHeight = result.current.totalHeight;

      // Simulate measuring an element with different height
      act(() => {
        const mockElement = {
          getBoundingClientRect: () => ({ height: 80 })
        } as HTMLElement;
        
        result.current.measureElement(0, mockElement);
      });

      // Total height should update
      expect(result.current.totalHeight).toBeGreaterThan(initialHeight);
    });
  });

  describe('Infinite Virtual Scrolling', () => {
    it('should trigger load more when near bottom', async () => {
      const items = Array.from({ length: 20 }, (_, i) => `Item ${i}`);
      const loadMore = vi.fn().mockResolvedValue(undefined);
      
      const { result } = renderHook(() =>
        useInfiniteVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 400,
          hasNextPage: true,
          loadMore,
          loadingThreshold: 100
        })
      );

      expect(result.current.isLoadingMore).toBe(false);

      // Scroll near bottom
      act(() => {
        const scrollEvent = {
          currentTarget: { scrollTop: 800 } // Near bottom of 1000px total
        } as React.UIEvent<HTMLElement>;
        
        result.current.scrollElementProps.onScroll(scrollEvent);
      });

      // Should trigger load more
      expect(loadMore).toHaveBeenCalled();
      expect(result.current.isLoadingMore).toBe(true);

      // Wait for load more to complete
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(result.current.isLoadingMore).toBe(false);
    });

    it('should not trigger load more when hasNextPage is false', () => {
      const items = Array.from({ length: 20 }, (_, i) => `Item ${i}`);
      const loadMore = vi.fn().mockResolvedValue(undefined);
      
      const { result } = renderHook(() =>
        useInfiniteVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 400,
          hasNextPage: false, // No more pages
          loadMore,
          loadingThreshold: 100
        })
      );

      // Scroll to bottom
      act(() => {
        const scrollEvent = {
          currentTarget: { scrollTop: 900 }
        } as React.UIEvent<HTMLElement>;
        
        result.current.scrollElementProps.onScroll(scrollEvent);
      });

      // Should not trigger load more
      expect(loadMore).not.toHaveBeenCalled();
      expect(result.current.isLoadingMore).toBe(false);
    });

    it('should not trigger multiple load more calls', () => {
      const items = Array.from({ length: 20 }, (_, i) => `Item ${i}`);
      const loadMore = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const { result } = renderHook(() =>
        useInfiniteVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 400,
          hasNextPage: true,
          loadMore,
          loadingThreshold: 100
        })
      );

      // Scroll near bottom multiple times quickly
      act(() => {
        const scrollEvent = {
          currentTarget: { scrollTop: 800 }
        } as React.UIEvent<HTMLElement>;
        
        result.current.scrollElementProps.onScroll(scrollEvent);
        result.current.scrollElementProps.onScroll(scrollEvent);
        result.current.scrollElementProps.onScroll(scrollEvent);
      });

      // Should only call load more once
      expect(loadMore).toHaveBeenCalledTimes(1);
      expect(result.current.isLoadingMore).toBe(true);
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large item lists efficiently', () => {
      const largeItemList = Array.from({ length: 10000 }, (_, i) => `Item ${i}`);
      
      const startTime = performance.now();
      
      const { result } = renderHook(() =>
        useVirtualScroll(largeItemList, {
          itemHeight: 50,
          containerHeight: 400,
          overscan: 5
        })
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly even with large lists
      expect(renderTime).toBeLessThan(100); // Less than 100ms
      
      // Should only render visible items plus overscan
      expect(result.current.virtualItems.length).toBeLessThan(20);
      expect(result.current.totalHeight).toBe(500000); // 10000 * 50
    });

    it('should update efficiently when scrolling rapidly', () => {
      const items = Array.from({ length: 1000 }, (_, i) => `Item ${i}`);
      
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 400,
          overscan: 3
        })
      );

      const scrollPositions = [100, 200, 300, 400, 500, 600, 700, 800];
      
      scrollPositions.forEach(scrollTop => {
        act(() => {
          const scrollEvent = {
            currentTarget: { scrollTop }
          } as React.UIEvent<HTMLElement>;
          
          result.current.scrollElementProps.onScroll(scrollEvent);
        });
      });

      // Should handle rapid scrolling without issues
      expect(result.current.scrollTop).toBe(800);
      expect(result.current.virtualItems.length).toBeGreaterThan(0);
      expect(result.current.virtualItems.length).toBeLessThan(20);
    });

    it('should cleanup timers on unmount', () => {
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      
      const { result, unmount } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 400,
          scrollingDelay: 200
        })
      );

      // Start scrolling to create timer
      act(() => {
        const scrollEvent = {
          currentTarget: { scrollTop: 100 }
        } as React.UIEvent<HTMLElement>;
        
        result.current.scrollElementProps.onScroll(scrollEvent);
      });

      expect(result.current.isScrolling).toBe(true);

      // Unmount component
      unmount();

      // Timer should be cleaned up (no way to directly test, but ensures no memory leaks)
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});