// Core data types for the performance dashboard

export interface DataPoint {
  timestamp: number;
  value: number;
  category: string;
  x?: number;
  y?: number;
  metadata?: Record<string, any>;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'scatter' | 'heatmap';
  dataKey: string;
  color: string;
  visible: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  dataProcessingTime: number;
  totalDataPoints: number;
  updateLatency: number;
}

export interface AggregatedData {
  timestamp: number;
  value: number;
  min: number;
  max: number;
  count: number;
  category: string;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface DataStreamState {
  data: DataPoint[];
  isStreaming: boolean;
  lastUpdateTime: number;
  totalPointsReceived: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface SeriesConfig {
  name: string;
  type: 'line' | 'bar' | 'scatter';
  color: string;
  visible: boolean;
  yAxis?: 'left' | 'right';
}

export interface FilterOptions {
  categories: string[];
  minValue?: number;
  maxValue?: number;
  timeRange?: TimeRange;
}
