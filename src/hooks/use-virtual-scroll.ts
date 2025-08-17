/**
 * Virtual Scrolling Hook
 * Provides virtual scrolling functionality for large lists
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render outside viewport
  scrollingDelay?: number; // Delay before considering scrolling stopped
}

export interface VirtualScrollResult<T> {
  virtualItems: Array<{
    index: number;
    item: T;
    offsetTop: number;
  }>;
  totalHeight: number;
  scrollElementProps: {
    style: React.CSSProperties;
    onScroll: (event: React.UIEvent<HTMLElement>) => void;
  };
  containerProps: {
    style: React.CSSProperties;
  };
  isScrolling: boolean;
  scrollTop: number;
}

/**
 * Virtual scrolling hook for performance optimization of large lists
 */
export function useVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult<T> {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    scrollingDelay = 150
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollingTimeout, setScrollingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return items.length * itemHeight;
  }, [items.length, itemHeight]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  // Calculate virtual items
  const virtualItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    const result = [];

    for (let i = startIndex; i <= endIndex; i++) {
      if (i < items.length) {
        result.push({
          index: i,
          item: items[i],
          offsetTop: i * itemHeight
        });
      }
    }

    return result;
  }, [visibleRange, items, itemHeight]);

  // Handle scroll events with throttling for better performance
  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    
    // Throttle scroll updates for better performance
    requestAnimationFrame(() => {
      setScrollTop(newScrollTop);
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollingTimeout) {
        clearTimeout(scrollingTimeout);
      }

      // Set new timeout to detect when scrolling stops
      const timeout = setTimeout(() => {
        setIsScrolling(false);
      }, scrollingDelay);

      setScrollingTimeout(timeout);
    });
  }, [scrollingTimeout, scrollingDelay]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollingTimeout) {
        clearTimeout(scrollingTimeout);
      }
    };
  }, [scrollingTimeout]);

  // Reset scroll position when items change significantly
  useEffect(() => {
    if (scrollTop > totalHeight) {
      setScrollTop(0);
    }
  }, [totalHeight, scrollTop]);

  // Scroll element props
  const scrollElementProps = useMemo(() => ({
    style: {
      height: containerHeight,
      overflow: 'auto' as const,
      position: 'relative' as const
    },
    onScroll: handleScroll
  }), [containerHeight, handleScroll]);

  // Container props for the virtual list
  const containerProps = useMemo(() => ({
    style: {
      height: totalHeight,
      position: 'relative' as const
    }
  }), [totalHeight]);

  return {
    virtualItems,
    totalHeight,
    scrollElementProps,
    containerProps,
    isScrolling,
    scrollTop
  };
}

/**
 * Hook for virtual scrolling with dynamic item heights
 */
export function useVirtualScrollDynamic<T>(
  items: T[],
  getItemHeight: (index: number, item: T) => number,
  containerHeight: number,
  overscan: number = 5
): VirtualScrollResult<T> & {
  measureElement: (index: number, element: HTMLElement) => void;
} {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollingTimeout, setScrollingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(new Map());

  // Calculate item offsets
  const itemOffsets = useMemo(() => {
    const offsets = [0];
    let totalHeight = 0;

    for (let i = 0; i < items.length; i++) {
      const height = measuredHeights.get(i) || getItemHeight(i, items[i]);
      totalHeight += height;
      offsets.push(totalHeight);
    }

    return offsets;
  }, [items, measuredHeights, getItemHeight]);

  const totalHeight = itemOffsets[itemOffsets.length - 1] || 0;

  // Find visible range with binary search for dynamic heights
  const visibleRange = useMemo(() => {
    const findIndex = (offset: number) => {
      let low = 0;
      let high = itemOffsets.length - 1;

      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (itemOffsets[mid] < offset) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }

      return Math.max(0, low - 1);
    };

    const startIndex = Math.max(0, findIndex(scrollTop) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      findIndex(scrollTop + containerHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, overscan, itemOffsets, items.length]);

  // Calculate virtual items for dynamic heights
  const virtualItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    const result = [];

    for (let i = startIndex; i <= endIndex; i++) {
      if (i < items.length) {
        result.push({
          index: i,
          item: items[i],
          offsetTop: itemOffsets[i]
        });
      }
    }

    return result;
  }, [visibleRange, items, itemOffsets]);

  // Measure element height
  const measureElement = useCallback((index: number, element: HTMLElement) => {
    const height = element.getBoundingClientRect().height;
    setMeasuredHeights(prev => {
      const newMap = new Map(prev);
      newMap.set(index, height);
      return newMap;
    });
  }, []);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    if (scrollingTimeout) {
      clearTimeout(scrollingTimeout);
    }

    const timeout = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    setScrollingTimeout(timeout);
  }, [scrollingTimeout]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollingTimeout) {
        clearTimeout(scrollingTimeout);
      }
    };
  }, [scrollingTimeout]);

  const scrollElementProps = useMemo(() => ({
    style: {
      height: containerHeight,
      overflow: 'auto' as const,
      position: 'relative' as const
    },
    onScroll: handleScroll
  }), [containerHeight, handleScroll]);

  const containerProps = useMemo(() => ({
    style: {
      height: totalHeight,
      position: 'relative' as const
    }
  }), [totalHeight]);

  return {
    virtualItems,
    totalHeight,
    scrollElementProps,
    containerProps,
    isScrolling,
    scrollTop,
    measureElement
  };
}

/**
 * Hook for infinite scrolling with virtual scrolling
 */
export function useInfiniteVirtualScroll<T>(
  items: T[],
  options: VirtualScrollOptions & {
    hasNextPage: boolean;
    loadMore: () => Promise<void>;
    loadingThreshold?: number; // Distance from bottom to trigger load
  }
): VirtualScrollResult<T> & {
  isLoadingMore: boolean;
} {
  const {
    hasNextPage,
    loadMore,
    loadingThreshold = 200,
    ...virtualScrollOptions
  } = options;

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const virtualScrollResult = useVirtualScroll(items, virtualScrollOptions);
  const { scrollTop, totalHeight } = virtualScrollResult;
  const { containerHeight } = virtualScrollOptions;

  // Check if we need to load more items
  useEffect(() => {
    const distanceFromBottom = totalHeight - (scrollTop + containerHeight);
    
    if (
      hasNextPage &&
      !isLoadingMore &&
      distanceFromBottom < loadingThreshold
    ) {
      setIsLoadingMore(true);
      loadMore().finally(() => {
        setIsLoadingMore(false);
      });
    }
  }, [scrollTop, totalHeight, containerHeight, hasNextPage, isLoadingMore, loadMore, loadingThreshold]);

  return {
    ...virtualScrollResult,
    isLoadingMore
  };
}