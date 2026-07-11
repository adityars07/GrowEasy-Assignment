'use client';

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CrmRecord, CRM_COLUMNS, CRM_COLUMN_LABELS } from '../lib/types';

interface ResultsTableProps {
  records: CrmRecord[];
}

export default function ResultsTable({ records }: ResultsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 20,
  });

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center shadow-sm">
        <p className="text-zinc-500 dark:text-zinc-400">No records were imported.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{records.length.toLocaleString()}</span> CRM records
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
        <div
          ref={parentRef}
          className="overflow-auto max-h-[500px]"
        >
          <div style={{ minWidth: `${CRM_COLUMNS.length * 160}px` }}>
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 flex bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex-shrink-0 w-14 px-3 py-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800">
                #
              </div>
              {CRM_COLUMNS.map((col) => (
                <div
                  key={col}
                  className="flex-shrink-0 w-40 px-3 py-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400/80 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 truncate"
                  title={CRM_COLUMN_LABELS[col]}
                >
                  {CRM_COLUMN_LABELS[col]}
                </div>
              ))}
            </div>

            {/* Virtual Rows */}
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const record = records[virtualRow.index];
                const isEven = virtualRow.index % 2 === 0;

                return (
                  <div
                    key={virtualRow.index}
                    className={`absolute w-full flex border-b border-zinc-100 dark:border-zinc-900/50 last:border-b-0 ${
                      isEven ? 'bg-white dark:bg-zinc-950' : 'bg-zinc-50/50 dark:bg-zinc-900/20'
                    } hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-colors`}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="flex-shrink-0 w-14 px-3 py-2.5 text-xs text-zinc-400 dark:text-zinc-600 font-mono border-r border-zinc-200 dark:border-zinc-800/50">
                      {virtualRow.index + 1}
                    </div>
                    {CRM_COLUMNS.map((col) => {
                      const value = record[col];
                      return (
                        <div
                          key={col}
                          className="flex-shrink-0 w-40 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800/50 last:border-r-0 truncate"
                          title={value ?? ''}
                        >
                          {value || <span className="text-zinc-400 dark:text-zinc-700 italic">—</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
