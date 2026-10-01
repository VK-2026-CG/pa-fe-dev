import { expect, test } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';

/** S-P4-07 0.2.0 "My Team" + S-P4-01 2.1.0 viewing mode on the 375 mobile shell (SPEC-2026-004). */
test.describe('My Team (S-P4-07) — mobile', () => {
  test.beforeEach(async ({ context }) => {
    await setPersona(context, 'LEADER_P2');
  });

  test('AC-P4-07-10 header, search, chips, KPI tiles and single-column cards', async ({ page }) => {
    const watch = watchConsole(page);
    await page.goto('/insights/team-drilldown');
    await expect(page.getByRole('heading', { name: 'My Team', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeHidden();
    await expect(page.getByText(/^As of \d{2}\/\d{2}\/\d{4}$/)).toBeVisible();
    await expect(page.getByPlaceholder('Search by Name/ID')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filters: All Agent' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sort By: TPC' })).toBeVisible();
    const tiles = page.locator('.td-kpi-label');
    await expect(tiles).toHaveText(['Manpower (M)', 'Activity Ratio (A)', 'Productivity (P)', 'Average Case Size (A)']);
    const cards = page.locator('.td-card');
    await expect(cards).toHaveCount(10); // AM mock: 4 UMs with teams + 6 agents
    const [a, b] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
    expect(b!.y).toBeGreaterThan(a!.y + a!.height); // stacked, one column
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('AC-P4-07-11 member card: badges, goal status, identity, compact TPC/PTPC, subteam button', async ({ page }) => {
    await page.goto('/insights/team-drilldown');
    const marcus = page.locator('.td-card', { hasText: 'Marcus Lee' });
    await expect(marcus.locator('.td-badge')).toHaveText(['MDRT', 'PWP']);
    await expect(marcus.locator('.td-avatar img')).toHaveAttribute('src', '/mock-avatars/marcus-lee.png');
    await expect(marcus.locator('.td-goal-inline')).toHaveText('Goal set');
    await expect(marcus.locator('.td-goal-top')).toBeHidden(); // top-right placement is desktop-only
    await expect(marcus.locator('.td-role')).toHaveText('UM');
    await expect(marcus.locator('.td-values')).toHaveText('TPC172KPTPC198K');
    await expect(marcus.getByRole('button', { name: "View Marcus Lee's team (24)" })).toBeVisible();
    const omar = page.locator('.td-card', { hasText: 'Omar Hassan' });
    await expect(omar.getByRole('button', { name: /team/ })).toHaveCount(0);
    await expect(page.locator('.td-card', { hasText: 'Sophia Patel' }).locator('.td-goal-inline')).toHaveText('Goal not set');
  });

  test('AC-P4-07-12 Filters sheet stages selections and applies only on Confirm', async ({ page }) => {
    await page.goto('/insights/team-drilldown');
    await expect(page.locator('.td-card', { hasText: 'Marcus Lee' })).toBeVisible();
    const before = await page.locator('.td-card').count();
    await page.getByRole('button', { name: 'Filter', exact: true }).click();
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await sheet.getByRole('checkbox', { name: 'All Agent' }).click();
    await sheet.getByRole('checkbox', { name: 'PV' }).first().click();
    await sheet.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('.td-card')).toHaveCount(before);
    await expect(page.getByRole('button', { name: 'Filters: All Agent' })).toBeVisible();

    await page.getByRole('button', { name: 'Filter', exact: true }).click();
    await sheet.getByRole('checkbox', { name: 'All Agent' }).click();
    await sheet.getByRole('checkbox', { name: 'MDRT' }).nth(1).click();
    await sheet.getByRole('checkbox', { name: 'TOT' }).click();
    await sheet.getByRole('checkbox', { name: 'PV' }).first().click();
    await sheet.getByRole('radio', { name: 'PTPC' }).click();
    await sheet.getByRole('button', { name: 'Confirm' }).click();
    await expect(page).toHaveURL(/badges=MDRT%2CTOT%2CPV|badges=MDRT,TOT,PV/);
    await expect(page.getByRole('button', { name: 'Filters: MDRT, TOT, PV' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sort By: PTPC' })).toBeVisible();
    await expect(page.locator('.td-card')).not.toHaveCount(before);
  });

  test('AC-P4-07-13 team button opens that manager\'s drill-down view with scoped search; Back returns to the list', async ({ page }) => {
    const watch = watchConsole(page);
    await page.goto('/insights/team-drilldown');
    await page.getByRole('button', { name: "View Marcus Lee's team (24)" }).click();
    await expect(page).toHaveURL(/sub=KCM00101/);
    // A view of its own, not an overlay: the manager's name leads the page and the list is their team.
    await expect(page.getByRole('heading', { name: "Marcus Lee's Team (24)", level: 1 })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const cards = page.locator('.td-card');
    await expect(cards).toHaveCount(24);
    await expect(page.locator('.td-kpi-label')).toHaveCount(0); // KPI tiles belong to the caller's own team
    await expect(cards.first().locator('.td-goal-inline')).toBeVisible();
    await page.getByPlaceholder('Search by Name/ID').fill('omar');
    await expect(cards).toHaveCount(1);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).not.toHaveURL(/sub=|query=/);
    await expect(page.getByRole('heading', { name: 'My Team', level: 1 })).toBeVisible();
    await expect(cards).toHaveCount(10);
    await expect(page.getByPlaceholder('Search by Name/ID')).toHaveValue('');
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
  });

  test('AC-P4-07-13 / AC-P4-07-14 an agent in a manager\'s team opens that agent\'s self view; Exit View returns to the team', async ({ page }) => {
    const watch = watchConsole(page);
    await page.goto('/insights/team-drilldown');
    await page.getByRole('button', { name: "View Marcus Lee's team (24)" }).click();
    await page.locator('.td-card', { hasText: 'Omar Hassan' }).getByRole('link').click();
    await expect(page).toHaveURL(/insights\/performance\?subjectAgentId=KCM00201/);
    const banner = page.getByRole('region', { name: 'Viewing Omar Hassan' });
    await expect(banner).toContainText('Agent');
    await expect(page.getByLabel('Scope switcher')).toHaveCount(0); // an agent's own (SELF) dashboard
    await banner.getByRole('button', { name: 'Exit View' }).click();
    await expect(page).toHaveURL(/team-drilldown\?sub=KCM00101/);
    await expect(page.getByRole('heading', { name: "Marcus Lee's Team (24)", level: 1 })).toBeVisible();
    await expect(page.locator('.td-card')).toHaveCount(24);
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
  });

  test('AC-P4-07-13 a manager inside a team has its own team button; Back climbs one level at a time', async ({ page }) => {
    // The mock tree has no manager under a UM, so shape one in (UM → UM1 → agents) at the BFF boundary.
    const nested = 'KCM00201';
    let nestedTeam: unknown[] = [];
    await page.route(/\/api\/bff\/v1\/performance\/team-drilldown\?/, async (route) => {
      const parent = new URL(route.request().url()).searchParams.get('parentAgentId');
      if (parent !== 'KCM00101' && parent !== nested) return route.continue();
      const res = await route.fetch();
      const vm = await res.json();
      if (parent === 'KCM00101') {
        nestedTeam = vm.members.slice(1, 4);
        vm.members[0] = { ...vm.members[0], displayName: 'Nina Lead', hierarchyBasis: 'UM', roleCode: 'UM', directReportCount: 3 };
      } else {
        vm.parent = { ...vm.parent, displayName: 'Nina Lead', hierarchyBasis: 'UM', roleCode: 'UM', directReportCount: 3 };
        vm.members = nestedTeam;
      }
      return route.fulfill({ response: res, json: vm });
    });

    await page.goto('/insights/team-drilldown');
    await page.getByRole('button', { name: "View Marcus Lee's team (24)" }).click();
    await page.getByRole('button', { name: "View Nina Lead's team (3)" }).click();
    await expect(page).toHaveURL(/sub=KCM00201/);
    await expect(page.getByRole('heading', { name: "Nina Lead's Team (3)", level: 1 })).toBeVisible();
    await expect(page.locator('.td-card')).toHaveCount(3);

    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: "Marcus Lee's Team (24)", level: 1 })).toBeVisible();
    await expect(page.locator('.td-card')).toHaveCount(24);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'My Team', level: 1 })).toBeVisible();
    await expect(page.locator('.td-card')).toHaveCount(10);
  });

  test('a drill-down link opened cold still works and Back falls back to the My Team list', async ({ page }) => {
    await page.goto('/insights/team-drilldown?sub=KCM00101');
    await expect(page.getByRole('heading', { name: "Marcus Lee's Team (24)", level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(/\/insights\/team-drilldown$/);
    await expect(page.getByRole('heading', { name: 'My Team', level: 1 })).toBeVisible();
  });

  test('AC-P4-07-14 / AC-P4-01-85 / AC-P4-01-86 card opens read-only viewing mode; exit restores the list', async ({ page }) => {
    const watch = watchConsole(page);
    await page.goto('/insights/team-drilldown?sortBy=PTPC');
    await page.locator('.td-card', { hasText: 'Omar Hassan' }).getByRole('link').click();
    await expect(page).toHaveURL(/insights\/performance\?subjectAgentId=/);
    const banner = page.getByRole('region', { name: 'Viewing Omar Hassan' });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Agent');
    await expect(page.getByRole('link', { name: 'Compensation & Benefits' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Team' })).toHaveCount(0);
    await expect(page.getByLabel('Scope switcher')).toHaveCount(0);
    await expect(page.locator('a.mcard')).toHaveCount(0); // metric cards are not links while viewing (OQ-84)
    await banner.getByRole('button', { name: 'Exit View' }).click();
    await expect(page).toHaveURL(/team-drilldown\?sortBy=PTPC/);
    await expect(page.getByRole('button', { name: 'Sort By: PTPC' })).toBeVisible();
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
  });

  test('AC-P4-07-15 search empty state uses bundle copy', async ({ page }) => {
    await page.goto('/insights/team-drilldown');
    await page.getByPlaceholder('Search by Name/ID').fill('zzzz-no-match');
    await expect(page.getByText('No members match your search.')).toBeVisible();
    await expect(page.locator('.td-card')).toHaveCount(0);
  });

  test('Back exits directly to the performance landing page after drilldown search and a drill into a team', async ({ page }) => {
    await page.goto('/insights/performance');
    await page.goto('/insights/team-drilldown');
    await page.getByPlaceholder('Search by Name/ID').fill('mar');
    await page.getByRole('button', { name: "View Marcus Lee's team (24)" }).click();
    await expect(page.getByRole('heading', { name: "Marcus Lee's Team (24)", level: 1 })).toBeVisible();
    // Back from the team restores the list exactly as it was left (search included)...
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('.td-card', { hasText: 'Marcus Lee' })).toBeVisible();
    await expect(page.getByPlaceholder('Search by Name/ID')).toHaveValue('mar');
    // ...and Back from the list leaves My Team for the landing page in one step.
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page).toHaveURL(/\/insights\/performance(?:\?|$)/);
  });
  
  test('P3 leader sees only its direct agents (no subteam buttons)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P3');
    await page.goto('/insights/team-drilldown');
    await expect(page.locator('.td-card').first()).toBeVisible();
    await expect(page.locator('.td-subteam-btn')).toHaveCount(0);
  });
});
