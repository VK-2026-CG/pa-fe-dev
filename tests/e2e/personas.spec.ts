import { expect, test } from '@playwright/test';
import { personaCookie } from '../support/personas';

/** Entitlement is authoritative at the BFF (D-14); the UI must reflect it, not invent it. */
test.describe('persona entitlements on the dashboard', () => {
  test('P2 leader sees the scope switcher', async ({ context, page }) => {
    await context.addCookies([personaCookie('LEADER_P2')]);
    await page.goto('/insights/performance');
    await expect(page.locator('button.scope-pill')).toBeVisible();
  });

  test('P3 leader sees the scope switcher but no Group toggle in TEAM (AC-P4-01-16)', async ({ context, page }) => {
    await context.addCookies([personaCookie('LEADER_P3')]);
    await page.goto('/insights/performance');

    const scopePill = page.locator('button.scope-pill');
    await expect(scopePill).toBeVisible();
    await scopePill.click();
    await page.getByRole('menuitem').filter({ hasText: 'Team' }).click();

    await expect(page.getByText(/Priority Metrics \(\d+\)/)).toBeVisible();
    await expect(page.getByRole('switch', { name: /Group/i })).toHaveCount(0);
  });

  test('P4 agent gets no scope switcher at all (AC-P4-01-19)', async ({ context, page }) => {
    await context.addCookies([personaCookie('AGENT_P4')]);
    await page.goto('/insights/performance');

    await expect(page.getByText(/Priority Metrics \(\d+\)/)).toBeVisible();
    await expect(page.locator('button.scope-pill')).toHaveCount(0);
  });
});
