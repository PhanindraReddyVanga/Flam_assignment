'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { DataPoint } from '@/lib/types';
import { generateStreamingDataBatch } from '@/lib/dataGenerator';

interface UseDataStreamOptions {
  initialData: DataPoint[];
  updateInterval?: number;
  batchSize?: number;
  onDataUpdate?: (data: DataPoint[]) => void;
}

export function useDataStream({
  initialData,
  updateInterval = 100,
  batchSize = 10,
  onDataUpdate,
}: UseDataStreamOptions) {
  const [data, setData] = useState<DataPoint[]>(initialData);
  const [isStreaming, setIsStreaming] = useState(true);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimestampRef = useRef<number>(
    initialData.length > 0 ? initialData[initialData.length - 1].timestamp : Date.now()
  );

  const addData = useCallback((newData: DataPoint[]) => {
    setData((prev) => {
      // Keep only last 10000 points to manage memory
      const combined = [...prev, ...newData];
      const trimmed = combined.slice(-10000);
      onDataUpdate?.(trimmed);
      return trimmed;
    });

    lastTimestampRef.current = newData[newData.length - 1].timestamp;
  }, [onDataUpdate]);

  const startStream = useCallback(() => {
    if (streamIntervalRef.current) return;

    setIsStreaming(true);

    streamIntervalRef.current = setInterval(() => {
      const newData = generateStreamingDataBatch(
        batchSize,
        lastTimestampRef.current + updateInterval
      );
      addData(newData);
    }, updateInterval);
  }, [updateInterval, batchSize, addData]);

  const stopStream = useCallback(() => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const pauseStream = useCallback(() => {
    stopStream();
  }, [stopStream]);

  const resumeStream = useCallback(() => {
    startStream();
  }, [startStream]);

  useEffect(() => {
    startStream();
    return () => stopStream();
  }, [startStream, stopStream]);

  return {
    data,
    isStreaming,
    startStream,
    stopStream,
    pauseStream,
    resumeStream,
    addData,
  };
}
