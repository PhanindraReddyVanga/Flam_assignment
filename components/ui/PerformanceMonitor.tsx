'use client';

import React from 'react';
import { PerformanceMetrics } from '@/lib/types';

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  showDetails?: boolean;
}

export function PerformanceMonitor({
  metrics,
  showDetails = true,
}: PerformanceMonitorProps) {
  const getStatusColor = (fps: number): string => {
    if (fps >= 50) return 'text-green-600';
    if (fps >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMemoryStatus = (memory: number): string => {
    if (memory < 100) return 'text-green-600';
    if (memory < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 border border-gray-200 font-mono text-sm z-50 min-w-fit">
      <div className="mb-3">
        <div className="text-gray-700 font-semibold">Performance Metrics</div>
      </div>

      <div className={`flex items-baseline gap-2 mb-2 ${getStatusColor(metrics.fps)}`}>
        <span className="font-bold text-lg">{metrics.fps}</span>
        <span className="text-gray-600">FPS</span>
      </div>

      {showDetails && (
        <>
          <div className={`flex items-baseline gap-2 mb-2 ${getMemoryStatus(metrics.memoryUsage)}`}>
            <span className="font-bold">{metrics.memoryUsage}</span>
            <span className="text-gray-600">MB</span>
          </div>

          <div className="text-gray-600 mb-2">
            <span>{Math.round(metrics.renderTime * 10) / 10}</span>
            <span className="text-xs ml-1">ms/frame</span>
          </div>

          <div className="text-gray-600 mb-2">
            <span>{Math.round(metrics.updateLatency * 10) / 10}</span>
            <span className="text-xs ml-1">ms latency</span>
          </div>

          <div className="text-gray-600 border-t pt-2">
            <span className="text-xs">{metrics.totalDataPoints.toLocaleString()}</span>
            <span className="text-xs ml-1">points</span>
          </div>
        </>
      )}

      {!showDetails && (
        <div className="text-gray-600 text-xs">
          {metrics.memoryUsage}MB • {Math.round(metrics.renderTime * 10) / 10}ms
        </div>
      )}
    </div>
  );
}
