'use client';

import React, { useState, useCallback } from 'react';
import { AppStep, FileInfo, ParsedCSV, ImportResponse } from '../lib/types';
import { parseCsvFile } from '../lib/csvParser';
import { importCsv, importCsvStream, recordsToCsv, downloadFile, formatFileSize, getSampleCsvTemplate } from '../lib/api';
import FileUploader from '../components/FileUploader';
import CsvPreviewTable from '../components/CsvPreviewTable';
import ResultsTable from '../components/ResultsTable';
import SkippedRowsTable from '../components/SkippedRowsTable';
import SummaryStats from '../components/SummaryStats';
import ProgressIndicator from '../components/ProgressIndicator';
import StepIndicator from '../components/StepIndicator';
import ThemeToggle from '../components/ThemeToggle';

export default function Home() {
  // App state
  const [step, setStep] = useState<AppStep>('upload');
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [parsedCsv, setParsedCsv] = useState<ParsedCSV | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState('Initializing...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);

  // Step 1: File selected
  const handleFileSelect = useCallback(async (info: FileInfo) => {
    setFileInfo(info);
    setError(null);

    try {
      const result = await parseCsvFile(info.file);
      setParsedCsv(result);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    }
  }, []);

  // Step 2 → Step 3: Confirm import
  const handleConfirmImport = useCallback(async () => {
    if (!parsedCsv) return;

    setStep('processing');
    setIsProcessing(true);
    setError(null);
    setProgress({ completed: 0, total: Math.ceil(parsedCsv.rows.length / 25) });
    setProcessingStatus('Initializing import...');

    try {
      const result = await importCsvStream(parsedCsv, (completed, total) => {
        setProgress({ completed, total });
        setProcessingStatus(`Processed batch ${completed} of ${total} (${Math.round((completed / total) * 100)}%)`);
      });
      setImportResult(result);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Please try again.');
      setProcessingStatus('');
    } finally {
      setIsProcessing(false);
    }
  }, [parsedCsv]);

  // Retry import
  const handleRetry = useCallback(() => {
    setError(null);
    handleConfirmImport();
  }, [handleConfirmImport]);

  // Reset to upload
  const handleReset = useCallback(() => {
    setStep('upload');
    setFileInfo(null);
    setParsedCsv(null);
    setImportResult(null);
    setError(null);
    setProcessingStatus('');
    setIsProcessing(false);
    setProgress(null);
  }, []);

  // Download sample template
  const handleSampleDownload = useCallback(() => {
    const csv = getSampleCsvTemplate();
    downloadFile(csv, 'groweasy_crm_template.csv');
  }, []);

  // Download results
  const handleDownloadResults = useCallback(() => {
    if (!importResult) return;
    const csv = recordsToCsv(importResult.records);
    downloadFile(csv, `groweasy_import_${new Date().toISOString().slice(0, 10)}.csv`);
  }, [importResult]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-100 leading-tight">GrowEasy</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium leading-tight">CSV Importer</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Step Indicator */}
        <div className="mb-10">
          <StepIndicator currentStep={step} />
        </div>

        {/* =================== STEP 1: Upload =================== */}
        {step === 'upload' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2">
                Import Your CSV Data
              </h2>
              <p className="text-zinc-500 max-w-lg mx-auto">
                Upload any CSV file — Facebook Lead Ads, Google Ads exports, Excel sheets, CRM exports.
                Our AI will intelligently map your columns to GrowEasy CRM format.
              </p>
            </div>
            <FileUploader onFileSelect={handleFileSelect} onSampleDownload={handleSampleDownload} />
            {error && (
              <div className="mt-4 max-w-2xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* =================== STEP 2: Preview =================== */}
        {step === 'preview' && parsedCsv && (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Preview Upload</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  {fileInfo && (
                    <>
                      <span className="text-zinc-300 font-medium">{fileInfo.name}</span>
                      {' · '}
                      {formatFileSize(fileInfo.size)}
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    Confirm Import
                  </span>
                </button>
              </div>
            </div>
            <CsvPreviewTable headers={parsedCsv.headers} rows={parsedCsv.rows} />
          </div>
        )}

        {/* =================== STEP 3: Processing =================== */}
        {step === 'processing' && (
          <div className="animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
            <ProgressIndicator
              status={error || processingStatus}
              isError={!!error}
              progress={progress}
            />
            {error && (
              <div className="mt-8 flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all"
                >
                  Start Over
                </button>
                <button
                  onClick={handleRetry}
                  className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 transition-all"
                >
                  Retry Import
                </button>
              </div>
            )}
          </div>
        )}

        {/* =================== STEP 4: Results =================== */}
        {step === 'results' && importResult && (
          <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-100">Import Results</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  AI has mapped your data to GrowEasy CRM format
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all"
                >
                  New Import
                </button>
                {importResult.records.length > 0 && (
                  <button
                    onClick={handleDownloadResults}
                    className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Download CSV
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <SummaryStats
              totalRows={importResult.total_rows}
              totalImported={importResult.total_imported}
              totalSkipped={importResult.total_skipped}
            />

            {/* Results Table */}
            <ResultsTable records={importResult.records} />

            {/* Skipped Rows */}
            <SkippedRowsTable skipped={importResult.skipped} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-center">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} GrowEasy · AI-Powered CSV Importer
          </p>
        </div>
      </footer>
    </div>
  );
}
