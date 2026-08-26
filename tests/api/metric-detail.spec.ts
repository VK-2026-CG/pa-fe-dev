import { expect, test } from '@playwright/test';
import { BFF, getJson } from '../support/api';

test.describe('BFF metric detail (S-P4-02)', () => {
  test('TPC: section order + notice + 2 breakdowns (AC-P4-02-01/03)', async ({ request }) => {
    const d = await getJson(request, 'AGENT_P4', `${BFF}/performance/metrics/TPC`);
    expect(d.sections.map((s: any) => s.type)).toEqual(
      ['GAUGE', 'COMPARISON', 'VARIANT_VALUE', 'BREAKDOWN', 'BREAKDOWN'],
    );
    expect(d.notices[0].code).toBe('PRODUCT_DATA_MISSING');
    expect(d.historyNav.route).toBe('insights/history');
  });

  test('MANPOWER (TEAM): grouped bars + axis + ABS chips (AC-P4-02-10/11)', async ({ request }) => {
    const d = await getJson(request, 'LEADER_P2', `${BFF}/performance/metrics/MANPOWER?scope=TEAM`);
    expect(d.sections[0].type).toBe('BAR_COMPARISON');
    expect(d.sections[0].axisUnitCode).toBe('AGENTS');
    expect(d.sections[0].measures).toHaveLength(2);
    expect(d.sections[0].measures[1].points[1].change.display).toBe('ABS');
  });

  test('PERSISTENCY_Y1: threshold gauge 85 GTE, pp change (AC-P4-02-15)', async ({ request }) => {
    const d = await getJson(request, 'AGENT_P4', `${BFF}/performance/metrics/PERSISTENCY_Y1`);
    expect(d.sections[0].type).toBe('THRESHOLD_GAUGE');
    expect(d.sections[0].threshold.value).toBe(85);
    expect(d.sections[0].sentiment).toBe('POSITIVE');
  });

  test('EMPTY persona: dataState EMPTY, no sections (AC-P4-02-18)', async ({ request }) => {
    const d = await getJson(request, 'AGENT_EMPTY', `${BFF}/performance/metrics/CASE_COUNT`);
    expect(d.dataState).toBe('EMPTY');
    expect(d.sections).toEqual([]);
  });

  test('PROCESSING persona (AC-P4-02-17)', async ({ request }) => {
    const d = await getJson(request, 'AGENT_PROCESSING', `${BFF}/performance/metrics/CASE_COUNT`);
    expect(d.dataState).toBe('PROCESSING');
  });
});
