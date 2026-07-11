import { getSystemPrompt, buildUserMessage } from '../promptBuilder';

describe('promptBuilder', () => {
  it('should return a detailed system prompt', () => {
    const systemPrompt = getSystemPrompt();
    expect(systemPrompt).toContain('CRM Data Mapping Engine for GrowEasy');
    expect(systemPrompt).toContain('GOOD_LEAD_FOLLOW_UP');
    expect(systemPrompt).toContain('leads_on_demand');
  });

  it('should format headers and rows into user message correctly', () => {
    const headers = ['Name', 'Email'];
    const rows = [{ Name: 'Alice', Email: 'alice@example.com' }];
    const userMessage = buildUserMessage(headers, rows);

    expect(userMessage).toContain('CSV Headers: ["Name","Email"]');
    expect(userMessage).toContain('Alice');
    expect(userMessage).toContain('alice@example.com');
  });
});
