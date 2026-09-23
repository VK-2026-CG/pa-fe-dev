import { expect, test } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';

test.describe('draft packs render (S-P4-05 / S-P4-06)', () => {
  test.beforeEach(async ({ context }) => {
    await setPersona(context, 'AGENT_P4');
  });

  test('Milestones & Benefits page loads its tabs', async ({ page }) => {
    const watch = watchConsole(page);
    await page.goto('/insights/milestones');
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByRole('tab').first()).toBeVisible();
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
  });

  test('Milestones stays at its fluid mobile width at tablet/desktop instead of stretching (AC-P4-05-06)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/insights/milestones');
    const shell = page.locator('.shell');
    const box = await shell.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(480);
  });

  test('Comp & Ben page shows the stale-data banner (AC-P4-06-04)', async ({ page }) => {
    const watch = watchConsole(page);
    await page.goto('/insights/comp-ben');
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByRole('tab').first()).toBeVisible();
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
  });
});

test.describe('roadmap routes render the shared Coming-Soon page', () => {
  test.beforeEach(async ({ context }) => {
    await setPersona(context, 'LEADER_P2');
  });

  for (const [path, title] of [
    ['/insights/leaderboard', 'Leaderboard'],
    ['/insights/introducer-drilldown', 'Introducer Drilldown'],
  ] as const) {
    test(`${path} shows its own quick-link title`, async ({ page }) => {
      const watch = watchConsole(page);
      await page.goto(path);
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
      expect(watch.errors, watch.errors.join('\n')).toEqual([]);
      expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
    });
  }

  for (const path of ['/insights/moc', '/insights/placeholder', '/insights/recommendations', '/insights/set-goals'] as const) {
    test(`${path} shows the generic Coming-Soon page`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('.state')).toBeVisible();
    });
  }
});

test.describe('team drilldown (S-P4-07)', () => {
  test.beforeEach(async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');

    await page.route('**/api/bff/v1/performance/team-drilldown**', async (route) => {
      const url = new URL(route.request().url());
      const query = (url.searchParams.get('query') ?? '').trim();
      const queryLower = query.toLowerCase();
      const selectedAgentId = url.searchParams.get('selectedAgentId') ?? undefined;
      const teamView = (url.searchParams.get('teamView') ?? 'DIRECT') as 'DIRECT' | 'GROUP';
      const hierarchyBasis = (url.searchParams.get('basis') ?? 'AGENT') as 'AGENT' | 'AM' | 'UM';
      const period = (url.searchParams.get('period') ?? 'YTD') as 'MTD' | 'QTD' | 'YTD';
      const businessLine = (url.searchParams.get('businessLine') ?? 'ALL') as 'ALL' | 'INSURANCE' | 'TAKAFUL';
      const performanceBasis = (url.searchParams.get('performanceBasis') ?? 'STANDARD') as 'STANDARD' | 'SCHEME';

      const baseMembers = [
        { agentId: 'A1001', displayName: 'Tan Wei Ming' },
        { agentId: 'A1002', displayName: 'Nur Aisyah' },
      ];
      const members = baseMembers
        .filter((member) => {
          if (!queryLower) return true;
          return (
            member.agentId.toLowerCase().includes(queryLower) ||
            member.displayName.toLowerCase().includes(queryLower)
          );
        })
        .map((member) => ({
          ...member,
          hierarchyBasis,
          roleCode: hierarchyBasis,
        }));

      const selected = selectedAgentId
        ? members.find((member) => member.agentId === selectedAgentId)
        : undefined;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          meta: {
            screenId: 'S-P4-07',
            specVersion: '0.1.0',
            generatedAt: '2026-09-23T06:00:00Z',
            asOfDate: '2026-09-23',
          },
          filters: {
            scope: 'TEAM',
            teamView,
            basis: hierarchyBasis,
            ...(query ? { search: query } : {}),
          },
          members,
          ...(selected
            ? {
                selectedMember: {
                  member: selected,
                  context: {
                    period,
                    businessLine,
                    basis: performanceBasis,
                    scope: 'TEAM',
                    teamView,
                    asOfDate: '2026-09-23',
                  },
                  metrics: [
                    {
                      metricCode: 'TPC',
                      valueType: 'MONEY',
                      value: { kind: 'MONEY', amount: '100000.00', currency: 'MYR' },
                      showGoal: false,
                      delta: {
                        comparisonBasis: 'LAST_YEAR',
                        direction: 'UP',
                        sentiment: 'POSITIVE',
                        display: 'PCT',
                        pct: 12,
                      },
                      nav: { route: 'insights/metric-detail', params: { metricCode: 'TPC' } },
                    },
                    {
                      metricCode: 'PTPC',
                      valueType: 'MONEY',
                      value: { kind: 'MONEY', amount: '72000.00', currency: 'MYR' },
                      showGoal: false,
                      delta: {
                        comparisonBasis: 'LAST_YEAR',
                        direction: 'DOWN',
                        sentiment: 'NEGATIVE',
                        display: 'PCT',
                        pct: -3,
                      },
                      nav: { route: 'insights/metric-detail', params: { metricCode: 'PTPC' } },
                    },
                  ],
                },
              }
            : {}),
        }),
      });
    });
  });

  test('route renders Team Drilldown with filters and selected-member preview', async ({ page }) => {
    const watch = watchConsole(page);
    await page.goto('/insights/team-drilldown');

    await expect(page.getByRole('heading', { name: 'Team Drilldown' })).toBeVisible();
    await expect(page.getByPlaceholder('Search by name or agent code')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();
    await page.getByRole('button', { name: 'Filter' }).click();
    await expect(page.getByRole('tab', { name: 'Direct' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Group' })).toBeVisible();
    await expect(page.locator('.team-drill-member-card').first()).toBeVisible();

    await page.locator('.team-drill-member-card').first().click();
    await expect(page).toHaveURL(/selectedAgentId=/);

    await expect(page.locator('.section .title14', { hasText: 'Member Dashboard Preview' })).toBeVisible();
    await expect(page.locator('.focus-grid .mcard')).toHaveCount(2);

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('search can drive empty member results state', async ({ page }) => {
    await page.goto('/insights/team-drilldown');

    const search = page.getByPlaceholder('Search by name or agent code');
    await search.fill('zzzz-no-match');
    await expect(page.getByText('No members match your search.')).toBeVisible();
    await expect(page.locator('.team-drill-member-card')).toHaveCount(0);
  });
});

test.describe('routing shell', () => {
  test('root redirects to the Performance dashboard', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.goto('/');
    await expect(page).toHaveURL(/insights\/performance/);
  });
});
