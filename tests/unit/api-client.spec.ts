import { expect, test } from '@playwright/test';
import { bffHeaders } from '@/lib/apiClient';

test.describe('Performance development identity headers', () => {
  test('adds the configured Mongo identity to Performance BFF calls', () => {
    const headers = bffHeaders(
      '/api/bff/v1/performance/dashboard?scope=SELF',
      undefined,
      'AGENT_P4',
      '1000096',
      'MY',
    );

    expect(headers.get('x-agent-id')).toBe('1000096');
    expect(headers.get('x-tenant')).toBe('MY');
    expect(headers.get('x-persona')).toBe('AGENT_P4');
  });

  test('does not leak the Performance identity to other BFF route families', () => {
    const headers = bffHeaders(
      '/api/bff/v1/contest-admin/portfolio',
      undefined,
      'LEADER_P2',
      '1000096',
      'MY',
    );

    expect(headers.has('x-agent-id')).toBe(false);
    expect(headers.has('x-tenant')).toBe(false);
  });

  test('preserves an explicitly supplied request identity', () => {
    const headers = bffHeaders(
      '/api/bff/v1/performance/dashboard?scope=SELF',
      { 'x-agent-id': '1000321', 'x-tenant': 'MY' },
      'LEADER_P2',
      '1000096',
      'MY',
    );

    expect(headers.get('x-agent-id')).toBe('1000321');
  });
});
