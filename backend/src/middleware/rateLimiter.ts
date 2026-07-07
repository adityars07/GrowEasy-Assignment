import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for the import endpoint.
 * Limits to 10 requests per minute per IP.
 */
export const importRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: 'Too many import requests. Please try again in a minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General rate limiter for all endpoints.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
