import { expect, test } from '@playwright/test';
import { personaCookie } from '../support/personas';
import { watchConsole } from '../support/console';

test.describe('Historical data (S-P4-03)', () => {
  test('3-year window renders year columns and no MoM column (AC-P4-03-02)', async ({ context, page }) => {
    await context.addCookies([personaCookie('AGENT_P4')]);
    const watch = watchConsole(page);

    await page.goto('/insights/history?metricCode=TPC&window=VS_LAST_2_YEARS');

    await expect(page.getByRole('columnheader', { name: '2026' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '2025' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '2024' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /MoM/i })).toHaveCount(0);

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('current-year window shows the MoM column with N/A for January (AC-P4-03-09)', async ({ context, page }) => {
    await context.addCookies([personaCookie('AGENT_P4')]);
    await page.goto('/insights/history?metricCode=TPC&window=CURRENT_YEAR');

    await expect(page.getByRole('columnheader', { name: '2026' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /MoM/i })).toBeVisible();

    const january = page.getByRole('row').filter({ hasText: 'Jan' }).first();
    await expect(january).toContainText('N/A');
  });

  test('metric pill switches the series (AC-P4-03-12)', async ({ context, page }) => {
    await context.addCookies([personaCookie('LEADER_P2')]);
    await page.goto('/insights/history?metricCode=TPC&window=CURRENT_YEAR');

    const caseCount = page.getByRole('tab', { name: 'Case Count' });
    await caseCount.click();
    await expect(caseCount).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(/metricCode=CASE_COUNT/);
  });

  test('window pager walks older/newer and disables at the ends', async ({ context, page }) => {
    await context.addCookies([personaCookie('AGENT_P4')]);
    await page.goto('/insights/history?metricCode=TPC&window=CURRENT_YEAR');

    // Newest window → cannot go newer.
    await expect(page.getByRole('button', { name: 'Newer window' })).toBeDisabled();

    await page.getByRole('button', { name: 'Older window' }).click();
    await expect(page).toHaveURL(/window=VS_LAST_YEAR/);
    await expect(page.getByRole('button', { name: 'Newer window' })).toBeEnabled();
  });
});
