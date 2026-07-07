import OpenAI from 'openai';
import { LLMProvider, BatchResult } from '../types';
import { getSystemPrompt, buildUserMessage } from '../utils/promptBuilder';
import { parseAIResponse, validateBatchResult } from '../utils/responseValidator';

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai';
  private client: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.client = new OpenAI({ apiKey });
  }

  async extractBatch(
    headers: string[],
    rows: Record<string, string>[],
    batchIndex: number
  ): Promise<BatchResult> {
    const systemPrompt = getSystemPrompt();
    const userMessage = buildUserMessage(headers, rows);

    console.log(`[OpenAI] Processing batch ${batchIndex + 1} with ${rows.length} rows`);

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const text = completion.choices[0]?.message?.content;

    if (!text) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = parseAIResponse(text);
    return validateBatchResult(parsed);
  }
}
