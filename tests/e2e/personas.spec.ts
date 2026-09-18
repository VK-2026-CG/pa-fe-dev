import { expect, test } from '@playwright/test';
import { setPersona } from '../support/personas';

/** Entitlement is authoritative at the BFF (D-14); the UI must reflect it, not invent it. */
test.describe('persona entitlements on the dashboard', () => {
  test('P2 leader sees the scope switcher', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.goto('/insights/performance');
    await expect(page.getByLabel('Scope switcher')).toBeVisible();
  });

  test('P3 leader sees the scope switcher but no Group toggle in TEAM (AC-P4-01-16)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P3');
    await page.goto('/insights/performance');

    const scopeSwitcher = page.getByLabel('Scope switcher');
    await expect(scopeSwitcher).toBeVisible();
    await scopeSwitcher.selectOption('TEAM');

    await expect(page.getByRole('button', { name: /Product/ })).toBeVisible();
    await page.getByRole('button', { name: 'Filter' }).click();
    await expect(page.locator('.sheet')).toBeVisible();
    await expect(page.getByRole('switch', { name: /Group/i })).toHaveCount(0);
  });

  test('P4 agent gets no scope switcher at all (AC-P4-01-19)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/performance');

    await expect(page.getByRole('button', { name: /Product/ })).toBeVisible();
    await expect(page.getByLabel('Scope switcher')).toHaveCount(0);
  });
});
