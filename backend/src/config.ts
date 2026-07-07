import dotenv from 'dotenv';
import { AppConfig } from './types';

dotenv.config();

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  aiProvider: (process.env.AI_PROVIDER || 'gemini').toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  batchSize: parseInt(process.env.BATCH_SIZE || '25', 10),
  concurrencyLimit: parseInt(process.env.CONCURRENCY_LIMIT || '3', 10),
  maxRetries: parseInt(process.env.MAX_RETRIES || '2', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

/**
 * Validate that required configuration is present
 */
export function validateConfig(): void {
  const { aiProvider, geminiApiKey, openaiApiKey, anthropicApiKey } = config;

  const keyMap: Record<string, string> = {
    gemini: geminiApiKey,
    openai: openaiApiKey,
    claude: anthropicApiKey,
  };

  if (!keyMap[aiProvider]) {
    throw new Error(
      `Missing API key for provider "${aiProvider}". ` +
        `Set the corresponding env var (GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY).`
    );
  }
}
