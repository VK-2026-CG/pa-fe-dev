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

    // Priority row header reflects the composed card count (AC-P4-01-06).
    await expect(page.getByText(/Priority Metrics \(\d+\)/)).toBeVisible();
    await expect(page.getByText('Priority Milestones')).toBeVisible();

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('period sheet opens, selects MTD and refetches (AC-P4-01-23)', async ({ page }) => {
    await page.goto('/insights/performance');

    const periodButton = page.locator('button.period-btn');
    await expect(periodButton).toContainText('YTD');
    await periodButton.click();

    // Sheet title comes from the vendored bundle, never inline copy.
    await expect(page.getByText('Time Period')).toBeVisible();

    const mtdOption = page.getByRole('radio').filter({ hasText: 'MTD' });
    await expect(mtdOption).toBeVisible();
    await mtdOption.click();
    await page.getByRole('button', { name: 'Select' }).click();

    await expect(periodButton).toContainText('MTD');
  });

  test('business-line tabs switch the lens (Insurance / Takaful)', async ({ page }) => {
    await page.goto('/insights/performance');

    const tabs = page.getByRole('tab');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');

    const takaful = page.getByRole('tab', { name: 'Takaful' });
    await takaful.click();
    await expect(takaful).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText(/Priority Metrics \(\d+\)/)).toBeVisible();
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
