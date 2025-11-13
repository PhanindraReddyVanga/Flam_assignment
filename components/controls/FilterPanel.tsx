'use client';

import React, { useCallback, useState } from 'react';

interface FilterPanelProps {
  categories: string[];
  onCategoryFilter: (categories: string[]) => void;
  minValue?: number;
  maxValue?: number;
  onValueFilter?: (min: number, max: number) => void;
}

export function FilterPanel({
  categories,
  onCategoryFilter,
  minValue = 50,
  maxValue = 150,
  onValueFilter,
}: FilterPanelProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(categories)
  );
  const [minVal, setMinVal] = useState(minValue);
  const [maxVal, setMaxVal] = useState(maxValue);

  const handleCategoryChange = useCallback(
    (category: string) => {
      const updated = new Set(selectedCategories);
      if (updated.has(category)) {
        updated.delete(category);
      } else {
        updated.add(category);
      }
      setSelectedCategories(updated);
      onCategoryFilter(Array.from(updated));
    },
    [selectedCategories, onCategoryFilter]
  );

  const handleValueChange = useCallback(
    (type: 'min' | 'max', value: number) => {
      if (type === 'min') {
        setMinVal(value);
      } else {
        setMaxVal(value);
      }
      onValueFilter?.(type === 'min' ? value : minVal, type === 'max' ? value : maxVal);
    },
    [minVal, maxVal, onValueFilter]
  );

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>

      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Categories</label>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedCategories.has(cat)}
                onChange={() => handleCategoryChange(cat)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Min Value: {minVal.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="200"
            step="1"
            value={minVal}
            onChange={(e) => handleValueChange('min', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Max Value: {maxVal.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="200"
            step="1"
            value={maxVal}
            onChange={(e) => handleValueChange('max', Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
