'use client';

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { DataPoint, ChartDimensions } from '@/lib/types';
import {
  createTimeScale,
  createValueScale,
  drawAxes,
  drawGrid,
  drawBarChart,
  clearCanvas,
  setCanvasResolution,
} from '@/lib/canvasUtils';

interface BarChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showGrid?: boolean;
  responsive?: boolean;
  onRenderTime?: (time: number) => void;
}

export const BarChart = React.memo(
  ({
    data,
    width = 800,
    height = 400,
    color = '#10b981',
    showGrid = true,
    responsive = true,
    onRenderTime,
  }: BarChartProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = React.useState({ width, height });

    const chartDimensions: ChartDimensions = useMemo(
      () => ({
        width: dimensions.width,
        height: dimensions.height,
        padding: {
          top: 20,
          right: 20,
          bottom: 40,
          left: 50,
        },
      }),
      [dimensions]
    );

    useEffect(() => {
      if (!responsive || !containerRef.current) return;

      const handleResize = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setDimensions({ width: rect.width, height: rect.height });
        }
      };

      const observer = new ResizeObserver(handleResize);
      observer.observe(containerRef.current);

      return () => observer.disconnect();
    }, [responsive]);

    const scales = useMemo(() => {
      if (data.length === 0) {
        const now = Date.now();
        return {
          xScale: createTimeScale(now - 100000, now, dimensions.width, chartDimensions.padding.left),
          yScale: createValueScale(0, 100, dimensions.height, chartDimensions.padding.bottom),
        };
      }

      const timestamps = data.map((p) => p.timestamp);
      const values = data.map((p) => p.value);

      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      const minValue = 0; // Bars start at 0
      const maxValue = Math.max(...values);

      const valuePadding = maxValue * 0.1 || 10;

      return {
        xScale: createTimeScale(
          minTime,
          maxTime,
          dimensions.width,
          chartDimensions.padding.left + chartDimensions.padding.right
        ),
        yScale: createValueScale(
          minValue,
          maxValue + valuePadding,
          dimensions.height,
          chartDimensions.padding.top + chartDimensions.padding.bottom
        ),
      };
    }, [data, dimensions, chartDimensions]);

    const render = useCallback(() => {
      if (!canvasRef.current) return;

      const renderStart = performance.now();
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      clearCanvas(ctx, dimensions.width, dimensions.height, '#fff');

      if (showGrid) {
        drawGrid(ctx, chartDimensions, scales.xScale, scales.yScale);
      }

      drawAxes(ctx, chartDimensions, scales.xScale, scales.yScale);
      
      // Downsample if too many points
      const displayData = data.length > 1000 ? data.filter((_, i) => i % 10 === 0) : data;
      drawBarChart(ctx, displayData, scales.xScale, scales.yScale, color, 8);

      const renderTime = performance.now() - renderStart;
      onRenderTime?.(renderTime);
    }, [dimensions, chartDimensions, scales, data, color, showGrid, onRenderTime]);

    useEffect(() => {
      if (!canvasRef.current) return;

      setCanvasResolution(canvasRef.current, dimensions.width, dimensions.height);
      render();
    }, [dimensions, render]);

    return (
      <div ref={containerRef} className="w-full h-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full border border-gray-200 rounded-lg bg-white"
          style={{ display: 'block' }}
        />
      </div>
    );
  }
);

BarChart.displayName = 'BarChart';
