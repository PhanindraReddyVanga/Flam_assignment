import { PerformanceMetrics } from './types';

class PerformanceMonitor {
  private frameCount = 0;
  private lastSecond = Date.now();
  private fps = 60;
  private frameStartTime = 0;
  private renderTimes: number[] = [];
  private maxRenderTimes = 60; // Keep last 60 render times

  recordFrameStart(): void {
    this.frameStartTime = performance.now();
  }

  recordFrameEnd(): void {
    const renderTime = performance.now() - this.frameStartTime;
    this.renderTimes.push(renderTime);

    if (this.renderTimes.length > this.maxRenderTimes) {
      this.renderTimes.shift();
    }

    this.frameCount++;
    const now = Date.now();

    if (now - this.lastSecond >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastSecond = now;
    }
  }

  getFPS(): number {
    return Math.round(this.fps);
  }

  getAverageRenderTime(): number {
    if (this.renderTimes.length === 0) return 0;
    const sum = this.renderTimes.reduce((a, b) => a + b, 0);
    return sum / this.renderTimes.length;
  }

  getMaxRenderTime(): number {
    return Math.max(...this.renderTimes, 0);
  }

  getMetrics(totalDataPoints: number, updateLatency: number): PerformanceMetrics {
    const memUsage = this.getMemoryUsage();

    return {
      fps: this.getFPS(),
      memoryUsage: memUsage,
      renderTime: this.getAverageRenderTime(),
      dataProcessingTime: 0, // Set by caller
      totalDataPoints,
      updateLatency,
    };
  }

  private getMemoryUsage(): number {
    if (typeof window === 'undefined') {
      return 0;
    }
    try {
      // @ts-ignore - performance.memory is not in standard types but available in some browsers
      const memory = (performance as any).memory;
      if (memory && memory.usedJSHeapSize) {
        return Math.round(memory.usedJSHeapSize / 1048576); // MB
      }
    } catch (e) {
      // Memory API not available
    }
    return 0;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Measure execution time of async functions
export async function measureAsync<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

// Measure execution time of sync functions
export function measureSync<T>(
  fn: () => T
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
}

// Throttle function calls
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): T {
  let lastCall = 0;

  return ((...args) => {
    const now = Date.now();
    if (now - lastCall >= delayMs) {
      lastCall = now;
      return fn(...args);
    }
  }) as T;
}

// Debounce function calls
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): T {
  let timeoutId: NodeJS.Timeout;

  return ((...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  }) as T;
}

// Request animation frame helper with fallback
export function createRAFScheduler() {
  let rafId: number | null = null;
  let isPending = false;

  const schedule = (callback: FrameRequestCallback) => {
    if (isPending) return;
    isPending = true;
    rafId = requestAnimationFrame((time) => {
      isPending = false;
      callback(time);
    });
  };

  const cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    isPending = false;
  };

  return { schedule, cancel };
}

// Batch updates to reduce re-renders
export function batchUpdates(callbacks: (() => void)[]): void {
  if (typeof window !== 'undefined' && window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      callbacks.forEach((cb) => cb());
    });
  } else {
    setTimeout(() => {
      callbacks.forEach((cb) => cb());
    }, 0);
  }
}

// Check if performance metrics meet targets
export function checkPerformanceTargets(metrics: PerformanceMetrics): {
  fps: boolean;
  latency: boolean;
  memory: boolean;
  all: boolean;
} {
  const fpsTarget = metrics.fps >= 50; // Acceptable minimum 50fps
  const latencyTarget = metrics.updateLatency <= 100; // < 100ms
  const memoryTarget = metrics.memoryUsage < 500; // < 500MB

  return {
    fps: fpsTarget,
    latency: latencyTarget,
    memory: memoryTarget,
    all: fpsTarget && latencyTarget && memoryTarget,
  };
}
