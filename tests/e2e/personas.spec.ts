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
    await scopeSwitcher.click();
    await page.locator('.sheet').getByRole('radio', { name: 'Team' }).click();
    await page.locator('.sheet').getByRole('button', { name: 'Apply' }).click();

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

  test('scope switcher shows the icon only below breakpoint.tablet (AC-P4-01-42)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.goto('/insights/performance');

    const scopeSwitcher = page.getByLabel('Scope switcher');
    await expect(scopeSwitcher).toBeVisible();
    // 375px viewport (this project's shell) is below breakpoint.tablet (768px):
    // the label stays out of the visual layout; the control opens the mobile
    // view bottom sheet.
    await expect(page.locator('.scope-pill-label')).not.toBeVisible();
    await scopeSwitcher.click();
    const sheet = page.getByRole('dialog', { name: 'View' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('radio', { name: 'Self' })).toBeVisible();
    await expect(sheet.getByRole('radio', { name: 'Team' })).toBeVisible();
    await sheet.getByRole('radio', { name: 'Team' }).click();
    await sheet.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByRole('button', { name: /Product/ })).toBeVisible();
  });

  test('mobile view sheet stages changes until Apply and Cancel discards them', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.goto('/insights/performance');

    await page.getByLabel('Scope switcher').click();
    const sheet = page.locator('.sheet');
    await sheet.getByRole('radio', { name: 'Team' }).click();
    await expect(sheet.getByRole('radio', { name: 'Team' })).toHaveAttribute('aria-checked', 'true');
    await sheet.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('.sheet')).toHaveCount(0);

    await page.getByLabel('Scope switcher').click();
    await expect(page.locator('.sheet').getByRole('radio', { name: 'Self' })).toHaveAttribute('aria-checked', 'true');
  });

  test('Performance heading appends a teamView suffix for TEAM, data-driven not persona-driven (AC-P4-01-75)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.goto('/insights/performance');
    await expect(page.getByRole('heading', { name: 'Performance', exact: true })).toBeVisible();

    await page.getByLabel('Scope switcher').click();
    await page.locator('.sheet').getByRole('radio', { name: 'Team', exact: true }).click();
    await page.locator('.sheet').getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByRole('heading', { name: 'Performance (Direct View)', exact: true })).toBeVisible();

    await page.getByLabel('Scope switcher').click();
    await page.locator('.sheet').getByRole('button', { name: 'Team view: Direct' }).click();
    await page.locator('.sheet').getByRole('radiogroup', { name: 'Team view' }).getByText('Group', { exact: true }).click();
    await page.locator('.sheet').getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByRole('heading', { name: 'Performance (Group View)', exact: true })).toBeVisible();

    await setPersona(context, 'LEADER_P3');
    await page.goto('/insights/performance');
    await page.getByLabel('Scope switcher').click();
    await page.locator('.sheet').getByRole('radio', { name: 'Team', exact: true }).click();
    await page.locator('.sheet').getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByRole('heading', { name: 'Performance (Direct View)', exact: true })).toBeVisible();
  });
});
