import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, BatchResult } from '../types';
import { getSystemPrompt, buildUserMessage } from '../utils/promptBuilder';
import { parseAIResponse, validateBatchResult } from '../utils/responseValidator';

export class ClaudeProvider implements LLMProvider {
  readonly name = 'claude';
  private client: Anthropic;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.client = new Anthropic({ apiKey });
  }

  async extractBatch(
    headers: string[],
    rows: Record<string, string>[],
    batchIndex: number
  ): Promise<BatchResult> {
    const systemPrompt = getSystemPrompt();
    const userMessage = buildUserMessage(headers, rows);

    console.log(`[Claude] Processing batch ${batchIndex + 1} with ${rows.length} rows`);

    const message = await this.client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage },
      ],
    });

    const textBlock = message.content.find((block) => block.type === 'text');
    const text = textBlock ? textBlock.text : '';

    if (!text) {
      throw new Error('Empty response from Claude');
    }

    const parsed = parseAIResponse(text);
    return validateBatchResult(parsed);
  }
}
