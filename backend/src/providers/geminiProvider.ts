import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, BatchResult } from '../types';
import { getSystemPrompt, buildUserMessage } from '../utils/promptBuilder';
import { parseAIResponse, validateBatchResult } from '../utils/responseValidator';

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async extractBatch(
    headers: string[],
    rows: Record<string, string>[],
    batchIndex: number
  ): Promise<BatchResult> {
    const model = this.client.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const systemPrompt = getSystemPrompt();
    const userMessage = buildUserMessage(headers, rows);

    console.log(`[Gemini] Processing batch ${batchIndex + 1} with ${rows.length} rows`);

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
    });

    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = parseAIResponse(text);
    return validateBatchResult(parsed);
  }
}
