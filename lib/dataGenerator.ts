import { DataPoint, AggregatedData, TimeRange } from './types';

// Realistic sine wave generator with noise for time-series data
export function generateRealisticDataPoint(
  index: number,
  now: number,
  baseValue: number = 100,
  amplitude: number = 30,
  frequency: number = 0.01,
  noiseLevel: number = 5
): DataPoint {
  const categories = ['Category A', 'Category B', 'Category C', 'Category D'];
  const category = categories[index % categories.length];

  // Generate smooth sine wave with multiple frequencies for realistic patterns
  const mainWave = Math.sin(index * frequency) * amplitude;
  const harmonics = Math.sin(index * frequency * 0.5) * (amplitude * 0.3);
  const noise = (Math.random() - 0.5) * noiseLevel * 2;

  const value = baseValue + mainWave + harmonics + noise;

  return {
    timestamp: now - (10000 - index) * 100, // 100ms intervals, going back 1000 seconds
    value: Math.max(50, Math.min(150, value)), // Clamp between 50-150
    category,
    metadata: {
      source: 'simulated',
      quality: 100,
    },
  };
}

// Generate initial dataset of N points
export function generateInitialDataset(pointCount: number = 10000): DataPoint[] {
  const now = Date.now();
  const data: DataPoint[] = [];

  for (let i = 0; i < pointCount; i++) {
    data.push(
      generateRealisticDataPoint(i, now, 100, 30, 0.01, 5)
    );
  }

  return data.sort((a, b) => a.timestamp - b.timestamp);
}

// Generate streaming data - simulates real-time updates
export function generateStreamingDataBatch(
  count: number,
  startTimestamp: number,
  baseValue: number = 100,
  frequency: number = 0.01
): DataPoint[] {
  const data: DataPoint[] = [];
  const categories = ['Category A', 'Category B', 'Category C', 'Category D'];

  for (let i = 0; i < count; i++) {
    const timestamp = startTimestamp + i * 100; // 100ms intervals
    const dataIndex = Math.floor(timestamp / 100);

    const mainWave = Math.sin(dataIndex * frequency) * 30;
    const harmonics = Math.sin(dataIndex * frequency * 0.5) * 9;
    const noise = (Math.random() - 0.5) * 10;

    data.push({
      timestamp,
      value: Math.max(50, Math.min(150, baseValue + mainWave + harmonics + noise)),
      category: categories[i % categories.length],
      metadata: {
        source: 'stream',
        quality: 100,
      },
    });
  }

  return data;
}

// Aggregate data by time period for performance
export function aggregateDataByTime(
  data: DataPoint[],
  bucketSizeMs: number
): AggregatedData[] {
  if (data.length === 0) return [];

  const buckets = new Map<number, { sum: number; min: number; max: number; count: number; category: string }>();

  for (const point of data) {
    const bucketKey = Math.floor(point.timestamp / bucketSizeMs) * bucketSizeMs;

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, {
        sum: 0,
        min: point.value,
        max: point.value,
        count: 0,
        category: point.category,
      });
    }

    const bucket = buckets.get(bucketKey)!;
    bucket.sum += point.value;
    bucket.min = Math.min(bucket.min, point.value);
    bucket.max = Math.max(bucket.max, point.value);
    bucket.count++;
  }

  return Array.from(buckets.entries())
    .map(([timestamp, bucket]) => ({
      timestamp,
      value: bucket.sum / bucket.count,
      min: bucket.min,
      max: bucket.max,
      count: bucket.count,
      category: bucket.category,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

// Filter data by time range
export function filterDataByTimeRange(
  data: DataPoint[],
  timeRange: TimeRange
): DataPoint[] {
  return data.filter(
    (point) => point.timestamp >= timeRange.start && point.timestamp <= timeRange.end
  );
}

// Filter data by categories
export function filterDataByCategories(
  data: DataPoint[],
  categories: string[]
): DataPoint[] {
  if (categories.length === 0) return data;
  return data.filter((point) => categories.includes(point.category));
}

// Filter data by value range
export function filterDataByValueRange(
  data: DataPoint[],
  minValue: number,
  maxValue: number
): DataPoint[] {
  return data.filter((point) => point.value >= minValue && point.value <= maxValue);
}

// Calculate statistics for a dataset
export function calculateDatasetStats(data: DataPoint[]) {
  if (data.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      stdDev: 0,
    };
  }

  const values = data.map((p) => p.value);
  const sorted = [...values].sort((a, b) => a - b);

  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const median = sorted[Math.floor(sorted.length / 2)];

  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return { min, max, average, median, stdDev };
}

// Generate heatmap data from time-series
export function generateHeatmapData(
  data: DataPoint[],
  timeInterval: number = 60000, // 1 minute buckets
  categoryInterval: number = 1
) {
  const heatmapData: { time: number; category: string; value: number }[] = [];
  const categories = Array.from(new Set(data.map((p) => p.category)));

  const timeBuckets = new Map<number, Map<string, number[]>>();

  for (const point of data) {
    const timeBucket = Math.floor(point.timestamp / timeInterval);
    if (!timeBuckets.has(timeBucket)) {
      timeBuckets.set(timeBucket, new Map());
    }

    const categoryMap = timeBuckets.get(timeBucket)!;
    if (!categoryMap.has(point.category)) {
      categoryMap.set(point.category, []);
    }

    categoryMap.get(point.category)!.push(point.value);
  }

  for (const [timeBucket, categoryMap] of timeBuckets) {
    for (const [category, values] of categoryMap) {
      const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
      heatmapData.push({
        time: timeBucket * timeInterval,
        category,
        value: avgValue,
      });
    }
  }

  return heatmapData;
}

// Downsample data for rendering optimization
export function downsampleData(data: DataPoint[], targetPoints: number = 1000): DataPoint[] {
  if (data.length <= targetPoints) return data;

  const samplingRate = Math.ceil(data.length / targetPoints);
  const sampled: DataPoint[] = [];

  for (let i = 0; i < data.length; i += samplingRate) {
    sampled.push(data[i]);
  }

  return sampled;
}
