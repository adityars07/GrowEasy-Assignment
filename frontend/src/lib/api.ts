import { ImportResponse, ParsedCSV } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Send parsed CSV data to the backend for AI extraction.
 */
export async function importCsv(data: ParsedCSV): Promise<ImportResponse> {
  const response = await fetch(`${API_BASE_URL}/api/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      headers: data.headers,
      rows: data.rows,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Import failed (${response.status})`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error || errorMessage;
    } catch {
      // Ignore JSON parse errors for error response
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Import CSV data using streaming SSE (Server-Sent Events) to track progress in real-time.
 */
export async function importCsvStream(
  data: ParsedCSV,
  onProgress: (completed: number, total: number, records: ImportResponse['records'], skipped: ImportResponse['skipped']) => void
): Promise<ImportResponse> {
  const response = await fetch(`${API_BASE_URL}/api/import/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      headers: data.headers,
      rows: data.rows,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Import failed (${response.status})`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error || errorMessage;
    } catch {
      // Ignore JSON parse errors for error response
    }
    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Readable stream not supported in this browser.');
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  const records: ImportResponse['records'] = [];
  const skipped: ImportResponse['skipped'] = [];
  const totalRows = data.rows.length;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const cleanedLine = line.trim();
      if (!cleanedLine) continue;

      if (cleanedLine.startsWith('data: ')) {
        const jsonStr = cleanedLine.slice(6);
        try {
          const event = JSON.parse(jsonStr);
          if (event.type === 'batch') {
            records.push(...event.records);
            skipped.push(...event.skipped);
            onProgress(event.completedCount, event.totalBatches, records, skipped);
          } else if (event.type === 'error') {
            throw new Error(event.message || 'Error occurred during processing.');
          } else if (event.type === 'done') {
            // Completed
          }
        } catch (e) {
          if (e instanceof Error) {
            throw e;
          }
          throw new Error('Failed to parse stream event.');
        }
      }
    }
  }

  return {
    total_rows: totalRows,
    total_imported: records.length,
    total_skipped: skipped.length,
    records,
    skipped,
  };
}

/**
 * Convert CRM records to a downloadable CSV string.
 */
export function recordsToCsv(records: ImportResponse['records']): string {
  if (records.length === 0) return '';

  const headers = [
    'created_at', 'name', 'email', 'country_code',
    'mobile_without_country_code', 'company', 'city', 'state',
    'country', 'lead_owner', 'crm_status', 'crm_note',
    'data_source', 'possession_time', 'description',
  ];

  const escapeField = (field: string | null): string => {
    const value = field ?? '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvRows = [
    headers.join(','),
    ...records.map((record) =>
      headers.map((h) => escapeField((record as unknown as Record<string, string | null>)[h])).join(',')
    ),
  ];

  return csvRows.join('\n');
}

/**
 * Trigger a file download in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format file size in human-readable format.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Generate a sample CSV template matching the CRM fields.
 */
export function getSampleCsvTemplate(): string {
  const headers = [
    'created_at', 'name', 'email', 'country_code',
    'mobile_without_country_code', 'company', 'city', 'state',
    'country', 'lead_owner', 'crm_status', 'crm_note',
    'data_source', 'possession_time', 'description',
  ];

  const sampleRow = [
    '2026-05-13 14:20:48', 'John Doe', 'john.doe@example.com', '+91',
    '9876543210', 'GrowEasy', 'Mumbai', 'Maharashtra',
    'India', 'test@gmail.com', 'GOOD_LEAD_FOLLOW_UP', 'Client is asking to reschedule demo',
    '', '', '',
  ];

  return [headers.join(','), sampleRow.join(',')].join('\n');
}
