'use client';

import React, { useState, useCallback } from 'react';
import { TimeRange } from '@/lib/types';

interface TimeRangeSelectorProps {
  onRangeChange: (range: TimeRange) => void;
  defaultRange?: 'all' | '1h' | '5m' | '1m' | 'custom';
}

export function TimeRangeSelector({
  onRangeChange,
  defaultRange = 'all',
}: TimeRangeSelectorProps) {
  const [selected, setSelected] = useState<string>(defaultRange);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const handlePreset = useCallback(
    (preset: string) => {
      setSelected(preset);
      const now = Date.now();
      let start = now - 100000; // Default fallback

      switch (preset) {
        case '1m':
          start = now - 60000;
          break;
        case '5m':
          start = now - 300000;
          break;
        case '1h':
          start = now - 3600000;
          break;
        case 'all':
        default:
          start = now - 1000000; // ~16.6 minutes
      }

      onRangeChange({ start, end: now });
    },
    [onRangeChange]
  );

  const handleCustomChange = useCallback(() => {
    if (!customStart || !customEnd) return;

    const start = new Date(customStart).getTime();
    const end = new Date(customEnd).getTime();

    if (start < end) {
      onRangeChange({ start, end });
      setSelected('custom');
    }
  }, [customStart, customEnd, onRangeChange]);

  const presets = [
    { label: '1 minute', value: '1m' },
    { label: '5 minutes', value: '5m' },
    { label: '1 hour', value: '1h' },
    { label: 'All', value: 'all' },
  ];

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-4">Time Range</h3>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePreset(preset.value)}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              selected === preset.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="space-y-2 border-t pt-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Start Time</label>
          <input
            type="datetime-local"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">End Time</label>
          <input
            type="datetime-local"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <button
          onClick={handleCustomChange}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
