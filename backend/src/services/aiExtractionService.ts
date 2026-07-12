import pLimit from 'p-limit';
import {
  ImportResponse,
  CrmRecord,
  SkippedRow,
  RowResult,
  ProgressCallback,
} from '../types';
import { createLLMProvider } from '../providers/llmProvider';
import { retryWithBackoff } from '../utils/retry';
import { config } from '../config';

/** Simple sleep utility */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main orchestrator: splits rows into batches, processes them with the LLM
 * provider with controlled concurrency and retry logic, and aggregates results.
 */
export async function processImport(
  headers: string[],
  rows: Record<string, string>[],
  onProgress?: ProgressCallback
): Promise<ImportResponse> {
  const { batchSize, concurrencyLimit, maxRetries, batchDelayMs } = config;
  const provider = createLLMProvider();

  console.log(
    `[AIExtraction] Starting import: ${rows.length} rows, ` +
      `batch size ${batchSize}, concurrency ${concurrencyLimit}, ` +
      `delay ${batchDelayMs}ms, provider: ${provider.name}`
  );

  // Split rows into batches
  const batches: Record<string, string>[][] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }

  const totalBatches = batches.length;
  let completedBatches = 0;

  // Aggregated results
  const allRecords: CrmRecord[] = [];
  const allSkipped: SkippedRow[] = [];

  // Process batches with controlled concurrency
  const limit = pLimit(concurrencyLimit);

  const batchPromises = batches.map((batch, batchIndex) =>
    limit(async () => {
      const globalOffset = batchIndex * batchSize;

      // Add inter-batch delay to avoid rate limits (skip delay for the first batch)
      if (batchIndex > 0 && batchDelayMs > 0) {
        await sleep(batchDelayMs);
      }

      try {
        // Retry with exponential backoff
        const batchResult = await retryWithBackoff(
          () => provider.extractBatch(headers, batch, batchIndex),
          maxRetries
        );

        // Process results
        for (const result of batchResult.results) {
          const globalRowIndex = globalOffset + result.row_index;

          if (result.status === 'parsed' && result.record) {
            allRecords.push(result.record);
          } else {
            allSkipped.push({
              row_index: globalRowIndex,
              raw_row: batch[result.row_index] || {},
              reason: result.skip_reason || 'Skipped by AI',
            });
          }
        }

        console.log(
          `[AIExtraction] Batch ${batchIndex + 1}/${totalBatches} completed successfully`
        );
      } catch (error) {
        // All retries exhausted — mark entire batch as skipped
        console.error(
          `[AIExtraction] Batch ${batchIndex + 1}/${totalBatches} failed after ${maxRetries + 1} attempts:`,
          error instanceof Error ? error.message : error
        );

        for (let i = 0; i < batch.length; i++) {
          allSkipped.push({
            row_index: globalOffset + i,
            raw_row: batch[i],
            reason: 'AI processing failed after retries',
          });
        }
      } finally {
        completedBatches++;
        if (onProgress) {
          onProgress(completedBatches, totalBatches);
        }
      }
    })
  );

  await Promise.all(batchPromises);

  // Sort records and skipped by original order
  allSkipped.sort((a, b) => a.row_index - b.row_index);

  const response: ImportResponse = {
    total_rows: rows.length,
    total_imported: allRecords.length,
    total_skipped: allSkipped.length,
    records: allRecords,
    skipped: allSkipped,
  };

  console.log(
    `[AIExtraction] Import complete: ${response.total_imported} imported, ` +
      `${response.total_skipped} skipped out of ${response.total_rows} total`
  );

  return response;
}

/**
 * Streaming version of processImport.
 * Processes batches concurrently and invokes callback as each batch finishes.
 */
export async function processImportStreaming(
  headers: string[],
  rows: Record<string, string>[],
  onBatch: (
    batchIndex: number,
    totalBatches: number,
    status: 'success' | 'failed',
    records: CrmRecord[],
    skipped: SkippedRow[],
    error?: string
  ) => void
): Promise<void> {
  const { batchSize, concurrencyLimit, maxRetries, batchDelayMs } = config;
  const provider = createLLMProvider();

  console.log(
    `[AIExtraction] Starting streaming import: ${rows.length} rows, ` +
      `batch size ${batchSize}, concurrency ${concurrencyLimit}, ` +
      `delay ${batchDelayMs}ms, provider: ${provider.name}`
  );

  // Split rows into batches
  const batches: Record<string, string>[][] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }

  const totalBatches = batches.length;
  const limit = pLimit(concurrencyLimit);

  const batchPromises = batches.map((batch, batchIndex) =>
    limit(async () => {
      const globalOffset = batchIndex * batchSize;

      // Add inter-batch delay to avoid rate limits (skip delay for the first batch)
      if (batchIndex > 0 && batchDelayMs > 0) {
        await sleep(batchDelayMs);
      }

      try {
        const batchResult = await retryWithBackoff(
          () => provider.extractBatch(headers, batch, batchIndex),
          maxRetries
        );

        const batchRecords: CrmRecord[] = [];
        const batchSkipped: SkippedRow[] = [];

        for (const result of batchResult.results) {
          const globalRowIndex = globalOffset + result.row_index;

          if (result.status === 'parsed' && result.record) {
            batchRecords.push(result.record);
          } else {
            batchSkipped.push({
              row_index: globalRowIndex,
              raw_row: batch[result.row_index] || {},
              reason: result.skip_reason || 'Skipped by AI',
            });
          }
        }

        onBatch(batchIndex, totalBatches, 'success', batchRecords, batchSkipped);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(
          `[AIExtraction] Batch ${batchIndex + 1}/${totalBatches} failed after ${maxRetries + 1} attempts:`,
          errorMessage
        );

        const batchSkipped: SkippedRow[] = [];
        for (let i = 0; i < batch.length; i++) {
          batchSkipped.push({
            row_index: globalOffset + i,
            raw_row: batch[i],
            reason: 'AI processing failed after retries',
          });
        }

        onBatch(batchIndex, totalBatches, 'failed', [], batchSkipped, errorMessage);
      }
    })
  );

  await Promise.all(batchPromises);
}
