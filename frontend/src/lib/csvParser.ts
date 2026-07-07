import Papa from 'papaparse';
import { ParsedCSV } from './types';

/**
 * Parse a CSV file client-side using PapaParse.
 * Returns headers and rows.
 */
export function parseCsvFile(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data;

        if (headers.length === 0) {
          reject(new Error('CSV file has no headers'));
          return;
        }

        if (rows.length === 0) {
          reject(new Error('CSV file has no data rows'));
          return;
        }

        resolve({ headers, rows });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}
