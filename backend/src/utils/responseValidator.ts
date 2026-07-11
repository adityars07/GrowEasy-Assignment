import {
  BatchResult,
  CrmRecord,
  CRM_FIELD_NAMES,
  CRM_STATUS_VALUES,
  CrmStatus,
  DATA_SOURCE_VALUES,
  DataSource,
  RowResult,
} from '../types';

/**
 * Validate and sanitize the parsed AI response against the CRM schema.
 * - Ensures all 15 fields are present (fills missing with "")
 * - Coerces invalid crm_status/data_source to ""
 * - Returns a clean BatchResult
 */
export function validateBatchResult(raw: unknown): BatchResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI response is not a valid object');
  }

  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.results)) {
    throw new Error('AI response missing "results" array');
  }

  const results: RowResult[] = obj.results.map((item: unknown, idx: number) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Result at index ${idx} is not a valid object`);
    }

    const row = item as Record<string, unknown>;

    const status = row.status === 'skipped' ? 'skipped' : 'parsed';
    const rowIndex = typeof row.row_index === 'number' ? row.row_index : idx;

    if (status === 'skipped') {
      return {
        row_index: rowIndex,
        status: 'skipped' as const,
        skip_reason: typeof row.skip_reason === 'string' ? row.skip_reason : 'Unknown reason',
        record: null,
      };
    }

    // Validate and sanitize the record
    const rawRecord = (row.record || {}) as Record<string, unknown>;
    const record = sanitizeRecord(rawRecord);

    // Safety check: if neither email nor mobile is present, mark as skipped (Rule 3)
    const hasEmail = record.email && record.email.trim().length > 0;
    const hasMobile = record.mobile_without_country_code && record.mobile_without_country_code.trim().length > 0;
    if (!hasEmail && !hasMobile) {
      return {
        row_index: rowIndex,
        status: 'skipped' as const,
        skip_reason: 'No valid email or mobile number found',
        record: null,
      };
    }

    return {
      row_index: rowIndex,
      status: 'parsed' as const,
      skip_reason: null,
      record,
    };
  });

  return { results };
}

/**
 * Sanitize a raw record object to match CrmRecord schema exactly.
 */
function sanitizeRecord(raw: Record<string, unknown>): CrmRecord {
  const record: Record<string, unknown> = {};

  // Ensure all 15 fields are present
  for (const field of CRM_FIELD_NAMES) {
    const value = raw[field];

    if (field === 'crm_status') {
      record[field] = isValidCrmStatus(value) ? value : '';
    } else if (field === 'data_source') {
      record[field] = isValidDataSource(value) ? value : '';
    } else if (field === 'created_at') {
      record[field] = value === null || value === undefined ? null : String(value);
    } else {
      record[field] = typeof value === 'string' ? value : (value === null || value === undefined ? '' : String(value));
    }
  }

  return record as unknown as CrmRecord;
}

function isValidCrmStatus(value: unknown): value is CrmStatus {
  return typeof value === 'string' && (CRM_STATUS_VALUES as readonly string[]).includes(value);
}

function isValidDataSource(value: unknown): value is DataSource {
  return typeof value === 'string' && (DATA_SOURCE_VALUES as readonly string[]).includes(value);
}

/**
 * Try to parse a JSON string from an AI response, handling markdown fences
 */
export function parseAIResponse(text: string): unknown {
  // Remove markdown code fences if present
  let cleaned = text.trim();

  // Remove ```json ... ``` or ``` ... ```
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(
      `Failed to parse AI response as JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
