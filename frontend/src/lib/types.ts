// ============================================================
// Shared TypeScript types for the GrowEasy CSV Importer frontend
// ============================================================

/** The 4-step app flow */
export type AppStep = 'upload' | 'preview' | 'processing' | 'results';

/** File info after selection */
export interface FileInfo {
  name: string;
  size: number;
  file: File;
}

/** Parsed CSV data */
export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
}

/** A single CRM record */
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
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

/** The CRM field names in display order */
export const CRM_COLUMNS: (keyof CrmRecord)[] = [
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

/** Pretty labels for CRM fields */
export const CRM_COLUMN_LABELS: Record<keyof CrmRecord, string> = {
  created_at: 'Created At',
  name: 'Name',
  email: 'Email',
  country_code: 'Country Code',
  mobile_without_country_code: 'Mobile',
  company: 'Company',
  city: 'City',
  state: 'State',
  country: 'Country',
  lead_owner: 'Lead Owner',
  crm_status: 'CRM Status',
  crm_note: 'CRM Note',
  data_source: 'Data Source',
  possession_time: 'Possession Time',
  description: 'Description',
};

/** A skipped row */
export interface SkippedRow {
  row_index: number;
  raw_row: Record<string, string>;
  reason: string;
}

/** Backend import response */
export interface ImportResponse {
  total_rows: number;
  total_imported: number;
  total_skipped: number;
  records: CrmRecord[];
  skipped: SkippedRow[];
}

/** API error response */
export interface ApiError {
  error: string;
  details?: string;
}
