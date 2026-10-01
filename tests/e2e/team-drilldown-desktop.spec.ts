import { expect, test } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';

/** S-P4-07 0.2.0 desktop (≥1024) + S-P4-01 2.1.0 viewing banner (SPEC-2026-004). */
test.describe('My Team (S-P4-07) — desktop', () => {
  test.beforeEach(async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.setViewportSize({ width: 1024, height: 1366 });
  });

  test('AC-P4-07-10 breadcrumb, 4-column KPI tiles and 2-column card panel', async ({ page }) => {
    const watch = watchConsole(page);
    await page.goto('/insights/team-drilldown');
    const crumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumb.getByRole('link', { name: 'Performance' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Filter', exact: true })).toContainText('Filter');
    const tiles = page.locator('.td-kpi');
    const [t0, t3] = [await tiles.nth(0).boundingBox(), await tiles.nth(3).boundingBox()];
    expect(Math.abs(t0!.y - t3!.y)).toBeLessThan(1);
    const cards = page.locator('.td-panel .td-card');
    const [c0, c1] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
    expect(Math.abs(c0!.y - c1!.y)).toBeLessThan(1);
    expect(c1!.x).toBeGreaterThan(c0!.x + c0!.width);
    // Goal status sits top-right on desktop.
    const goal = cards.nth(0).locator('.td-goal-top');
    await expect(goal).toBeVisible();
    expect((await goal.boundingBox())!.x).toBeGreaterThan(c0!.x + c0!.width / 2);
    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
  });

  test('AC-P4-07-13 team button drills into the manager; the breadcrumb carries the trail back', async ({ page }) => {
    await page.goto('/insights/team-drilldown');
    await page.getByRole('button', { name: "View Marcus Lee's team (24)" }).click();
    await expect(page.getByRole('heading', { name: "Marcus Lee's Team (24)", level: 1 })).toBeVisible();
    await expect(page.locator('.td-panel .td-card')).toHaveCount(24);
    const crumb = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumb.locator('[aria-current="page"]')).toHaveText('Marcus Lee');
    await crumb.getByRole('link', { name: 'My Team' }).click();
    await expect(page).not.toHaveURL(/sub=/);
    await expect(page.getByRole('heading', { name: 'My Team', level: 1 })).toBeVisible();
    await expect(page.locator('.td-panel .td-card')).toHaveCount(10);
  });

  test('AC-P4-07-12 Filters opens as a 608px right drawer', async ({ page }) => {
    await page.goto('/insights/team-drilldown');
    await page.getByRole('button', { name: 'Filter', exact: true }).click();
    const drawer = page.getByRole('dialog', { name: 'Filters' });
    const box = await drawer.boundingBox();
    expect(Math.round(box!.width)).toBe(608);
    expect(Math.round(box!.x + box!.width)).toBe(1024);
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
  });

  test('AC-P4-01-85 / AC-P4-01-87 viewing banner shows Exit View; dashboard rail says My Team', async ({ page }) => {
    await page.goto('/insights/performance?scope=TEAM');
    await page.goto('/insights/team-drilldown');
    await page.locator('.td-card', { hasText: 'Marcus Lee' }).getByRole('link').click();
    const banner = page.getByRole('region', { name: 'Viewing Marcus Lee' });
    await expect(banner.getByRole('button', { name: 'Exit View' })).toBeVisible();
    await expect(banner).toContainText('UM');
    await banner.getByRole('button', { name: 'Exit View' }).click();
    await expect(page).toHaveURL(/team-drilldown/);
    await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Performance' }).click();
    await expect(page).toHaveURL(/insights\/performance/);
  });
});
