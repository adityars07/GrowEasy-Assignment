import { LLMProvider } from '../types';
import { GeminiProvider } from './geminiProvider';
import { OpenAIProvider } from './openaiProvider';
import { ClaudeProvider } from './claudeProvider';
import { config } from '../config';

/**
 * Factory function to create the appropriate LLM provider
 * based on the AI_PROVIDER environment variable.
 */
export function createLLMProvider(): LLMProvider {
  const { aiProvider } = config;

  switch (aiProvider) {
    case 'gemini':
      return new GeminiProvider(config.geminiApiKey);
    case 'openai':
      return new OpenAIProvider(config.openaiApiKey);
    case 'claude':
      return new ClaudeProvider(config.anthropicApiKey);
    default:
      throw new Error(
        `Unknown AI provider: "${aiProvider}". ` +
          `Supported providers: gemini, openai, claude`
      );
  }
}
