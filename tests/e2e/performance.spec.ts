import { expect, test } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';

test.describe('Performance dashboard (S-P4-01) on the 375 mobile shell', () => {
  test.beforeEach(async ({ context }) => {
    await setPersona(context, 'LEADER_P2');
  });

  test('renders chrome, priority cards and milestones with no console errors', async ({ page }) => {
    const watch = watchConsole(page);
    await page.goto('/insights/performance');

    await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible();
    await expect(page.getByText('Metric Tracking')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Quick links' })).toBeVisible();

    // Priority panel header + count badge reflect the composed card count
    // (AC-P4-01-06) — the filter chrome is unified across breakpoints (v1.5.6),
    // so this is the same collapsible panel used on desktop (AC-P4-01-29).
    const panel = page.locator('.metric-panel').filter({ has: page.getByRole('button', { name: 'Priority Metric' }) });
    await expect(panel.getByRole('button', { name: 'Priority Metric' }).locator('.count-badge')).toHaveText(/^\d+$/);
    await expect(page.getByText('Priority Milestones')).toBeVisible();

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('summary pills reflect the active filters and open the combined Filter sheet (AC-P4-01-28, unified v1.5.6)', async ({ page }) => {
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

  test('Priority Metric panel shows a count badge and collapses (AC-P4-01-29, unified v1.5.6)', async ({ page }) => {
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

  test('AI recommendations bar ships collapsed and expands on tap (S-P23-01)', async ({ page }) => {
    await page.goto('/insights/performance');

    const recoBar = page.locator('button.reco-bar');
    await expect(recoBar).toBeVisible();
    await expect(recoBar).toHaveAttribute('aria-expanded', 'false');

    await recoBar.click();
    await expect(recoBar).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.reco-panel')).toBeVisible();
  });

  test('more-actions sheet links to Historical Data (AC-P4-01-22)', async ({ page }) => {
    await page.goto('/insights/performance');

    await page.getByRole('button', { name: 'More actions' }).click();

    // Scope to the sheet: the dashboard header carries its own Customize link.
    const sheet = page.locator('.sheet');
    await expect(sheet).toBeVisible();
    await sheet.getByRole('link', { name: /Historical Data/i }).click();

    await expect(page).toHaveURL(/insights\/history/);
  });
});
