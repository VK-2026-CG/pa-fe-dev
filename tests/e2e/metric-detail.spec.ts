import { expect, test } from '@playwright/test';
import { setPersona } from '../support/personas';
import { watchConsole } from '../support/console';

test.describe('Metric detail (S-P4-02)', () => {
  test('TPC renders sections in BFF order (AC-P4-02-01/03)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    const watch = watchConsole(page);

    await page.goto('/insights/metric-detail?metricCode=TPC');

    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.locator('.card').first()).toBeVisible();

    expect(watch.errors, watch.errors.join('\n')).toEqual([]);
    expect(watch.warnings, watch.warnings.join('\n')).toEqual([]);
  });

  test('TPC SELF has no Penders card; CREDIT_POINTS renders a computed value, not a notice (AC-P4-02-31/33)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    await expect(page.getByRole('status')).toHaveCount(0); // v1.7.0: no more PRODUCT_DATA_MISSING banner
    await expect(page.getByText(/^Penders$/)).toHaveCount(0);
    await expect(page.getByText(/Credit Point/i).first()).toBeVisible();
  });

  test('TPC TEAM shows a Penders card with a case count, distinct from the money penders in the gauge (AC-P4-02-32)', async ({ context, page }) => {
    await setPersona(context, 'LEADER_P2');
    await page.goto('/insights/metric-detail?metricCode=TPC&scope=TEAM');

    await expect(page.getByText(/^Penders$/)).toBeVisible();
  });

  test('breakdown table shows exactly one value column, matching the Business Line filter (AC-P4-02-35)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC'); // default businessLine=ALL ("Both")

    // TPC emits both breakdown.without-repricing and breakdown.with-repricing
    // (AC-P4-02-29) — each table independently has exactly one value column.
    const firstTable = page.locator('table.table').first();
    await expect(firstTable.locator('thead th.colval')).toHaveCount(1);
    await expect(firstTable.locator('thead th.colval')).toHaveText('Both');

    await page.goto('/insights/metric-detail?metricCode=TPC&businessLine=INSURANCE');
    await expect(page.locator('table.table').first().locator('thead th.colval')).toHaveText('Insurance');
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

  test('TPC gauge + comparison combine into one card, stacked below breakpoint.desktop (AC-P4-02-21)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const combined = page.locator('.gauge-comparison');
    await expect(combined).toBeVisible();
    await expect(combined.locator('.gc-gauge')).toBeVisible();
    await expect(combined.locator('.gc-comparison')).toBeVisible();
    await expect(combined).toHaveCSS('flex-direction', 'column');

    // Every other section still renders as its own independent card
    // (AC-P4-02-21). Addressed via the card class, not the word "Penders" —
    // AC-P4-02-23 removed the gauge legend that text used to match.
    await expect(page.locator('.card').filter({ hasText: 'With Repricing' })).toBeVisible();
  });

  test('header region: as-of in the back row, page title below, labelled pills (AC-P4-02-22)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    // As-of moved into the back-bar row; the title is no longer inside it.
    await expect(page.locator('.appbar .detail-asof')).toBeVisible();
    await expect(page.locator('.appbar h1')).toHaveCount(0);
    await expect(page.locator('h1.page-title')).toHaveText('TPC');

    // Back affordance carries a visible label, not just an aria-label.
    await expect(page.locator('.appbar .back .back-label')).toHaveText('Back');

    // Labelled Product/Time pills replace the bare value chips.
    const pills = page.locator('.filter-pill');
    await expect(pills).toHaveCount(2);
    await expect(pills.first()).toContainText('Product');
    await expect(pills.last()).toContainText('Time');
    await expect(pills.last()).toContainText('YTD');
  });

  test('gauge face is value-only with no donut or penders legend below desktop (AC-P4-02-23)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const combined = page.locator('.gauge-comparison');
    await expect(combined.locator('.gauge-value-only')).toBeVisible();
    await expect(combined.locator('svg')).toHaveCount(0);
    await expect(combined.locator('.gauge-legend')).toHaveCount(0);
  });

  test('variant-only headings, bare years and a delta line instead of the growth row (AC-P4-02-24/25)', async ({ context, page }) => {
    await setPersona(context, 'AGENT_P4');
    await page.goto('/insights/metric-detail?metricCode=TPC');

    const combined = page.locator('.gauge-comparison');
    await expect(combined.locator('.title16')).toHaveText('Without Repricing');
    // AC-P4-02-28: comparison half is headed "{period} Comparison".
    await expect(combined.locator('.gc-comparison .title14')).toHaveText('YTD Comparison');
    // Bare year, no "YTD " prefix.
    await expect(combined.getByText('YTD 2026')).toHaveCount(0);
    // Delta renders under the value, and the labelled growth row is gone.
    await expect(combined.locator('.yoy-value .delta-line')).toBeVisible();
    await expect(combined.getByText('% Growth')).toHaveCount(0);
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
