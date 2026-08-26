import { expect, test } from '@playwright/test';
import { BFF, getJson } from '../support/api';

/** Draft packs ride proposed VMs behind stubs marked draft: true (OQ-17/18). */
test.describe('BFF draft packs (S-P4-05 / S-P4-06)', () => {
  test('benefits payload is flagged draft', async ({ request }) => {
    const d = await getJson(request, 'AGENT_P4', `${BFF}/benefits`);
    expect(d.draft).toBe(true);
    expect(d.bonus).toHaveLength(3);
  });

  test('comp-ben payload incl. staleness banner data (AC-P4-06-04)', async ({ request }) => {
    const d = await getJson(request, 'AGENT_P4', `${BFF}/compensation?stale=1`);
    expect(d.draft).toBe(true);
    expect(d.rows[2].amount.amount).toBe('33495.70');
    expect(d.staleness.asOnDate).toBe('2026-03-09');
  });
});
