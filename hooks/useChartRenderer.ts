'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { ChartDimensions, DataPoint } from '@/lib/types';
import {
  createTimeScale,
  createValueScale,
  drawAxes,
  drawGrid,
  drawLineChart,
  clearCanvas,
  setCanvasResolution,
  Scale,
} from '@/lib/canvasUtils';

interface UseChartRendererOptions {
  width: number;
  height: number;
  data: DataPoint[];
  type?: 'line' | 'bar' | 'scatter' | 'heatmap';
  color?: string;
  onRenderComplete?: (renderTime: number) => void;
}

export function useChartRenderer({
  width,
  height,
  data,
  type = 'line',
  color = '#2563eb',
  onRenderComplete,
}: UseChartRendererOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const rafRef = useRef<number | null>(null);

  const dimensions: ChartDimensions = {
    width,
    height,
    padding: {
      top: 20,
      right: 20,
      bottom: 40,
      left: 50,
    },
  };

  const getScales = useCallback((dataPoints: DataPoint[]) => {
    if (dataPoints.length === 0) {
      const now = Date.now();
      const xScale = createTimeScale(now - 100000, now, width, dimensions.padding.left);
      const yScale = createValueScale(0, 100, height, dimensions.padding.bottom);
      return { xScale, yScale };
    }

    const timestamps = dataPoints.map((p) => p.timestamp);
    const values = dataPoints.map((p) => p.value);

    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Add 10% padding
    const valuePadding = (maxValue - minValue) * 0.1 || 10;

    const xScale = createTimeScale(
      minTime,
      maxTime,
      width,
      dimensions.padding.left + dimensions.padding.right
    );
    const yScale = createValueScale(
      minValue - valuePadding,
      maxValue + valuePadding,
      height,
      dimensions.padding.top + dimensions.padding.bottom
    );

    return { xScale, yScale };
  }, [width, height, dimensions]);

  const render = useCallback(() => {
    if (!canvasRef.current || data.length === 0) return;

    const renderStart = performance.now();
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    clearCanvas(ctx, width, height, '#fff');

    // Get scales
    const { xScale, yScale } = getScales(data);

    // Draw grid and axes
    drawGrid(ctx, dimensions, xScale, yScale);
    drawAxes(ctx, dimensions, xScale, yScale);

    // Draw data based on type
    if (type === 'line') {
      drawLineChart(ctx, data, xScale, yScale, color, 2);
    }

    const renderTime = performance.now() - renderStart;
    onRenderComplete?.(renderTime);
  }, [data, type, color, width, height, dimensions, getScales, onRenderComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set up canvas with high DPI
    setCanvasResolution(canvas, width, height);

    // Initial render
    render();
  }, [width, height, render]);

  return { canvasRef };
}
