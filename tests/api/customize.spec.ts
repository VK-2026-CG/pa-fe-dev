import { expect, test } from '@playwright/test';
import { BFF, getJson, putJson } from '../support/api';

/** The stub service holds mutable preferences — these must not interleave. */
test.describe.serial('BFF customize (S-P4-04)', () => {
  test('GET: locked priority + focus list (AC-P4-04-01)', async ({ request }) => {
    const d = await getJson(request, 'AGENT_P4', `${BFF}/performance/customize?scope=SELF`);
    expect(d.priority.every((i: any) => i.locked)).toBe(true);
    expect(d.constraints.priority).toEqual({ min: 4, max: 4, editable: false });
  });

  test('PUT: saved order + focus round-trips (AC-P4-04-03)', async ({ request }) => {
    const { status, body } = await putJson(request, 'AGENT_P4', `${BFF}/performance/customize?scope=SELF`, {
      priorityMetricCodes: ['FYP', 'TPC', 'PTPC', 'CASE_COUNT'],
      focusMetricCodes: ['FYC', 'PERSISTENCY_Y1'],
    });
    expect(status).toBe(200);
    expect(body.priority.map((i: any) => i.metricCode)).toEqual(['FYP', 'TPC', 'PTPC', 'CASE_COUNT']);
    expect(body.focus.filter((i: any) => i.selected).map((i: any) => i.metricCode))
      .toEqual(['FYC', 'PERSISTENCY_Y1']);
  });

  test('dashboard honors saved priority order after PUT', async ({ request }) => {
    const d = await getJson(request, 'AGENT_P4', `${BFF}/performance/dashboard?scope=SELF`);
    expect(d.priorityMetrics.map((c: any) => c.metricCode)).toEqual(['FYP', 'TPC', 'PTPC', 'CASE_COUNT']);
  });

  test('PUT: locked-metric removal → 422 INS-4222 (AC-P4-04-08)', async ({ request }) => {
    const { status, body } = await putJson(request, 'AGENT_P4', `${BFF}/performance/customize?scope=SELF`, {
      priorityMetricCodes: ['TPC', 'PTPC', 'CASE_COUNT', 'FYC'],
      focusMetricCodes: [],
    });
    expect(status).toBe(422);
    expect(JSON.stringify(body)).toContain('INS-4222');
  });
});
