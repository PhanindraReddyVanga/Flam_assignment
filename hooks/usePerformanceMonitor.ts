'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { PerformanceMetrics } from '@/lib/types';
import { performanceMonitor } from '@/lib/performanceUtils';

interface UsePerformanceMonitorOptions {
  enabled?: boolean;
  updateInterval?: number;
  totalDataPoints?: number;
}

export function usePerformanceMonitor({
  enabled = true,
  updateInterval = 1000,
  totalDataPoints = 0,
}: UsePerformanceMonitorOptions = {}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    dataProcessingTime: 0,
    totalDataPoints,
    updateLatency: 0,
  });

  const updateLatencyRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(Date.now());

  const recordUpdate = useCallback(() => {
    const now = Date.now();
    updateLatencyRef.current = now - lastUpdateRef.current;
    lastUpdateRef.current = now;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      const newMetrics = performanceMonitor.getMetrics(totalDataPoints, updateLatencyRef.current);
      setMetrics(newMetrics);
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [enabled, updateInterval, totalDataPoints]);

  useEffect(() => {
    if (!enabled) return;

    const recordFrame = () => {
      performanceMonitor.recordFrameStart();
      performanceMonitor.recordFrameEnd();
      requestAnimationFrame(recordFrame);
    };

    const rafId = requestAnimationFrame(recordFrame);

    return () => cancelAnimationFrame(rafId);
  }, [enabled]);

  return { metrics, recordUpdate };
}
