import { validateBatchResult, parseAIResponse } from '../responseValidator';

describe('responseValidator', () => {
  describe('parseAIResponse', () => {
    it('should parse standard JSON string', () => {
      const input = '{"status":"ok"}';
      expect(parseAIResponse(input)).toEqual({ status: 'ok' });
    });

    it('should clean and parse JSON with markdown fences', () => {
      const input = '```json\n{\n  "status": "ok"\n}\n```';
      expect(parseAIResponse(input)).toEqual({ status: 'ok' });
    });

    it('should throw error for invalid JSON', () => {
      const input = 'invalid-json';
      expect(() => parseAIResponse(input)).toThrow('Failed to parse AI response as JSON');
    });
  });

  describe('validateBatchResult', () => {
    it('should sanitize valid records correctly', () => {
      const rawResponse = {
        results: [
          {
            row_index: 0,
            status: 'parsed',
            record: {
              name: 'John Doe',
              email: 'john@example.com',
              mobile_without_country_code: '9876543210',
              crm_status: 'GOOD_LEAD_FOLLOW_UP',
            },
          },
        ],
      };

      const result = validateBatchResult(rawResponse);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].status).toBe('parsed');
      expect(result.results[0].record?.name).toBe('John Doe');
      expect(result.results[0].record?.email).toBe('john@example.com');
      expect(result.results[0].record?.crm_status).toBe('GOOD_LEAD_FOLLOW_UP');
    });

    it('should enforce Rule 3 (skip row if neither email nor mobile exists)', () => {
      const rawResponse = {
        results: [
          {
            row_index: 0,
            status: 'parsed',
            record: {
              name: 'No Email Or Phone',
              crm_status: 'GOOD_LEAD_FOLLOW_UP',
              // email and mobile_without_country_code are missing/blank
            },
          },
        ],
      };

      const result = validateBatchResult(rawResponse);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].status).toBe('skipped');
      expect(result.results[0].skip_reason).toBe('No valid email or mobile number found');
      expect(result.results[0].record).toBeNull();
    });

    it('should coerce invalid crm_status and data_source values to empty string', () => {
      const rawResponse = {
        results: [
          {
            row_index: 0,
            status: 'parsed',
            record: {
              name: 'Test Coercion',
              email: 'test@example.com',
              crm_status: 'INVALID_STATUS_VALUE',
              data_source: 'INVALID_SOURCE_VALUE',
            },
          },
        ],
      };

      const result = validateBatchResult(rawResponse);
      expect(result.results[0].record?.crm_status).toBe('');
      expect(result.results[0].record?.data_source).toBe('');
    });
  });
});
