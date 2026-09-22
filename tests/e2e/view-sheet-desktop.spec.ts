import { expect, test } from '@playwright/test';
import { setPersona } from '../support/personas';

for (const width of [768, 1440]) {
  test(`View scope menu remains unchanged at ${width}px (AC-P4-01-69)`, async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/insights/performance');
    const trigger = page.getByRole('button', { name: 'Scope switcher' });
    await trigger.click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'View', exact: true })).toHaveCount(0);
    const response = page.waitForResponse(r => r.url().includes('/api/bff/v1/performance/dashboard') && new URL(r.url()).searchParams.get('scope') === 'TEAM');
    await menu.getByRole('menuitem', { name: 'Team', exact: true }).click();
    expect((await response).ok()).toBe(true);
    await expect(page.locator('.scope-pill-label')).toHaveText('Team');
    await expect(page.getByRole('button', { name: /^Team view:/ })).toHaveCount(0);
  });
}