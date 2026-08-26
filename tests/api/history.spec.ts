import { expect, test } from '@playwright/test';
import { BFF, getJson } from '../support/api';

test.describe('BFF history (S-P4-03)', () => {
  test('CURRENT_YEAR: 1 year, MoM column, Jan null (AC-P4-03-09)', async ({ request }) => {
    const d = await getJson(request, 'AGENT_P4', `${BFF}/performance/metrics/TPC/history?window=CURRENT_YEAR`);
    expect(d.years).toEqual([2026]);
    expect(d.momDeltas[0]).toBeNull();
    expect(d.momDeltas[1].comparisonBasis).toBe('LAST_MONTH');
    expect(d.comparison.canGoOlder).toBe(true);
    expect(d.comparison.canGoNewer).toBe(false);
  });

  test('VS_LAST_2_YEARS: 3 year columns, no MoM (AC-P4-03-02)', async ({ request }) => {
    const d = await getJson(request, 'AGENT_P4', `${BFF}/performance/metrics/TPC/history?window=VS_LAST_2_YEARS`);
    expect(d.years).toEqual([2026, 2025, 2024]);
    expect(d.momDeltas).toBeUndefined();
    expect(d.comparison.canGoOlder).toBe(false);
  });

  test('TEAM tabs: 9 with overflow behind More Metrics (AC-P4-03-12)', async ({ request }) => {
    const d = await getJson(
      request, 'LEADER_P2',
      `${BFF}/performance/metrics/PRODUCTIVITY/history?window=CURRENT_YEAR&scope=TEAM`,
    );
    expect(d.tabs).toHaveLength(4);
    expect(d.moreTabs).toHaveLength(5);
    expect(d.tabs.some((t: any) => t.metricCode === 'PRODUCTIVITY' && t.selected)).toBe(true);
  });
});
