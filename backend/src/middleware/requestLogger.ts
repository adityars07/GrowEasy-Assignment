import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware.
 * Logs method, path, status code, and response time.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logParts = [
      `[${new Date().toISOString()}]`,
      req.method,
      req.originalUrl,
      `${res.statusCode}`,
      `${duration}ms`,
    ];
    console.log(logParts.join(' '));
  });

  next();
}
