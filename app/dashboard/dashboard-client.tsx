'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DataPoint, TimeRange, FilterOptions } from '@/lib/types';
import { useDataStream } from '@/hooks/useDataStream';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { filterDataByTimeRange, filterDataByCategories } from '@/lib/dataGenerator';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { ScatterPlot } from '@/components/charts/ScatterPlot';
import { Heatmap } from '@/components/charts/Heatmap';
import { FilterPanel } from '@/components/controls/FilterPanel';
import { TimeRangeSelector } from '@/components/controls/TimeRangeSelector';
import { DataTable } from '@/components/ui/DataTable';
import { PerformanceMonitor } from '@/components/ui/PerformanceMonitor';

interface DashboardClientProps {
  initialData: DataPoint[];
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const { data, isStreaming, pauseStream, resumeStream } = useDataStream({
    initialData,
    updateInterval: 100,
    batchSize: 10,
  });

  const { metrics, recordUpdate } = usePerformanceMonitor({
    enabled: true,
    updateInterval: 1000,
    totalDataPoints: data.length,
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    Array.from(new Set(initialData.map((p) => p.category)))
  );
  const [valueRange, setValueRange] = useState<{ min: number; max: number }>({
    min: 50,
    max: 150,
  });
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: initialData[0]?.timestamp || Date.now() - 100000,
    end: Date.now(),
  });
  const [activeChart, setActiveChart] = useState<'all' | 'line' | 'bar' | 'scatter' | 'heatmap'>(
    'all'
  );

  // Filter data based on current filters
  const filteredData = React.useMemo(() => {
    recordUpdate();

    let filtered = [...data];

    // Filter by time range
    filtered = filterDataByTimeRange(filtered, timeRange);

    // Filter by categories
    filtered = filterDataByCategories(filtered, selectedCategories);

    // Filter by value range
    filtered = filtered.filter(
      (p) => p.value >= valueRange.min && p.value <= valueRange.max
    );

    return filtered;
  }, [data, timeRange, selectedCategories, valueRange, recordUpdate]);

  const handleCategoryFilter = useCallback((categories: string[]) => {
    setSelectedCategories(categories);
  }, []);

  const handleValueFilter = useCallback((min: number, max: number) => {
    setValueRange({ min, max });
  }, []);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  const handleStressTest = useCallback(() => {
    // This would be called to stress test the dashboard
    console.log('Stress test initiated with', data.length, 'points');
  }, [data.length]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Performance Dashboard</h1>
        <p className="text-gray-400">
          Real-time visualization of {data.length.toLocaleString()} data points
        </p>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
          <FilterPanel
            categories={Array.from(new Set(data.map((p) => p.category)))}
            onCategoryFilter={handleCategoryFilter}
            minValue={50}
            maxValue={150}
            onValueFilter={handleValueFilter}
          />
        </div>

        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
          <TimeRangeSelector onRangeChange={handleTimeRangeChange} />
        </div>
      </div>

      {/* Chart Selection */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {[
          { label: 'All Charts', value: 'all' as const },
          { label: 'Line', value: 'line' as const },
          { label: 'Bar', value: 'bar' as const },
          { label: 'Scatter', value: 'scatter' as const },
          { label: 'Heatmap', value: 'heatmap' as const },
        ].map((chart) => (
          <button
            key={chart.value}
            onClick={() => setActiveChart(chart.value)}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              activeChart === chart.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {chart.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={isStreaming ? pauseStream : resumeStream}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            isStreaming
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isStreaming ? 'Pause Stream' : 'Resume Stream'}
        </button>

        <button
          onClick={handleStressTest}
          className="px-4 py-2 rounded font-medium bg-orange-600 hover:bg-orange-700 transition-colors"
        >
          Stress Test
        </button>

        <span className="text-gray-400 ml-auto">
          Filtered: {filteredData.length.toLocaleString()} / {data.length.toLocaleString()} points
        </span>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {(activeChart === 'all' || activeChart === 'line') && (
          <div className="bg-gray-800 rounded-lg p-4 min-h-96">
            <h2 className="text-xl font-semibold mb-4">Line Chart</h2>
            <LineChart
              data={filteredData}
              width={100}
              height={300}
              color="#3b82f6"
              responsive
            />
          </div>
        )}

        {(activeChart === 'all' || activeChart === 'bar') && (
          <div className="bg-gray-800 rounded-lg p-4 min-h-96">
            <h2 className="text-xl font-semibold mb-4">Bar Chart</h2>
            <BarChart
              data={filteredData}
              width={100}
              height={300}
              color="#10b981"
              responsive
            />
          </div>
        )}

        {(activeChart === 'all' || activeChart === 'scatter') && (
          <div className="bg-gray-800 rounded-lg p-4 min-h-96">
            <h2 className="text-xl font-semibold mb-4">Scatter Plot</h2>
            <ScatterPlot
              data={filteredData}
              width={100}
              height={300}
              color="#f59e0b"
              responsive
            />
          </div>
        )}

        {(activeChart === 'all' || activeChart === 'heatmap') && (
          <div className="bg-gray-800 rounded-lg p-4 min-h-96">
            <h2 className="text-xl font-semibold mb-4">Heatmap</h2>
            <Heatmap
              data={filteredData}
              width={100}
              height={300}
              colorScheme="viridis"
              responsive
            />
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-gray-800 rounded-lg p-4 mb-8">
        <h2 className="text-xl font-semibold mb-4">Data Table</h2>
        <div className="bg-gray-900 rounded">
          <DataTable data={filteredData} />
        </div>
      </div>

      {/* Performance Monitor */}
      <PerformanceMonitor metrics={metrics} />
    </div>
  );
}
