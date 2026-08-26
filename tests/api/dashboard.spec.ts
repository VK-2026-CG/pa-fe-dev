import { expect, test } from '@playwright/test';
import { BFF, getJson, getStatus, metricCodes } from '../support/api';

test.describe('BFF dashboard (S-P4-01)', () => {
  test('SELF: 4 priority cards, PTPC hides goal (AC-P4-01-06)', async ({ request }) => {
    const d = await getJson(request, 'LEADER_P2', `${BFF}/performance/dashboard?scope=SELF`);
    expect(metricCodes(d.priorityMetrics)).toEqual(['TPC', 'PTPC', 'CASE_COUNT', 'FYP']);
    expect(d.priorityMetrics[0].showGoal).toBe(true);
    expect(d.priorityMetrics[1].showGoal).toBe(false);
    expect(d.priorityMetrics[0].value.amount).toBe('100000.00');
  });

  test('SELF: focus row simple cards + AI panel + milestones', async ({ request }) => {
    const d = await getJson(request, 'LEADER_P2', `${BFF}/performance/dashboard?scope=SELF`);
    expect(metricCodes(d.focusMetrics)).toEqual(['FYC', 'PERSISTENCY_CY']);
    expect(d.recommendations.panel.highlight.goal.progressPct).toBe(76);
    expect(d.milestones.items).toHaveLength(2);
  });

  test('TEAM DIRECT: 9 cards, Group toggle visible for P2 (AC-P4-01-16)', async ({ request }) => {
    const d = await getJson(request, 'LEADER_P2', `${BFF}/performance/dashboard?scope=TEAM`);
    expect(d.priorityMetrics).toHaveLength(9);
    expect(d.filters.teamView).toBe('DIRECT');
    expect(d.filters.teamViewToggleVisible).toBe(true);
    expect(d.filters.basisToggleVisible).toBe(false);
  });

  test('TEAM GROUP (P2): values scale up', async ({ request }) => {
    const d = await getJson(request, 'LEADER_P2', `${BFF}/performance/dashboard?scope=TEAM&teamView=GROUP`);
    expect(d.filters.teamView).toBe('GROUP');
    expect(Number(d.priorityMetrics[0].value.amount)).toBeGreaterThan(300000);
  });

  test('SCHEME re-composition (D-13): [TPC,FYP,CASE_COUNT], goals SET', async ({ request }) => {
    const d = await getJson(request, 'AGENT_P4', `${BFF}/performance/dashboard?scope=SELF&basis=SCHEME`);
    expect(metricCodes(d.priorityMetrics)).toEqual(['TPC', 'FYP', 'CASE_COUNT']);
    expect(d.priorityMetrics[0].goal.state).toBe('SET');
  });
});

test.describe('entitlement guards mirror D-14', () => {
  test('P3 + GROUP → 403 (AC-P4-01-24)', async ({ request }) => {
    const status = await getStatus(request, 'LEADER_P3', `${BFF}/performance/dashboard?scope=TEAM&teamView=GROUP`);
    expect(status).toBe(403);
  });

  test('P4 + TEAM → 403', async ({ request }) => {
    const status = await getStatus(request, 'AGENT_P4', `${BFF}/performance/dashboard?scope=TEAM`);
    expect(status).toBe(403);
  });
});
