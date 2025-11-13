'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { DataPoint, FilterOptions, TimeRange } from '@/lib/types';

interface DataContextType {
  data: DataPoint[];
  isStreaming: boolean;
  filters: FilterOptions;
  timeRange: TimeRange;
  setFilters: (filters: FilterOptions) => void;
  setTimeRange: (range: TimeRange) => void;
  addData: (data: DataPoint[]) => void;
  pauseStream: () => void;
  resumeStream: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
  initialData: DataPoint[];
  onDataStreamUpdate?: (data: DataPoint[]) => void;
}

export function DataProvider({
  children,
  initialData,
  onDataStreamUpdate,
}: DataProviderProps) {
  const [data, setData] = React.useState<DataPoint[]>(initialData);
  const [isStreaming, setIsStreaming] = React.useState(true);
  const [filters, setFilters] = React.useState<FilterOptions>({
    categories: Array.from(new Set(initialData.map((p) => p.category))),
  });
  const [timeRange, setTimeRange] = React.useState<TimeRange>({
    start: initialData.length > 0 ? initialData[0].timestamp : Date.now() - 100000,
    end: Date.now(),
  });

  const addData = React.useCallback((newData: DataPoint[]) => {
    setData((prev) => {
      const combined = [...prev, ...newData];
      const trimmed = combined.slice(-10000); // Keep last 10k points
      onDataStreamUpdate?.(trimmed);
      return trimmed;
    });
  }, [onDataStreamUpdate]);

  const value: DataContextType = {
    data,
    isStreaming,
    filters,
    timeRange,
    setFilters,
    setTimeRange,
    addData,
    pauseStream: () => setIsStreaming(false),
    resumeStream: () => setIsStreaming(true),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within DataProvider');
  }
  return context;
}
