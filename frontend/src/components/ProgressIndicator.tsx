'use client';

import React from 'react';

interface ProgressIndicatorProps {
  status: string;
  isError?: boolean;
  progress?: { completed: number; total: number } | null;
}

export default function ProgressIndicator({ status, isError = false, progress = null }: ProgressIndicatorProps) {
  const percentage = progress ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="w-full max-w-md mx-auto text-center">
      {/* Animated Icon */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        {isError ? (
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
        ) : (
          <>
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" />
            {/* Inner pulse */}
            <div className="absolute inset-3 rounded-full bg-emerald-500/10 animate-pulse flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
          </>
        )}
      </div>

      {/* Status Text */}
      <p className={`text-lg font-medium ${isError ? 'text-red-400' : 'text-zinc-200'}`}>
        {isError ? 'Processing Failed' : 'AI is mapping your data'}
      </p>
      <p className={`text-sm mt-2 ${isError ? 'text-red-400/70' : 'text-zinc-500'}`}>
        {status}
      </p>

      {/* Progress Bar or Dots */}
      {!isError && (
        progress ? (
          <div className="mt-6 space-y-2">
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700/50">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
              />
            </div>
            <div className="text-xs text-zinc-500 text-right font-mono">
              {progress.completed} / {progress.total} batches
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-emerald-400"
                style={{
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
