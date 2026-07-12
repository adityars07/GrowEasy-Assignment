// ============================================================
// GrowEasy CRM Types & Interfaces
// ============================================================

/** Allowed CRM status values */
export const CRM_STATUS_VALUES = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
] as const;
export type CrmStatus = (typeof CRM_STATUS_VALUES)[number];

/** Allowed data source values */
export const DATA_SOURCE_VALUES = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
] as const;
export type DataSource = (typeof DATA_SOURCE_VALUES)[number];

/** A single CRM record with all 15 required fields */
export interface CrmRecord {
  created_at: string | null;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CrmStatus | '';
  crm_note: string;
  data_source: DataSource | '';
  possession_time: string;
  description: string;
}

/** All 15 CRM field names for validation */
export const CRM_FIELD_NAMES: (keyof CrmRecord)[] = [
  'created_at',
  'name',
  'email',
  'country_code',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'crm_note',
  'data_source',
  'possession_time',
  'description',
];

/** Result for a single row processed by the AI */
export interface RowResult {
  row_index: number;
  status: 'parsed' | 'skipped';
  skip_reason: string | null;
  record: CrmRecord | null;
}

/** Result from processing a single batch */
export interface BatchResult {
  results: RowResult[];
}

/** A skipped row in the final response */
export interface SkippedRow {
  row_index: number;
  raw_row: Record<string, string>;
  reason: string;
}

/** The final API response for the import endpoint */
export interface ImportResponse {
  total_rows: number;
  total_imported: number;
  total_skipped: number;
  records: CrmRecord[];
  skipped: SkippedRow[];
}

/** The request body for the import endpoint (JSON mode) */
export interface ImportRequest {
  headers: string[];
  rows: Record<string, string>[];
}

/** Abstract LLM provider interface */
export interface LLMProvider {
  readonly name: string;
  extractBatch(
    headers: string[],
    rows: Record<string, string>[],
    batchIndex: number
  ): Promise<BatchResult>;
}

/** Progress callback for batch processing */
export interface ProgressCallback {
  (completed: number, total: number): void;
}

/** Application configuration */
export interface AppConfig {
  port: number;
  aiProvider: string;
  geminiApiKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
  batchSize: number;
  concurrencyLimit: number;
  maxRetries: number;
  batchDelayMs: number;
  frontendUrl: string;
}
