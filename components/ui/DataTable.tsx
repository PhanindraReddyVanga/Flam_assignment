'use client';

import React, { useMemo, useCallback } from 'react';
import { DataPoint } from '@/lib/types';
import { useVirtualization } from '@/hooks/useVirtualization';

interface DataTableProps {
  data: DataPoint[];
  pageSize?: number;
}

export function DataTable({ data, pageSize = 20 }: DataTableProps) {
  const containerHeight = 400;
  const itemHeight = 40;

  const { state, handleScroll } = useVirtualization({
    items: data,
    itemHeight,
    containerHeight,
    overscan: 10,
  });

  const displayItems = state.visibleItems;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-4 gap-4 px-4 py-3 font-semibold text-sm">
        <div>Time</div>
        <div>Value</div>
        <div>Category</div>
        <div>Quality</div>
      </div>

      <div
        onScroll={handleScroll}
        style={{
          height: containerHeight,
          overflow: 'auto',
        }}
        className="relative"
      >
        <div
          style={{
            height: data.length * itemHeight,
            position: 'relative',
          }}
        >
          <div
            style={{
              transform: `translateY(${state.offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {displayItems.map((item, index) => (
              <div
                key={`${item.timestamp}-${index}`}
                className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 text-sm"
                style={{ height: itemHeight }}
              >
                <div className="text-gray-600 truncate">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </div>
                <div className="font-medium">{item.value.toFixed(2)}</div>
                <div className="text-gray-600">{item.category}</div>
                <div className="text-gray-600">{item.metadata?.quality || 'N/A'}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-600">
        Showing {state.startIndex + 1} to {Math.min(state.endIndex, data.length)} of{' '}
        {data.length} records
      </div>
    </div>
  );
}
