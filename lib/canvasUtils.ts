import { ChartDimensions, DataPoint } from './types';

export interface Scale {
  min: number;
  max: number;
  range: number;
  scale: (value: number) => number;
  unscale: (pixel: number) => number;
}

// Create a linear scale for data to pixel conversion
export function createLinearScale(
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number
): Scale {
  const domainRange = domainMax - domainMin;
  const pixelRange = rangeMax - rangeMin;

  return {
    min: domainMin,
    max: domainMax,
    range: domainRange,
    scale: (value: number) => {
      if (domainRange === 0) return rangeMin;
      return ((value - domainMin) / domainRange) * pixelRange + rangeMin;
    },
    unscale: (pixel: number) => {
      if (pixelRange === 0) return domainMin;
      return ((pixel - rangeMin) / pixelRange) * domainRange + domainMin;
    },
  };
}

// Create a time scale (domain is timestamps, range is pixels)
export function createTimeScale(
  minTime: number,
  maxTime: number,
  width: number,
  padding: number
): Scale {
  return createLinearScale(minTime, maxTime, padding, width - padding);
}

// Create a value scale (domain is data values, range is pixels for Y-axis)
export function createValueScale(
  minValue: number,
  maxValue: number,
  height: number,
  padding: number
): Scale {
  // Y-axis is inverted (top is 0, bottom is height)
  return createLinearScale(minValue, maxValue, height - padding, padding);
}

// Draw axes on canvas
export function drawAxes(
  ctx: CanvasRenderingContext2D,
  dimensions: ChartDimensions,
  xScale: Scale,
  yScale: Scale,
  color: string = '#666'
): void {
  const { width, height, padding } = dimensions;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.fillStyle = color;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';

  // X-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  // Y-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.stroke();

  // X-axis labels
  const xLabelCount = 6;
  for (let i = 0; i < xLabelCount; i++) {
    const value = xScale.min + (xScale.range / (xLabelCount - 1)) * i;
    const x = xScale.scale(value);
    const label = new Date(value).toLocaleTimeString();

    ctx.fillText(label, x, height - padding.bottom + 20);
  }

  // Y-axis labels
  const yLabelCount = 5;
  for (let i = 0; i < yLabelCount; i++) {
    const value = yScale.min + (yScale.range / (yLabelCount - 1)) * i;
    const y = yScale.scale(value);
    const label = value.toFixed(1);

    ctx.textAlign = 'right';
    ctx.fillText(label, padding.left - 10, y + 4);
  }
}

// Draw grid on canvas
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  dimensions: ChartDimensions,
  xScale: Scale,
  yScale: Scale,
  gridColor: string = '#eee'
): void {
  const { width, height, padding } = dimensions;

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  // Vertical grid lines
  const xLabelCount = 6;
  for (let i = 0; i < xLabelCount; i++) {
    const value = xScale.min + (xScale.range / (xLabelCount - 1)) * i;
    const x = xScale.scale(value);

    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
  }

  // Horizontal grid lines
  const yLabelCount = 5;
  for (let i = 0; i < yLabelCount; i++) {
    const value = yScale.min + (yScale.range / (yLabelCount - 1)) * i;
    const y = yScale.scale(value);

    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }
}

// Draw line chart on canvas
export function drawLineChart(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  xScale: Scale,
  yScale: Scale,
  color: string = '#2563eb',
  lineWidth: number = 2
): void {
  if (data.length === 0) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();

  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    const x = xScale.scale(point.timestamp);
    const y = yScale.scale(point.value);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
}

// Draw bar chart on canvas
export function drawBarChart(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  xScale: Scale,
  yScale: Scale,
  color: string = '#10b981',
  barWidth: number = 4
): void {
  if (data.length === 0) return;

  ctx.fillStyle = color;

  for (const point of data) {
    const x = xScale.scale(point.timestamp);
    const y = yScale.scale(point.value);
    const baselineY = yScale.scale(yScale.min);
    const height = baselineY - y;

    ctx.fillRect(x - barWidth / 2, y, barWidth, height);
  }
}

// Draw scatter plot on canvas
export function drawScatterPlot(
  ctx: CanvasRenderingContext2D,
  data: DataPoint[],
  xScale: Scale,
  yScale: Scale,
  color: string = '#f59e0b',
  pointSize: number = 4
): void {
  if (data.length === 0) return;

  ctx.fillStyle = color;

  for (const point of data) {
    const x = xScale.scale(point.timestamp);
    const y = yScale.scale(point.value);

    ctx.beginPath();
    ctx.arc(x, y, pointSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw heatmap on canvas
export function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  data: Array<{ x: number; y: number; value: number }>,
  xScale: Scale,
  yScale: Scale,
  cellWidth: number,
  cellHeight: number,
  colorScale: (value: number) => string
): void {
  for (const point of data) {
    const x = xScale.scale(point.x);
    const y = yScale.scale(point.y);
    const color = colorScale(point.value);

    ctx.fillStyle = color;
    ctx.fillRect(x - cellWidth / 2, y - cellHeight / 2, cellWidth, cellHeight);
  }
}

// Get color from value using a gradient
export function valueToColor(
  value: number,
  minValue: number,
  maxValue: number,
  colorScheme: 'hot' | 'cool' | 'viridis' = 'hot'
): string {
  const normalized = (value - minValue) / (maxValue - minValue);

  if (colorScheme === 'hot') {
    if (normalized < 0.5) {
      const r = Math.round(normalized * 2 * 255);
      const g = 0;
      const b = Math.round(255 - normalized * 2 * 255);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const r = 255;
      const g = Math.round((normalized - 0.5) * 2 * 255);
      const b = 0;
      return `rgb(${r}, ${g}, ${b})`;
    }
  } else if (colorScheme === 'cool') {
    const h = (1 - normalized) * 240; // Blue to Red
    return `hsl(${h}, 100%, 50%)`;
  } else {
    // Viridis approximation
    const colors = ['#440154', '#31688e', '#35b779', '#fde724'];
    const index = Math.floor(normalized * (colors.length - 1));
    return colors[index];
  }
}

// Clear canvas with optional background color
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgColor: string = '#fff'
): void {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
}

// Set high DPI for canvas
export function setCanvasResolution(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): void {
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }

  // Set CSS size
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

// Get device pixel ratio
export function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

// Detect if point is within bounds
export function isPointInBounds(
  x: number,
  y: number,
  bounds: { left: number; top: number; right: number; bottom: number }
): boolean {
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
}
