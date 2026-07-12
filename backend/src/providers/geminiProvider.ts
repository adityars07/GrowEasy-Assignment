import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, BatchResult } from '../types';
import { getSystemPrompt, buildUserMessage } from '../utils/promptBuilder';
import { parseAIResponse, validateBatchResult } from '../utils/responseValidator';

/**
 * GeminiProvider with API key rotation.
 * 
 * Supports multiple API keys (comma-separated in GEMINI_API_KEY env var).
 * When a key hits rate limits (429), it automatically rotates to the next key.
 * This lets you combine multiple free-tier Google accounts to multiply your quota.
 */
export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  private apiKeys: string[];
  private currentKeyIndex: number = 0;

  constructor(apiKeys: string) {
    // Support comma-separated keys for rotation
    this.apiKeys = apiKeys
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (this.apiKeys.length === 0) {
      throw new Error('Gemini API key is required');
    }

    console.log(`[Gemini] Initialized with ${this.apiKeys.length} API key(s)`);
  }

  /** Get the next API key in rotation */
  private rotateKey(): string {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    console.log(
      `[Gemini] Rotated to API key ${this.currentKeyIndex + 1}/${this.apiKeys.length}`
    );
    return this.apiKeys[this.currentKeyIndex];
  }

  /** Get the current API key */
  private getCurrentKey(): string {
    return this.apiKeys[this.currentKeyIndex];
  }

  async extractBatch(
    headers: string[],
    rows: Record<string, string>[],
    batchIndex: number
  ): Promise<BatchResult> {
    const currentKey = this.getCurrentKey();
    const client = new GoogleGenerativeAI(currentKey);

    const model = client.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const systemPrompt = getSystemPrompt();
    const userMessage = buildUserMessage(headers, rows);

    console.log(
      `[Gemini] Processing batch ${batchIndex + 1} with ${rows.length} rows ` +
        `(key ${this.currentKeyIndex + 1}/${this.apiKeys.length})`
    );

    try {
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
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // If rate limited and we have more keys, rotate and rethrow
      // (the retry logic will retry with the new key)
      if (
        (errorMsg.includes('429') || errorMsg.includes('quota')) &&
        this.apiKeys.length > 1
      ) {
        this.rotateKey();
      }

      throw error;
    }
  }
}
