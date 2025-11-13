'use client';

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { DataPoint, ChartDimensions } from '@/lib/types';
import {
  createTimeScale,
  createValueScale,
  drawAxes,
  drawHeatmap,
  clearCanvas,
  setCanvasResolution,
  valueToColor,
} from '@/lib/canvasUtils';

interface HeatmapProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  colorScheme?: 'hot' | 'cool' | 'viridis';
  responsive?: boolean;
  onRenderTime?: (time: number) => void;
}

export const Heatmap = React.memo(
  ({
    data,
    width = 800,
    height = 400,
    colorScheme = 'hot',
    responsive = true,
    onRenderTime,
  }: HeatmapProps) => {
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

    // Aggregate data into heatmap grid
    const heatmapGridData = useMemo(() => {
      if (data.length === 0) return [];

      const categories = Array.from(new Set(data.map((p) => p.category)));
      const timeBucketMs = 5000; // 5 second buckets

      const grid: Array<{ x: number; y: number; value: number }> = [];

      const categoryMap = new Map<string, number>();
      for (let i = 0; i < categories.length; i++) {
        categoryMap.set(categories[i], i);
      }

      // Group by time bucket and category
      const buckets = new Map<number, Map<string, number[]>>();

      for (const point of data) {
        const bucket = Math.floor(point.timestamp / timeBucketMs);

        if (!buckets.has(bucket)) {
          buckets.set(bucket, new Map());
        }

        const categoryBucket = buckets.get(bucket)!;
        if (!categoryBucket.has(point.category)) {
          categoryBucket.set(point.category, []);
        }

        categoryBucket.get(point.category)!.push(point.value);
      }

      // Build grid
      for (const [bucket, categoryMap] of buckets) {
        for (const [category, values] of categoryMap) {
          const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
          grid.push({
            x: bucket * timeBucketMs,
            y: categories.indexOf(category),
            value: avgValue,
          });
        }
      }

      return grid;
    }, [data]);

    const scales = useMemo(() => {
      if (heatmapGridData.length === 0) {
        const now = Date.now();
        return {
          xScale: createTimeScale(now - 100000, now, dimensions.width, chartDimensions.padding.left),
          yScale: createValueScale(0, 3, dimensions.height, chartDimensions.padding.bottom),
        };
      }

      const xValues = heatmapGridData.map((p) => p.x);
      const yValues = heatmapGridData.map((p) => p.y);

      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const minY = Math.min(...yValues);
      const maxY = Math.max(...yValues);

      return {
        xScale: createTimeScale(
          minX,
          maxX,
          dimensions.width,
          chartDimensions.padding.left + chartDimensions.padding.right
        ),
        yScale: createValueScale(
          minY - 0.5,
          maxY + 0.5,
          dimensions.height,
          chartDimensions.padding.top + chartDimensions.padding.bottom
        ),
      };
    }, [heatmapGridData, dimensions, chartDimensions]);

    const valueRange = useMemo(() => {
      if (heatmapGridData.length === 0) return { min: 0, max: 100 };

      const values = heatmapGridData.map((p) => p.value);
      return {
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }, [heatmapGridData]);

    const render = useCallback(() => {
      if (!canvasRef.current) return;

      const renderStart = performance.now();
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      clearCanvas(ctx, dimensions.width, dimensions.height, '#fff');

      // Draw heatmap cells
      const cellWidth = 20;
      const cellHeight = 20;

      drawHeatmap(
        ctx,
        heatmapGridData,
        scales.xScale,
        scales.yScale,
        cellWidth,
        cellHeight,
        (value) => valueToColor(value, valueRange.min, valueRange.max, colorScheme)
      );

      drawAxes(ctx, chartDimensions, scales.xScale, scales.yScale);

      const renderTime = performance.now() - renderStart;
      onRenderTime?.(renderTime);
    }, [dimensions, chartDimensions, scales, heatmapGridData, valueRange, colorScheme, onRenderTime]);

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

Heatmap.displayName = 'Heatmap';
