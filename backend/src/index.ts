import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config';
import importRoutes from './routes/importRoutes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { generalRateLimiter } from './middleware/rateLimiter';

// Validate configuration before starting
validateConfig();

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);
app.use(generalRateLimiter);

// Routes
app.use('/api', importRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║   GrowEasy CSV Importer Backend                   ║
  ║   Running on port ${config.port}                          ║
  ║   AI Provider: ${config.aiProvider.padEnd(33)}║
  ║   Batch Size: ${String(config.batchSize).padEnd(35)}║
  ║   Concurrency: ${String(config.concurrencyLimit).padEnd(33)}║
  ╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
