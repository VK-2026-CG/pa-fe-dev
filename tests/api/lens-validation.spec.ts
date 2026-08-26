import { expect, test } from '@playwright/test';
import { BFF, getStatus } from '../support/api';

/** parseLens rejects unknown lens values with BFF-4000 before touching the domain. */
test.describe('BFF lens validation', () => {
  for (const [name, qs] of [
    ['period', 'period=DECADE'],
    ['businessLine', 'businessLine=WHOLESALE'],
    ['basis', 'basis=CUSTOM'],
    ['scope', 'scope=REGION'],
  ] as const) {
    test(`invalid ${name} → 400`, async ({ request }) => {
      const status = await getStatus(request, 'LEADER_P2', `${BFF}/performance/dashboard?${qs}`);
      expect(status).toBe(400);
    });
  }

  test('invalid teamView → 400', async ({ request }) => {
    const status = await getStatus(request, 'LEADER_P2', `${BFF}/performance/dashboard?scope=TEAM&teamView=REGION`);
    expect(status).toBe(400);
  });
});
