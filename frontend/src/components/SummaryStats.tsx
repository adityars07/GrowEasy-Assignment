'use client';

import React from 'react';

interface SummaryStatsProps {
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
}

export default function SummaryStats({ totalRows, totalImported, totalSkipped }: SummaryStatsProps) {
  const stats = [
    {
      label: 'Total Uploaded',
      value: totalRows,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      ),
    },
    {
      label: 'Successfully Imported',
      value: totalImported,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Skipped',
      value: totalSkipped,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`relative overflow-hidden rounded-xl border ${stat.borderColor} ${stat.bgColor} p-5`}
        >
          <div className="flex items-center gap-3">
            <div className={`${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color} mt-0.5 tabular-nums`}>
                {stat.value.toLocaleString()}
              </p>
            </div>
          </div>
          {/* Decorative gradient */}
          <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${stat.bgColor} opacity-50 blur-2xl`} />
        </div>
      ))}
    </div>
  );
}
