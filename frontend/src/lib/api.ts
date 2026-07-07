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
