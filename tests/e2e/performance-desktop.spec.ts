import { expect, test } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';

/**
 * Desktop chrome (A7, v1.4.0, screenshot-derived) — runs in the `desktop`
 * Playwright project (1440×1000). Mobile behavior is covered by
 * tests/e2e/performance.spec.ts and must stay untouched by anything here.
 */
test.describe('Performance dashboard (S-P4-01) desktop chrome (≥1024px)', () => {
  test.beforeEach(async ({ context }) => {
    await setPersona(context, 'LEADER_P2');
  });

  test('replaces mobile controls with a Filter action + summary pills, no console errors', async ({ page }) => {
    const watch = watchConsole(page);
    await page.goto('/insights/performance');

    await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();

    // Mobile-only controls must not render at all at this breakpoint (AC-P4-01-28).
    await expect(page.locator('button.period-btn')).toHaveCount(0);
    await expect(page.getByRole('tab')).toHaveCount(0);

    // Exactly one "More actions" trigger — no duplicate hidden copy from the mobile header.
    await expect(page.getByRole('button', { name: 'More actions' })).toHaveCount(1);

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('summary pills reflect the active filters and open the combined Filter sheet (AC-P4-01-28)', async ({ page }) => {
    await page.goto('/insights/performance');

    const productPill = page.getByRole('button', { name: /Product/ });
    const timePill = page.getByRole('button', { name: /Time/ });
    await expect(productPill).toContainText('Both');
    await expect(timePill).toContainText('YTD');

    await productPill.click();
    const sheet = page.locator('.sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('tab', { name: 'Takaful' })).toBeVisible();
    await expect(sheet.getByRole('radio').filter({ hasText: 'MTD' })).toBeVisible();

    await sheet.getByRole('tab', { name: 'Takaful' }).click();
    await sheet.getByRole('radio').filter({ hasText: 'MTD' }).click();
    await sheet.getByRole('button', { name: 'Select' }).click();

    await expect(productPill).toContainText('Takaful');
    await expect(timePill).toContainText('MTD');
  });

  test('Priority Metric panel shows a count badge and collapses (AC-P4-01-29)', async ({ page }) => {
    await page.goto('/insights/performance');

    const panel = page.locator('.metric-panel').filter({ has: page.getByRole('button', { name: 'Priority Metric' }) });
    const toggle = panel.getByRole('button', { name: 'Priority Metric' });
    await expect(toggle).toBeVisible();
    await expect(toggle.locator('.count-badge')).toHaveText(/^\d+$/);

    const collapseBtn = panel.getByRole('button', { name: 'Collapse' });
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();
    await expect(panel.getByRole('button', { name: 'Expand' })).toBeVisible();
  });

  test('Other Focus Metric header stays visible even when empty, with a "+" add affordance (AC-P4-01-26/27)', async ({ page }) => {
    await page.goto('/insights/performance');

    const panel = page.locator('.metric-panel').filter({ has: page.getByRole('button', { name: 'Other Focus Metric' }) });
    const toggle = panel.getByRole('button', { name: 'Other Focus Metric' });
    await expect(toggle).toBeVisible();
    const count = await toggle.locator('.count-badge').innerText();

    if (count === '0') {
      await expect(panel.getByRole('link', { name: 'Add focus metric' })).toBeVisible();
    } else {
      await expect(panel.getByRole('button', { name: 'Collapse' })).toBeVisible();
    }
  });
});
