import { Request, Response, NextFunction } from 'express';
import { processImport } from '../services/aiExtractionService';
import { parseCSV, validateImportRequest } from '../services/csvService';
import { HttpError } from '../middleware/errorHandler';
import { ImportRequest } from '../types';

/**
 * Handle JSON import request.
 * Accepts { headers: string[], rows: Record<string, string>[] }
 */
export async function handleJsonImport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as ImportRequest;

    // Validate request
    const validationError = validateImportRequest(body);
    if (validationError) {
      throw new HttpError(validationError, 400);
    }

    console.log(
      `[Controller] Starting JSON import: ${body.rows.length} rows, ${body.headers.length} headers`
    );

    const result = await processImport(body.headers, body.rows);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle file upload import request.
 * Accepts multipart/form-data with a CSV file.
 */
export async function handleFileImport(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const file = req.file;

    if (!file) {
      throw new HttpError('No file uploaded. Please upload a CSV file.', 400);
    }

    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new HttpError('Invalid file type. Only .csv files are accepted.', 400);
    }

    // Parse CSV from file buffer
    const csvContent = file.buffer.toString('utf-8');
    const { headers, rows } = parseCSV(csvContent);

    // Validate parsed content
    const validationError = validateImportRequest({ headers, rows });
    if (validationError) {
      throw new HttpError(validationError, 400);
    }

    console.log(
      `[Controller] Starting file import: ${rows.length} rows, ${headers.length} headers`
    );

    const result = await processImport(headers, rows);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Health check endpoint
 */
export function healthCheck(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    provider: process.env.AI_PROVIDER || 'gemini',
  });
}
