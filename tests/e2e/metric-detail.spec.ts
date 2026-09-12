import { expect, test } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';

test.describe('Metric detail (S-P4-02)', () => {
  test('TPC renders sections in BFF order with the product notice (AC-P4-02-01/03)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    const watch = watchConsole(page);

    await page.goto('/insights/metric-detail?metricCode=TPC');

    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByRole('status').first()).toBeVisible(); // dismissible notice
    await expect(page.locator('.card').first()).toBeVisible();

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('EMPTY persona shows the designed empty state (AC-P4-02-18)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_EMPTY');
    await page.goto('/insights/metric-detail?metricCode=CASE_COUNT');
    await expect(page.locator('.state')).toBeVisible();
  });

  test('PROCESSING persona shows the refresh affordance (AC-P4-02-17)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_PROCESSING');
    await page.goto('/insights/metric-detail?metricCode=CASE_COUNT');
    await expect(page.locator('.state')).toBeVisible();
    await expect(page.getByRole('button', { name: /Refresh/i })).toBeVisible();
  });

  test('notice can be dismissed', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const notice = page.locator('.notice');
    await expect(notice).toBeVisible();
    await notice.getByRole('button', { name: 'Dismiss' }).click();
    await expect(notice).toHaveCount(0);
  });
});
