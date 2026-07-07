import Papa from 'papaparse';
import { ImportRequest } from '../types';

/**
 * Parse a raw CSV string into headers and rows.
 */
export function parseCSV(rawCsv: string): { headers: string[]; rows: Record<string, string>[] } {
  const result = Papa.parse<Record<string, string>>(rawCsv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (result.errors.length > 0) {
    const criticalErrors = result.errors.filter((e) => e.type === 'Delimiter');
    if (criticalErrors.length > 0) {
      throw new Error(`CSV parsing error: ${criticalErrors[0].message}`);
    }
  }

  const headers = result.meta.fields || [];
  const rows = result.data;

  return { headers, rows };
}

/**
 * Validate an import request payload.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateImportRequest(req: ImportRequest): string | null {
  if (!req.headers || !Array.isArray(req.headers)) {
    return 'Missing or invalid "headers" field. Expected an array of strings.';
  }

  if (req.headers.length === 0) {
    return 'CSV has no headers.';
  }

  if (!req.rows || !Array.isArray(req.rows)) {
    return 'Missing or invalid "rows" field. Expected an array of objects.';
  }

  if (req.rows.length === 0) {
    return 'CSV has no data rows.';
  }

  if (req.rows.length > 10000) {
    return 'Too many rows. Maximum allowed is 10,000 rows per import.';
  }

  // Validate that rows are objects
  for (let i = 0; i < Math.min(req.rows.length, 5); i++) {
    if (typeof req.rows[i] !== 'object' || req.rows[i] === null) {
      return `Invalid row at index ${i}. Each row must be a key-value object.`;
    }
  }

  return null;
}
