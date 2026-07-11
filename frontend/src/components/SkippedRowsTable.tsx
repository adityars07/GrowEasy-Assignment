'use client';

import React, { useState } from 'react';
import { SkippedRow } from '../lib/types';

interface SkippedRowsTableProps {
  skipped: SkippedRow[];
}

export default function SkippedRowsTable({ skipped }: SkippedRowsTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  if (skipped.length === 0) {
    return null;
  }

  const toggleRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="w-full">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-colors shadow-sm dark:shadow-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className="text-amber-800 dark:text-amber-300 font-medium text-sm">
            {skipped.length} skipped row{skipped.length !== 1 ? 's' : ''}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-amber-600 dark:text-amber-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-2 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
          <div className="overflow-auto max-h-[300px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider w-20">Row</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider w-24">Details</th>
                </tr>
              </thead>
              <tbody>
                {skipped.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <tr className={`border-b border-zinc-100 dark:border-zinc-900/50 last:border-b-0 ${idx % 2 === 0 ? 'bg-white dark:bg-zinc-950' : 'bg-zinc-50/50 dark:bg-zinc-900/20'} hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60`}>
                      <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 font-mono">{item.row_index + 1}</td>
                      <td className="px-4 py-3 text-amber-700 dark:text-amber-300/80 font-medium">{item.reason}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRow(idx)}
                          className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors underline underline-offset-2"
                        >
                          {expandedRows.has(idx) ? 'Hide' : 'Show'}
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(idx) && (
                      <tr className="bg-zinc-50/50 dark:bg-zinc-900/50">
                        <td colSpan={3} className="px-4 py-3">
                          <pre className="text-xs text-zinc-600 dark:text-zinc-400 overflow-auto max-w-full whitespace-pre-wrap font-mono p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                            {JSON.stringify(item.raw_row, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
