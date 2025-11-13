'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

interface VirtualizedListOptions {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface VirtualizedState {
  startIndex: number;
  endIndex: number;
  visibleItems: any[];
  offsetY: number;
}

export function useVirtualization({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: VirtualizedListOptions) {
  const [scrollTop, setScrollTop] = useState(0);

  const state = useMemo<VirtualizedState>(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(items.length, startIndex + visibleCount);

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    setScrollTop(element.scrollTop);
  }, []);

  return {
    state,
    handleScroll,
  };
}

// Hook for infinite scrolling
export function useInfiniteScroll({
  items,
  itemHeight,
  containerHeight,
  onLoadMore,
  threshold = 200,
}: VirtualizedListOptions & {
  onLoadMore?: () => void;
  threshold?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const state = useMemo<VirtualizedState>(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(items.length, startIndex + visibleCount);

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const element = e.currentTarget;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;

      setScrollTop(scrollTop);

      // Trigger load more when near bottom
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        onLoadMore?.();
      }
    },
    [threshold, onLoadMore]
  );

  return {
    state,
    handleScroll,
  };
}
