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

// S-P4-07 journeys moved to team-drilldown.spec.ts / team-drilldown-desktop.spec.ts (spec 0.2.0, SPEC-2026-004).

test.describe('routing shell', () => {
  test('root redirects to the Performance dashboard', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.goto('/');
    await expect(page).toHaveURL(/insights\/performance/);
  });
});
