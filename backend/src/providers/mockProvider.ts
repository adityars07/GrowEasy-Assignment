import { LLMProvider, BatchResult, CrmRecord } from '../types';

export class MockProvider implements LLMProvider {
  readonly name = 'mock';

  async extractBatch(
    headers: string[],
    rows: Record<string, string>[],
    batchIndex: number
  ): Promise<BatchResult> {
    console.log(`[MockProvider] Simulating processing of batch ${batchIndex + 1} with ${rows.length} rows`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const results = rows.map((row, idx) => {
      // Find name field
      const nameKey = headers.find(h => /name/i.test(h)) || headers[0];
      const name = row[nameKey] || 'Sample Lead';

      // Find email field
      const emailKey = headers.find(h => /email/i.test(h));
      const email = emailKey ? row[emailKey] : 'lead@example.com';

      // Find phone/mobile
      const phoneKey = headers.find(h => /phone|mobile|contact/i.test(h));
      const phoneVal = phoneKey ? row[phoneKey] : '9876543210';
      const cleanPhone = phoneVal.replace(/\D/g, '');
      const mobile = cleanPhone.slice(-10);
      const countryCode = cleanPhone.length > 10 ? '+' + cleanPhone.slice(0, cleanPhone.length - 10) : '+91';

      // Find status
      const statusKey = headers.find(h => /status/i.test(h));
      const statusVal = statusKey ? row[statusKey] : '';
      let crmStatus = '';
      if (/follow|good/i.test(statusVal)) crmStatus = 'GOOD_LEAD_FOLLOW_UP';
      else if (/not|connect/i.test(statusVal)) crmStatus = 'DID_NOT_CONNECT';
      else if (/bad|junk/i.test(statusVal)) crmStatus = 'BAD_LEAD';
      else if (/done|won|sale/i.test(statusVal)) crmStatus = 'SALE_DONE';
      else crmStatus = 'GOOD_LEAD_FOLLOW_UP'; // default for mock

      // Skip row if no email and no mobile
      if (!email && !mobile) {
        return {
          row_index: idx,
          status: 'skipped' as const,
          skip_reason: 'No valid email or mobile number found',
          record: null
        };
      }

      const record: CrmRecord = {
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        name,
        email,
        country_code: countryCode,
        mobile_without_country_code: mobile,
        company: row[headers.find(h => /company|org/i.test(h)) || ''] || 'GrowEasy',
        city: row[headers.find(h => /city/i.test(h)) || ''] || 'Mumbai',
        state: row[headers.find(h => /state/i.test(h)) || ''] || 'Maharashtra',
        country: row[headers.find(h => /country/i.test(h)) || ''] || 'India',
        lead_owner: row[headers.find(h => /owner/i.test(h)) || ''] || 'sales@groweasy.com',
        crm_status: crmStatus as any,
        crm_note: 'Imported via Mock AI Engine',
        data_source: 'leads_on_demand',
        possession_time: '',
        description: 'Auto-mapped using offline engine'
      };

      return {
        row_index: idx,
        status: 'parsed' as const,
        skip_reason: null,
        record
      };
    });

    return { results };
  }
}
